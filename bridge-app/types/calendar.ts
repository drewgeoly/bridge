/**
 * Calendar-related types for Google Calendar integration
 */

/**
 * Raw Google Calendar event from the API
 */
export interface GoogleCalendarEvent {
  id: string
  summary?: string
  description?: string
  start?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  attendees?: Array<{
    email?: string
    displayName?: string
    responseStatus?: string
    organizer?: boolean
  }>
  organizer?: {
    email?: string
    displayName?: string
  }
  location?: string
  status?: string
  created?: string
  updated?: string
  htmlLink?: string
}

/**
 * Result of a calendar sync operation
 */
export interface CalendarSyncResult {
  success: boolean
  eventsProcessed: number
  eventsCreated: number
  eventsSkipped: number
  relationshipsCreated: number
  error?: string
  lastSyncedAt?: Date
}

/**
 * Token data for OAuth storage
 */
export interface TokenData {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  tokenType?: string
  scope?: string
}

/**
 * Input for creating a touchpoint from a calendar event
 */
export interface TouchpointInput {
  userId: string
  relationshipId?: string
  type: 'calendar' | 'message' | 'note' | 'email'
  source: string
  occurredAt: Date | null // Can be null for manual logs that user will update later
  durationMinutes?: number
  title?: string
  data?: Record<string, any>
  externalId?: string
  rawEventData?: Record<string, any>
}

/**
 * Date range for syncing calendar events
 */
export interface SyncDateRange {
  startDate: Date
  endDate: Date
}

