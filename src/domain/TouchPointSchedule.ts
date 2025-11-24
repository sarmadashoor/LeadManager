/**
 * Touch Point Schedule
 * 
 * Implements the 13-touch follow-up schedule from MVP_LOGIC.md
 * Days are relative to the lead creation date.
 */

// Touch point schedule: [touchPointNumber, daysFromLeadCreation]
const TOUCH_POINT_SCHEDULE: [number, number][] = [
  [1, 0],    // Initial contact (within 30 sec)
  [2, 1],    // First follow-up
  [3, 3],    // Second follow-up
  [4, 5],    // Third follow-up
  [5, 7],    // Fourth follow-up
  [6, 10],   // Fifth follow-up
  [7, 13],   // Sixth follow-up
  [8, 16],   // Seventh follow-up
  [9, 19],   // Eighth follow-up
  [10, 22],  // Ninth follow-up
  [11, 25],  // Tenth follow-up
  [12, 27],  // Eleventh follow-up
  [13, 30],  // Final follow-up
];

export const MAX_TOUCH_POINTS = 13;

/**
 * Calculate the next touch point time based on current touch point count
 * 
 * @param leadCreatedAt - When the lead was created
 * @param currentTouchPointCount - How many touch points have been completed (0-13)
 * @returns Date for next touch point, or null if all 13 completed
 */
export function calculateNextTouchPointTime(
  leadCreatedAt: Date,
  currentTouchPointCount: number
): Date | null {
  const nextTouchPointNumber = currentTouchPointCount + 1;
  
  if (nextTouchPointNumber > MAX_TOUCH_POINTS) {
    return null; // All touch points completed
  }
  
  const scheduleEntry = TOUCH_POINT_SCHEDULE.find(([num]) => num === nextTouchPointNumber);
  if (!scheduleEntry) {
    return null;
  }
  
  const [, daysFromCreation] = scheduleEntry;
  const nextTime = new Date(leadCreatedAt);
  nextTime.setDate(nextTime.getDate() + daysFromCreation);
  
  // For touch point 1 (initial contact), we want immediate contact
  // but ensure it's at least "now" if the lead is older
  if (nextTouchPointNumber === 1) {
    const now = new Date();
    return now > nextTime ? now : nextTime;
  }
  
  return nextTime;
}

/**
 * Get days until a specific touch point from lead creation
 */
export function getDaysForTouchPoint(touchPointNumber: number): number | null {
  const entry = TOUCH_POINT_SCHEDULE.find(([num]) => num === touchPointNumber);
  return entry ? entry[1] : null;
}

/**
 * Check if a lead should be marked as lost (all touch points completed, no response)
 */
export function shouldMarkAsLost(touchPointCount: number, hasResponded: boolean): boolean {
  return touchPointCount >= MAX_TOUCH_POINTS && !hasResponded;
}

/**
 * Get the full schedule for reference
 */
export function getFullSchedule(): { touchPoint: number; day: number }[] {
  return TOUCH_POINT_SCHEDULE.map(([touchPoint, day]) => ({ touchPoint, day }));
}
