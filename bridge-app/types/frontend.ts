/**
 * Frontend-specific types
 */

export interface Contact {
  id: string
  name: string
  relationship?: string
}

export interface Interaction {
  id: string
  contactId: string
  contactName: string
  method: string
  description?: string
  date: Date
  source?: string
}

