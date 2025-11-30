// packages/chat/src/repositories/LeadContextRepository.ts

import db from '../../infrastructure/db';

export interface LeadContext {
  customer: {
    name: string;
    vehicle: string;
  };
  services: Array<{
    name: string;
    price: number;
    description: string;
  }>;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export class LeadContextRepository {
  
  async getLeadContext(leadId: string): Promise<LeadContext | null> {
    // Fetch lead from database
    const lead = await db('leads')
      .where({ id: leadId })
      .first();
    
    if (!lead) {
      return null;
    }
    
    // Build context
    return {
      customer: {
        name: lead.customer_name || 'Customer',
        vehicle: `${lead.vehicle_year || ''} ${lead.vehicle_make || ''} ${lead.vehicle_model || ''}`.trim()
      },
      services: [
        // TODO: fetch from service catalog or ShopMonkey
        // For now, hardcoded defaults
        {
          name: 'Premium Tint Package',
          price: 300,
          description: 'Carbon tint for all windows'
        },
        {
          name: 'Supreme Tint Package',
          price: 450,
          description: 'Ceramic tint for all windows'
        }
      ],
      conversationHistory: []
    };
  }
}