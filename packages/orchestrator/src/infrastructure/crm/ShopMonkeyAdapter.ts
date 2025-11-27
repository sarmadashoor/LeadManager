import { CreateLeadData } from '../persistence/repositories/LeadRepository';

export interface ShopMonkeyConfig {
  apiKey: string;
  baseUrl: string;
  demoMode?: boolean;  // When true, only process test leads
}

export interface ShopMonkeyOrder {
  id: string;
  number: string;
  name: string | null;
  customerId: string;
  vehicleId: string | null;
  coalescedName: string | null;
  complaint: string | null;
  status: string;
  authorized: boolean;
  totalCostCents: number;
  createdDate: string;
  updatedDate: string;
  locationId: string;
  generatedCustomerName: string | null;
  generatedVehicleName: string | null;
  messageCount: number;
  workflowStatusId: string;
}

export interface ShopMonkeyCustomer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emails: Array<{ email: string; primary: boolean }>;
  phoneNumbers: Array<{ number: string; primary: boolean; type: string }>;
}

export interface ShopMonkeyVehicle {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
}

export interface ShopMonkeyCannedService {
  id: string;
  name: string;
  locationId: string;
  companyId: string;
  totalCents: number;
  calculatedLaborCents: number;
  calculatedPartsCents: number;
  calculatedFeeCents: number;
  calculatedSubcontractsCents: number;
  calculatedTiresCents: number;
  discountCents: number;
  taxCents: number;
  note: string | null;
  pricing: string; // 'LineItem', etc.
  deleted: boolean;
  createdDate: string;
  updatedDate: string;
  bookable: boolean;
  fees?: Array<{
    id: string;
    name: string;
    amountCents: number;
  }>;
  labors?: Array<{
    id: string;
    name: string;
    hours?: number;
    rateCents?: number;
  }>;
  parts?: Array<any>;
  subcontracts?: Array<any>;
  tires?: Array<any>;
}

// Workflow Status IDs from Tint World ShopMonkey
const WORKFLOW_STATUS = {
  WEBSITE_LEADS: '619813fb2c9c3e8ce527be48',
  INVOICED: '619813fb2c9c3e7f6a27be4b',
  APPOINTMENTS: '65fb14d76ee665db4d8d2ce0'
};

// Demo mode: Only process these test leads
const DEMO_MODE_EMAILS = ['sarmadashoor1@gmail.com'];

export class ShopMonkeyAdapter {
  private apiKey: string;
  private baseUrl: string;
  private demoMode: boolean;

  constructor(config: ShopMonkeyConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.shopmonkey.cloud/v3';
    this.demoMode = config.demoMode ?? true;  // Default to demo mode for safety
  }

 private async request<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${this.baseUrl}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`ShopMonkey API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

  async fetchOrders(params: { limit?: number } = {}): Promise<ShopMonkeyOrder[]> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', params.limit.toString());
    
    const query = queryParams.toString();
    const endpoint = `/order${query ? `?${query}` : ''}`;
    
    const response = await this.request<{ data: ShopMonkeyOrder[] }>(endpoint);
    return response.data;
  }

  async getCustomer(customerId: string): Promise<ShopMonkeyCustomer | null> {
    try {
      const response = await this.request<{ data: ShopMonkeyCustomer }>(`/customer/${customerId}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getVehicle(vehicleId: string): Promise<ShopMonkeyVehicle | null> {
    if (!vehicleId) return null;
    try {
      const response = await this.request<{ data: ShopMonkeyVehicle }>(`/vehicle/${vehicleId}`);
      return response.data;
    } catch {
      return null;
    }
  }

  extractCustomerEmail(customer: ShopMonkeyCustomer | null): string | undefined {
    if (!customer?.emails?.length) return undefined;
    const primary = customer.emails.find(e => e.primary);
    return primary?.email || customer.emails[0]?.email;
  }

  extractCustomerPhone(customer: ShopMonkeyCustomer | null): string | undefined {
    if (!customer?.phoneNumbers?.length) return undefined;
    const mobile = customer.phoneNumbers.find(p => p.type === 'Mobile');
    const primary = customer.phoneNumbers.find(p => p.primary);
    return mobile?.number || primary?.number || customer.phoneNumbers[0]?.number;
  }

  extractCustomerName(customer: ShopMonkeyCustomer | null, fallback: string | null): string | undefined {
    if (customer?.firstName || customer?.lastName) {
      return [customer.firstName, customer.lastName].filter(Boolean).join(' ');
    }
    return fallback || undefined;
  }

  /**
   * A "Website Lead" is an order that:
   * 1. Is in the Website Leads swim lane
   * 2. Has status = Estimate
   * 3. Is not yet authorized
   * 4. Has not been messaged via ShopMonkey
   * 5. Name starts with "New Quote" (website-generated)
   */
  isWebsiteLead(order: ShopMonkeyOrder): boolean {
    return (
      order.workflowStatusId === WORKFLOW_STATUS.WEBSITE_LEADS &&
      order.status === 'Estimate' &&
      order.authorized === false &&
      order.messageCount === 0 &&
      (order.name?.startsWith('New Quote') ?? false)
    );
  }

  /**
   * Demo mode filter: Only allows test leads through
   */
  isDemoModeLead(customer: ShopMonkeyCustomer | null): boolean {
    const email = this.extractCustomerEmail(customer)?.toLowerCase();
    return email ? DEMO_MODE_EMAILS.includes(email) : false;
  }

  isWindowTintingOrder(order: ShopMonkeyOrder): boolean {
    const searchText = [order.coalescedName, order.complaint, order.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchText.includes('tint') || searchText.includes('window');
  }

  /**
   * Fetch all canned services from ShopMonkey
   * Returns ALL services across all locations for the company
   */
  async fetchCannedServices(params: { limit?: number } = {}): Promise<ShopMonkeyCannedService[]> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', params.limit.toString());
    
    const query = queryParams.toString();
    const endpoint = `/canned_service${query ? `?${query}` : ''}`;
    
    const response = await this.request<{ data: ShopMonkeyCannedService[] }>(endpoint);
    
    // Filter out deleted services
    return response.data.filter(service => !service.deleted);
  }

  /**
   * Fetch qualified website leads
   * - Website Leads swim lane only
   * - No message history
   * - Window tinting related
   * - Demo mode: Only test emails
   */
  async fetchWebsiteLeads(): Promise<CreateLeadData[]> {
    const orders = await this.fetchOrders({ limit: 500 });
    const leads: CreateLeadData[] = [];

    for (const order of orders) {
      if (!this.isWebsiteLead(order)) continue;
      if (!this.isWindowTintingOrder(order)) continue;

      const customer = await this.getCustomer(order.customerId);
      
      // Demo mode safety: Skip real customers
      if (this.demoMode && !this.isDemoModeLead(customer)) continue;

      const vehicle = order.vehicleId ? await this.getVehicle(order.vehicleId) : null;

      leads.push({
        crm_source: 'shopmonkey',
        crm_work_order_id: order.id,
        crm_work_order_number: order.number,
        service_type: 'window-tinting',
        service_name: order.coalescedName || order.name || undefined,
        service_specifications: order.complaint || undefined,
        estimated_cost_cents: order.totalCostCents,
        customer_external_id: order.customerId,
        customer_name: this.extractCustomerName(customer, order.generatedCustomerName),
        customer_email: this.extractCustomerEmail(customer),
        customer_phone: this.extractCustomerPhone(customer),
        vehicle_external_id: order.vehicleId || undefined,
        vehicle_year: vehicle?.year || undefined,
        vehicle_make: vehicle?.make || undefined,
        vehicle_model: vehicle?.model || undefined,
        vehicle_description: order.generatedVehicleName || undefined,
        crm_metadata: { 
          shopmonkey_location_id: order.locationId,
          original_status: order.status,
          workflow_status_id: order.workflowStatusId
        }
      });
    }

    console.log(`[ShopMonkey] Demo mode: ${this.demoMode ? 'ON' : 'OFF'}`);
    console.log(`[ShopMonkey] Found ${leads.length} qualified leads`);
    
    return leads;
  }
}
