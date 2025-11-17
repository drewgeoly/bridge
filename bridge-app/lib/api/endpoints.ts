/**
 * API endpoint constants
 */

export const API_ENDPOINTS = {
  // Relationships
  relationships: '/api/relationships',
  
  // Touchpoints
  touchpoints: '/api/touchpoints',
  
  // Profile
  profile: '/api/profile',
  profilePreferences: '/api/profile/preferences',
  
  // Connections
  logConnection: '/api/connections/log',
  
  // Calendar
  calendarConnect: '/api/calendar/connect',
  calendarCallback: '/api/calendar/callback',
  calendarSync: '/api/calendar/sync',
  calendarStatus: '/api/calendar/status',
  
  // Contacts
  contacts: '/api/contacts',
  contactsImport: '/api/contacts/import',
  contactsImports: '/api/contacts/imports',
  
  // Agents
  advice: '/api/agents/advice',
  suggestions: '/api/agents/suggestions',
  
  // Summaries
  weeklySummary: '/api/summaries/weekly',
} as const

