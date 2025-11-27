import { Knex } from 'knex';
import { ShopMonkeyAdapter, ShopMonkeyCannedService } from '../crm/ShopMonkeyAdapter';
import { ServiceCatalogRepository } from '../persistence/repositories/ServiceCatalogRepository';

export interface SyncResult {
  locationId: string;
  servicesProcessed: number;
  servicesUpserted: number;
  servicesMarkedInactive: number;
  errors: string[];
}

export class ServiceSyncService {
  private serviceCatalogRepo: ServiceCatalogRepository;

  constructor(
    private db: Knex,
    private shopMonkeyAdapter: ShopMonkeyAdapter,
    private tenantId: string
  ) {
    this.serviceCatalogRepo = new ServiceCatalogRepository(db);
  }

  /**
   * Sync all services from ShopMonkey to database
   * Fetches all services once, then groups by location
   */
  async syncAllServices(): Promise<{
    totalLocations: number;
    totalServices: number;
    results: SyncResult[];
  }> {
    console.log('[ServiceSync] Starting sync for tenant:', this.tenantId);

    // Fetch ALL services in one API call
    const allServices = await this.shopMonkeyAdapter.fetchCannedServices({ limit: 1000 });
    console.log(`[ServiceSync] Fetched ${allServices.length} services from ShopMonkey`);

    // Group services by location
    const servicesByLocation = this.groupServicesByLocation(allServices);
    console.log(`[ServiceSync] Found ${servicesByLocation.size} locations with services`);

    // Sync each location
    const results: SyncResult[] = [];
    for (const [locationExternalId, services] of servicesByLocation.entries()) {
      const result = await this.syncLocationServices(locationExternalId, services);
      results.push(result);
    }

    const totalServices = results.reduce((sum, r) => sum + r.servicesUpserted, 0);
    
    console.log('[ServiceSync] Sync complete:', {
      locations: results.length,
      services: totalServices,
    });

    return {
      totalLocations: results.length,
      totalServices,
      results,
    };
  }

  /**
   * Group services by locationId
   */
  private groupServicesByLocation(
    services: ShopMonkeyCannedService[]
  ): Map<string, ShopMonkeyCannedService[]> {
    const grouped = new Map<string, ShopMonkeyCannedService[]>();

    for (const service of services) {
      if (!service.locationId) continue;

      if (!grouped.has(service.locationId)) {
        grouped.set(service.locationId, []);
      }
      grouped.get(service.locationId)!.push(service);
    }

    return grouped;
  }

  /**
   * Sync services for a single location
   */
  private async syncLocationServices(
    locationExternalId: string,
    services: ShopMonkeyCannedService[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      locationId: locationExternalId,
      servicesProcessed: services.length,
      servicesUpserted: 0,
      servicesMarkedInactive: 0,
      errors: [],
    };

    try {
      // Get internal location ID from external ID
      const location = await this.db('locations')
        .where({
          tenant_id: this.tenantId,
          external_id: locationExternalId,
        })
        .first();

      if (!location) {
        result.errors.push(`Location not found: ${locationExternalId}`);
        return result;
      }

      // Upsert each service
      for (const service of services) {
        try {
          await this.serviceCatalogRepo.upsertService({
            tenant_id: this.tenantId,
            location_id: location.id,
            service_type: this.detectServiceType(service.name),
            name: service.name,
            description: service.note || undefined,
            base_price_cents: service.totalCents,
            duration_minutes: this.estimateDuration(service),
            requires_appointment: service.bookable,
            display_order: 0,
            is_active: true,
            crm_service_id: service.id,
          });
          result.servicesUpserted++;
        } catch (error: any) {
          result.errors.push(`Failed to upsert service ${service.id}: ${error.message}`);
        }
      }

      // Mark stale services as inactive
      const markedInactive = await this.serviceCatalogRepo.markStaleServicesInactive(
        this.tenantId,
        location.id,
        48 // 48 hours
      );
      result.servicesMarkedInactive = markedInactive;

    } catch (error: any) {
      result.errors.push(`Location sync failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Detect service type from name (basic heuristic)
   */
  private detectServiceType(name: string): string {
    const nameLower = name.toLowerCase();
    
    // Core services
    if (nameLower.includes('tint')) return 'window-tinting';
    if (nameLower.includes('ppf') || nameLower.includes('paint protection')) return 'ppf';
    if (nameLower.includes('ceramic') || nameLower.includes('coating')) return 'ceramic-coating';
    if (nameLower.includes('wrap')) return 'vinyl-wrap';
    if (nameLower.includes('detail')) return 'detailing';
    
    // Electronics & Audio
    if (nameLower.includes('amplifier') || nameLower.includes('amp')) return 'audio';
    if (nameLower.includes('speaker')) return 'audio';
    if (nameLower.includes('radio') || nameLower.includes('audio')) return 'audio';
    if (nameLower.includes('subwoofer') || nameLower.includes('sub enclosure')) return 'subwoofer-enclosure';
    if (nameLower.includes('converter') || nameLower.includes('line output')) return 'electronics';
    if (nameLower.includes('dsp') || nameLower.includes('equalizer')) return 'electronics';
    
    // Navigation & Tracking
    if (nameLower.includes('navigation') || nameLower.includes('gps')) return 'navigation';
    if (nameLower.includes('tracking')) return 'navigation';
    
    // Security & Safety
    if (nameLower.includes('breathalyzer')) return 'breathalyzer';
    if (nameLower.includes('backup') || nameLower.includes('back up')) return 'security';
    if (nameLower.includes('blind spot') || nameLower.includes('sensor')) return 'security';
    if (nameLower.includes('security') || nameLower.includes('alarm')) return 'security';
    if (nameLower.includes('avital') || nameLower.includes('remote start')) return 'security';
    
    // Accessories & Exterior
    if (nameLower.includes('bedliner') || nameLower.includes('bed liner') || nameLower.includes('bed-liner')) return 'bedliner';
    if (nameLower.includes('blackout trim')) return 'exterior-trim';
    if (nameLower.includes('chrome delete')) return 'accessories';
    if (nameLower.includes('visor')) return 'accessories';
    if (nameLower.includes('headlight') || nameLower.includes('tail light')) return 'lighting';
    
    // Interior & Sanitation
    if (nameLower.includes('biopledge') || nameLower.includes('antimicrobial')) return 'sanitation';
    
    // Admin
    if (nameLower.includes('deposit')) return 'deposit';
    
    return 'other';
  }

  /**
   * Estimate duration from labor hours (basic calculation)
   */
  private estimateDuration(service: ShopMonkeyCannedService): number | undefined {
    if (!service.labors || service.labors.length === 0) return undefined;

    const totalHours = service.labors.reduce((sum, labor) => {
      return sum + (labor.hours || 0);
    }, 0);

    return totalHours > 0 ? Math.round(totalHours * 60) : undefined;
  }
}
