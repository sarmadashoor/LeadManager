// packages/chat/src/ai/providers/__tests__/ClaudeProvider.test.ts

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TestData, MockAPI } from '../../../__tests__/test-utils';

/**
 * TDD: RED Phase - Write tests BEFORE implementation
 * These tests will FAIL because ClaudeProvider doesn't exist yet
 */

describe('ClaudeProvider', () => {
  
  it('should be importable', () => {
    // This will fail initially - that's correct for TDD!
    expect(() => {
      require('../ClaudeProvider');
    }).not.toThrow();
  });

  describe('Construction', () => {
    
    it('should create instance with API key', () => {
      const { ClaudeProvider } = require('../ClaudeProvider');
      const provider = new ClaudeProvider({
        apiKey: 'test-key'
      });
      
      expect(provider).toBeDefined();
      expect(provider.name).toBe('claude');
    });
    
    it('should use default model if not specified', () => {
      const { ClaudeProvider } = require('../ClaudeProvider');
      const provider = new ClaudeProvider({
        apiKey: 'test-key'
      });
      
      expect(provider.model).toBe('claude-sonnet-4-20250514');
    });
    
  });

  describe('calculateCost()', () => {
    
    it('should calculate cost correctly', () => {
      const { ClaudeProvider } = require('../ClaudeProvider');
      const provider = new ClaudeProvider({
        apiKey: 'test-key'
      });
      
      const cost = provider.calculateCost({
        input: 500,
        output: 100
      });
      
      // Claude pricing: $3/million input, $15/million output
      // 500 input = $0.0015
      // 100 output = $0.0015
      // Total = $0.003
      expect(cost).toBeCloseTo(0.003, 6);
    });
    
  });
  
});