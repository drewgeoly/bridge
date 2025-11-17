/**
 * API request and response types
 */

import type { Relationship, Touchpoint, Person, Profile } from '@/types/database'

/**
 * API Error Response
 */
export interface ApiError {
  error: string
}

/**
 * Relationships API
 */
export interface GetRelationshipsParams {
  limit?: number
  offset?: number
  search?: string
}

export interface GetRelationshipsResponse {
  relationships: Array<Relationship & { person: Person }>
  total: number
}

/**
 * Touchpoints API
 */
export interface GetTouchpointsParams {
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
  relationshipId?: string
}

export interface GetTouchpointsResponse {
  touchpoints: Touchpoint[]
  total: number
}

/**
 * Profile API
 */
export interface GetProfileResponse extends Profile {}

export interface UpdatePreferencesRequest {
  usageFrequency?: string
  advicePreference?: string
  [key: string]: any
}

export interface UpdatePreferencesResponse extends Profile {}

/**
 * Calendar Status API
 */
export interface CalendarStatusResponse {
  connected: boolean
  isExpired?: boolean
  lastSyncedAt?: string
  expiresAt?: string
  message?: string
}

/**
 * Weekly Summary API
 */
export interface WeeklySummaryResponse {
  startDate: string
  endDate: string
  totalMeetings: number
  totalTimeMinutes: number
  uniquePeople: number
  averageDurationMinutes: number
  categoryBreakdown: Record<string, number>
  relationshipMetrics: Array<{
    personId: string
    personName?: string
    meetingCount: number
    totalTimeMinutes: number
    lastInteraction?: string
  }>
  insights: Array<{
    type: string
    message: string
  }>
  narrative?: string
}

/**
 * Suggestions API
 */
export interface Suggestion {
  icon: string
  action: string
  contactName?: string
}

export interface SuggestionsResponse {
  suggestions: Suggestion[]
}

