import { describe, it, expect } from 'vitest';
import {
  calculateNextTouchPointTime,
  getDaysForTouchPoint,
  shouldMarkAsLost,
  getFullSchedule,
  MAX_TOUCH_POINTS
} from '../../domain/TouchPointSchedule';

describe('TouchPointSchedule', () => {
  describe('calculateNextTouchPointTime', () => {
    const baseDate = new Date('2025-01-15T10:00:00Z');

    it('should schedule touch point 1 immediately for new leads', () => {
      const result = calculateNextTouchPointTime(baseDate, 0);
      expect(result).not.toBeNull();
      // Touch point 1 is day 0, so should be same day or now
      expect(result!.getTime()).toBeGreaterThanOrEqual(baseDate.getTime());
    });

    it('should schedule touch point 2 on day 1', () => {
      const result = calculateNextTouchPointTime(baseDate, 1);
      expect(result).not.toBeNull();
      const expectedDate = new Date(baseDate);
      expectedDate.setDate(expectedDate.getDate() + 1);
      expect(result!.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should schedule touch point 3 on day 3', () => {
      const result = calculateNextTouchPointTime(baseDate, 2);
      expect(result).not.toBeNull();
      const expectedDate = new Date(baseDate);
      expectedDate.setDate(expectedDate.getDate() + 3);
      expect(result!.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should schedule touch point 13 on day 30', () => {
      const result = calculateNextTouchPointTime(baseDate, 12);
      expect(result).not.toBeNull();
      const expectedDate = new Date(baseDate);
      expectedDate.setDate(expectedDate.getDate() + 30);
      expect(result!.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should return null after all 13 touch points', () => {
      const result = calculateNextTouchPointTime(baseDate, 13);
      expect(result).toBeNull();
    });

    it('should return now for touch point 1 if lead is older', () => {
      const oldLead = new Date('2020-01-01T10:00:00Z');
      const result = calculateNextTouchPointTime(oldLead, 0);
      const now = new Date();
      // Should be approximately now (within a few seconds)
      expect(result).not.toBeNull();
      expect(Math.abs(result!.getTime() - now.getTime())).toBeLessThan(5000);
    });
  });

  describe('getDaysForTouchPoint', () => {
    it('should return correct days for each touch point', () => {
      expect(getDaysForTouchPoint(1)).toBe(0);
      expect(getDaysForTouchPoint(2)).toBe(1);
      expect(getDaysForTouchPoint(3)).toBe(3);
      expect(getDaysForTouchPoint(13)).toBe(30);
    });

    it('should return null for invalid touch point numbers', () => {
      expect(getDaysForTouchPoint(0)).toBeNull();
      expect(getDaysForTouchPoint(14)).toBeNull();
      expect(getDaysForTouchPoint(-1)).toBeNull();
    });
  });

  describe('shouldMarkAsLost', () => {
    it('should mark as lost after 13 touches with no response', () => {
      expect(shouldMarkAsLost(13, false)).toBe(true);
      expect(shouldMarkAsLost(14, false)).toBe(true); // Edge case
    });

    it('should not mark as lost if customer responded', () => {
      expect(shouldMarkAsLost(13, true)).toBe(false);
      expect(shouldMarkAsLost(5, true)).toBe(false);
    });

    it('should not mark as lost before 13 touches', () => {
      expect(shouldMarkAsLost(12, false)).toBe(false);
      expect(shouldMarkAsLost(0, false)).toBe(false);
    });
  });

  describe('getFullSchedule', () => {
    it('should return all 13 touch points', () => {
      const schedule = getFullSchedule();
      expect(schedule.length).toBe(13);
    });

    it('should have correct structure', () => {
      const schedule = getFullSchedule();
      expect(schedule[0]).toEqual({ touchPoint: 1, day: 0 });
      expect(schedule[12]).toEqual({ touchPoint: 13, day: 30 });
    });
  });

  describe('MAX_TOUCH_POINTS', () => {
    it('should be 13', () => {
      expect(MAX_TOUCH_POINTS).toBe(13);
    });
  });
});
