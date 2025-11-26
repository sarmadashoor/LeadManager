// packages/chat/src/ai/providers/__tests__/OpenAIProvider.test.ts

import { describe, it, expect } from '@jest/globals';

describe('OpenAIProvider', () => {
  
  it('should be importable', () => {
    expect(() => {
      require('../OpenAIProvider');
    }).not.toThrow();
  });

  describe('Construction', () => {
    
    it('should create instance with API key', () => {
      const { OpenAIProvider } = require('../OpenAIProvider');
      const provider = new OpenAIProvider({
        apiKey: 'test-key'
      });
      
      expect(provider).toBeDefined();
      expect(provider.name).toBe('openai');
    });
    
    it('should use default model if not specified', () => {
      const { OpenAIProvider } = require('../OpenAIProvider');
      const provider = new OpenAIProvider({
        apiKey: 'test-key'
      });
      
      expect(provider.model).toBe('gpt-4o');
    });
    
  });

  describe('calculateCost()', () => {
    
    it('should calculate cost correctly', () => {
      const { OpenAIProvider } = require('../OpenAIProvider');
      const provider = new OpenAIProvider({
        apiKey: 'test-key'
      });
      
      const cost = provider.calculateCost({
        input: 500,
        output: 100
      });
      
      // OpenAI pricing: $2.50/million input, $10/million output
      // 500 input = $0.00125
      // 100 output = $0.001
      // Total = $0.00225
      expect(cost).toBeCloseTo(0.00225, 6);
    });
    
  });
  
});