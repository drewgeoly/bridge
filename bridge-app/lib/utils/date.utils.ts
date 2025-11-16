/**
 * Date utility functions
 */

/**
 * Get date range for syncing calendar events (past 90 days)
 */
export function getSyncDateRange(daysBack: number = 90): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)
  
  return { startDate, endDate }
}

/**
 * Format date for Google Calendar API (RFC3339)
 */
export function formatDateForGoogleAPI(date: Date): string {
  return date.toISOString()
}

/**
 * Parse date from Google Calendar API
 */
export function parseGoogleAPIDate(dateString?: string): Date | null {
  if (!dateString) return null
  return new Date(dateString)
}

/**
 * Calculate duration in minutes between two dates
 */
export function calculateDurationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
}

/**
 * Check if a date is within a range
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end
}

