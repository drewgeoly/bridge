/**
 * Database table types and repository return types
 */

/**
 * Profile (extends Supabase auth.users)
 */
export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  preferences?: Record<string, any>
  created_at: Date
  updated_at: Date
}

/**
 * Person (deduplicated contact)
 */
export interface Person {
  id: string
  email?: string
  name?: string
  aliases?: string[]
  merged_emails?: string[]
  metadata?: Record<string, any>
  created_at: Date
}

/**
 * Relationship between user and person
 */
export interface Relationship {
  id: string
  user_id: string
  person_id: string
  status: 'active' | 'paused' | 'archived'
  importance_score?: number
  last_interaction?: Date
  interaction_count: number
  metadata?: Record<string, any>
  created_at: Date
  updated_at: Date
}

/**
 * Touchpoint (all interactions)
 */
export interface Touchpoint {
  id: string
  user_id: string
  relationship_id?: string
  type: 'calendar' | 'message' | 'note' | 'email'
  source: string
  occurred_at: Date
  duration_minutes?: number
  title?: string
  data?: Record<string, any>
  external_id?: string
  raw_event_data?: Record<string, any>
  created_at: Date
}

/**
 * External account (OAuth tokens)
 */
export interface ExternalAccount {
  id: string
  user_id: string
  provider: string
  access_token?: string
  refresh_token?: string
  expires_at?: Date
  last_synced_at?: Date
  created_at: Date
  updated_at: Date
}

/**
 * Digest (daily summaries)
 */
export interface Digest {
  id: string
  user_id: string
  digest_date: Date
  insights?: Record<string, any>
  sent: boolean
  sent_at?: Date
  created_at: Date
}

