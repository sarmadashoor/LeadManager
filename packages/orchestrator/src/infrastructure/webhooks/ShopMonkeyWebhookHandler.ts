import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { LeadRepository } from '../persistence/repositories/LeadRepository';
import { ShopMonkeyAdapter } from '../crm/ShopMonkeyAdapter';
import { calculateNextTouchPointTime } from '../../domain/TouchPointSchedule';
import { db } from '../persistence/db';

interface ShopMonkeyWebhookPayload {
  event: string;
  data: {
    id: string;
    number?: string;
    locationId?: string;
    workflowStatusId?: string;
    status?: string;
    authorized?: boolean;
    messageCount?: number;
    name?: string;
    customerId?: string;
    vehicleId?: string;
    appointmentDates?: any[];
    invoiced?: boolean;
    paid?: boolean;
    generatedCustomerName?: string;
    generatedVehicleName?: string;
    [key: string]: any;
  };
}

export function registerShopMonkeyWebhook(
  fastify: FastifyInstance,
  tenantId: string,
  shopMonkeyConfig: { apiKey: string; baseUrl: string; demoMode: boolean }
) {
  const leadRepo = new LeadRepository();
  const shopMonkey = new ShopMonkeyAdapter(shopMonkeyConfig);

  // Health check endpoint
  fastify.get('/webhooks/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Main webhook endpoint
  fastify.post(
    '/webhooks/shopmonkey/order',
    async (request: FastifyRequest<{ Body: ShopMonkeyWebhookPayload }>, reply: FastifyReply) => {
      const startTime = Date.now();

      try {
        const payload = request.body;

        fastify.log.info({
          event: payload.event,
          orderId: payload.data?.id,
          timestamp: new Date().toISOString()
        }, '[Webhook] Received from ShopMonkey');

        const orderData = payload.data;
        
        // Log what we received for debugging
        fastify.log.info({
          orderId: orderData.id,
          workflowStatusId: orderData.workflowStatusId,
          status: orderData.status,
          appointmentDates: orderData.appointmentDates?.length || 0,
          messageCount: orderData.messageCount,
          customerId: orderData.customerId,
          vehicleId: orderData.vehicleId,
          locationId: orderData.locationId
        }, '[Webhook] Order received');

        // Check if this is a website lead using comprehensive criteria
        const isWebsiteLead =
          // Accept both workflow statuses (Website Leads or Appointments without actual appointment)
          (orderData.workflowStatusId === '619813fb2c9c3e8ce527be48' || 
           orderData.workflowStatusId === '65fb14d76ee665db4d8d2ce0') &&
          // Must be an estimate, not authorized
          orderData.status === 'Estimate' &&
          orderData.authorized === false &&
          // Nobody has contacted them yet
          orderData.messageCount === 0 &&
          // From website form
          orderData.name?.startsWith('New Quote') &&
          // CRITICAL: No actual appointment scheduled
          (!orderData.appointmentDates || orderData.appointmentDates.length === 0) &&
          // Not invoiced or paid
          orderData.invoiced === false &&
          orderData.paid === false;

        if (!isWebsiteLead) {
          fastify.log.info({ orderId: orderData.id }, '[Webhook] Not a website lead - skipping');
          return reply.code(200).send({ received: true, processed: false, reason: 'Not a website lead' });
        }

        fastify.log.info({ orderId: orderData.id }, '[Webhook] Website lead detected - fetching full data');

        // ⭐ Look up location in our database using external_id (ShopMonkey location ID)
        const location = await db('locations')
          .where({
            tenant_id: tenantId,
            external_id: orderData.locationId
          })
          .first();

        if (!location) {
          fastify.log.error({ 
            orderId: orderData.id, 
            shopMonkeyLocationId: orderData.locationId 
          }, '[Webhook] Location not found in database');
          return reply.code(200).send({ 
            received: true, 
            processed: false, 
            reason: 'Location not found' 
          });
        }

        fastify.log.info({ 
          orderId: orderData.id, 
          locationId: location.id,
          locationName: location.name
        }, '[Webhook] Location found');

        // Fetch full customer and vehicle data from ShopMonkey API
        let customerData = null;
        let vehicleData = null;

        try {
          if (orderData.customerId) {
            customerData = await shopMonkey.getCustomer(orderData.customerId);
            fastify.log.info({ 
              customerId: orderData.customerId, 
              hasEmail: !!shopMonkey.extractCustomerEmail(customerData) 
            }, '[Webhook] Customer data fetched');
          } else {
            fastify.log.warn({ orderId: orderData.id }, '[Webhook] No customer ID in order');
          }

          if (orderData.vehicleId) {
            vehicleData = await shopMonkey.getVehicle(orderData.vehicleId);
            fastify.log.info({ vehicleId: orderData.vehicleId }, '[Webhook] Vehicle data fetched');
          }
        } catch (fetchError) {
          fastify.log.error({ error: fetchError, orderId: orderData.id }, '[Webhook] Error fetching customer/vehicle data from ShopMonkey');
          // Continue anyway - we'll store what we have
        }

        // Build comprehensive lead data using ShopMonkeyAdapter helper methods
        const leadData = {
          crm_source: 'shopmonkey',
          crm_work_order_id: orderData.id,
          crm_work_order_number: orderData.number?.toString() || orderData.name,
          service_type: 'window-tinting',
          service_name: orderData.name || 'New Quote',
          // ⭐ NEW: Include location_id (now required)
          location_id: location.id,
          // Customer data (using adapter's extraction methods)
          customer_external_id: orderData.customerId,
          customer_name: shopMonkey.extractCustomerName(customerData, orderData.generatedCustomerName || null),
          customer_email: shopMonkey.extractCustomerEmail(customerData),
          customer_phone: shopMonkey.extractCustomerPhone(customerData),
          // Vehicle data (convert null to undefined for type compatibility)
          vehicle_external_id: orderData.vehicleId || undefined,
          vehicle_year: vehicleData?.year || undefined,
          vehicle_make: vehicleData?.make || undefined,
          vehicle_model: vehicleData?.model || undefined,
          vehicle_description: orderData.generatedVehicleName || undefined,
          // Metadata
          crm_metadata: {
            ...orderData,
            shopmonkey_location_id: orderData.locationId,
            fetched_customer_data: !!customerData,
            fetched_vehicle_data: !!vehicleData
          }
        };

        // Validate we have minimum required data
        if (!leadData.customer_email && !leadData.customer_phone) {
          fastify.log.warn(
            { orderId: orderData.id, customerId: orderData.customerId },
            '[Webhook] No email or phone available - lead will be imported but cannot be contacted'
          );
        }

        const { lead, created } = await leadRepo.upsert(tenantId, leadData);

        // Schedule initial touch point for new leads (only if we have contact info)
        if (created && (lead.customer_email || lead.customer_phone)) {
          const nextTouchTime = calculateNextTouchPointTime(lead.created_at, 0);
          if (nextTouchTime) {
            await leadRepo.scheduleNextTouchPoint(tenantId, lead.id, nextTouchTime);
            fastify.log.info(
              { orderId: orderData.id, leadId: lead.id, nextTouchTime },
              '[Webhook] Scheduled initial touch point'
            );
          }
        } else if (created && !lead.customer_email && !lead.customer_phone) {
          fastify.log.warn(
            { orderId: orderData.id, leadId: lead.id },
            '[Webhook] Lead imported but no contact info available - no touch point scheduled'
          );
        }

        const duration = Date.now() - startTime;

        if (created) {
          fastify.log.info(
            { 
              orderId: orderData.id, 
              leadId: lead.id, 
              durationMs: duration,
              hasEmail: !!lead.customer_email,
              hasPhone: !!lead.customer_phone
            },
            '[Webhook] ✅ New lead imported'
          );
        } else {
          fastify.log.info(
            { orderId: orderData.id, leadId: lead.id, durationMs: duration },
            '[Webhook] ℹ️  Lead already exists, updated'
          );
        }

        return reply.code(200).send({ 
          received: true, 
          processed: true,
          leadId: lead.id,
          created,
          hasContactInfo: !!(lead.customer_email || lead.customer_phone)
        });

      } catch (error) {
        const duration = Date.now() - startTime;
        fastify.log.error(
          { error, durationMs: duration },
          '[Webhook] ❌ Error processing webhook'
        );

        // Return 200 anyway to prevent ShopMonkey from retrying
        return reply.code(200).send({ 
          received: true, 
          processed: false, 
          error: 'Processing failed' 
        });
      }
    }
  );

  // Test endpoint for manual testing
  fastify.post('/webhooks/test', async (request: FastifyRequest, reply: FastifyReply) => {
    fastify.log.info({ body: request.body }, '[Webhook] Test endpoint called');
    return { message: 'Test webhook received', body: request.body };
  });
}