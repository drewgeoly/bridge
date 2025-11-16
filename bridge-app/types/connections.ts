/**
 * Connection logging types
 */

import type { Touchpoint, Relationship, Person } from './database'

/**
 * Input for logging a connection
 */
export interface LogConnectionInput {
  name: string
  method: string // Any string (allows custom methods)
  description?: string
  occurredAt?: Date | null // Optional, can be null
}

/**
 * Result of logging a connection
 */
export interface LogConnectionResult {
  touchpoint: Touchpoint
  relationship: Relationship
  person: Person
}

