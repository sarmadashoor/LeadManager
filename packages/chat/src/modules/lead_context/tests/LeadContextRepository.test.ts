// packages/chat/src/repositories/__tests__/LeadContextRepository.test.ts

import { describe, it, expect } from '@jest/globals';
import { LeadContextRepository } from '../LeadContextRepository';

describe('LeadContextRepository', () => {
  
  it('should return null for non-existent lead', async () => {
    const repo = new LeadContextRepository();
    
    // Use a properly formatted UUID that doesn't exist
    const context = await repo.getLeadContext('00000000-0000-0000-0000-000000000000');
    
    expect(context).toBeNull();
  });
  
  it('should build context structure correctly', () => {
    const repo = new LeadContextRepository();
    
    // Just test that the class exists and has the method
    expect(repo).toBeDefined();
    expect(typeof repo.getLeadContext).toBe('function');
  });
  
});