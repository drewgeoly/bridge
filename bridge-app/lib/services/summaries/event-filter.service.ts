/**
 * Service for filtering meaningful events from routine work/school events
 */

import type { Touchpoint } from '@/types/database'

/**
 * Keywords that indicate routine work/school events
 */
const WORK_SCHOOL_KEYWORDS = [
  'class',
  'lecture',
  'standup',
  'stand-up',
  'sync',
  'meeting',
  'huddle',
  'review',
  'planning',
  'retrospective',
  'sprint',
  'workshop',
  'seminar',
  'office hours',
  'tutoring',
  'study group',
  'exam',
  'quiz',
  'assignment',
  'deadline',
]

/**
 * Minimum duration in minutes for an event to be considered meaningful
 */
const MIN_DURATION_MINUTES = 15

export class EventFilterService {
  /**
   * Check if an event is meaningful (not routine work/school)
   */
  isMeaningfulEvent(touchpoint: Touchpoint): boolean {
    // Filter out events with no other attendees (solo events)
    if (this.isSoloEvent(touchpoint)) {
      return false
    }

    // Filter out very short events (< 15 minutes)
    if (touchpoint.duration_minutes && touchpoint.duration_minutes < MIN_DURATION_MINUTES) {
      return false
    }

    // Filter out events with work/school keywords in title
    if (this.hasWorkSchoolKeywords(touchpoint)) {
      return false
    }

    // Filter out calendar events from work/school sources
    if (this.isWorkSchoolSource(touchpoint)) {
      return false
    }

    return true
  }

  /**
   * Check if event has no other attendees (solo event)
   */
  private isSoloEvent(touchpoint: Touchpoint): boolean {
    // For calendar events, check raw_event_data for attendees
    if (touchpoint.type === 'calendar' && touchpoint.raw_event_data) {
      const rawData = touchpoint.raw_event_data as any
      const attendees = rawData.attendees || []
      
      // Filter out resource/room attendees
      const realAttendees = attendees.filter((a: any) => {
        if (!a.email) return false
        // Skip resource calendars and rooms
        if (a.email.includes('resource.calendar.google.com')) return false
        if (a.email.includes('@rooms.google.com')) return false
        return true
      })

      // If only 1 attendee (the organizer), it's a solo event
      return realAttendees.length <= 1
    }

    // For non-calendar events, if there's no relationship_id, it might be solo
    // But we'll be more lenient here - assume it's meaningful if it exists
    return false
  }

  /**
   * Check if event title contains work/school keywords
   */
  private hasWorkSchoolKeywords(touchpoint: Touchpoint): boolean {
    const title = (touchpoint.title || '').toLowerCase()
    
    return WORK_SCHOOL_KEYWORDS.some((keyword) => title.includes(keyword))
  }

  /**
   * Check if event source indicates work/school calendar
   */
  private isWorkSchoolSource(touchpoint: Touchpoint): boolean {
    const source = (touchpoint.source || '').toLowerCase()
    
    // Check for work/school indicators in source
    const workSchoolIndicators = ['work', 'school', 'university', 'college', 'office', 'corporate']
    
    return workSchoolIndicators.some((indicator) => source.includes(indicator))
  }

  /**
   * Categorize a relationship based on touchpoints
   */
  categorizeRelationship(
    touchpoints: Touchpoint[]
  ): 'friend' | 'family' | 'work' | 'school' | 'other' {
    if (touchpoints.length === 0) {
      return 'other'
    }

    // Check touchpoint sources
    const sources = touchpoints.map((tp) => (tp.source || '').toLowerCase())
    const hasWorkSource = sources.some((s) => s.includes('work') || s.includes('office') || s.includes('corporate'))
    const hasSchoolSource = sources.some((s) => s.includes('school') || s.includes('university') || s.includes('college'))

    if (hasWorkSource) {
      return 'work'
    }
    if (hasSchoolSource) {
      return 'school'
    }

    // Check titles for family indicators
    const titles = touchpoints.map((tp) => (tp.title || '').toLowerCase())
    const familyKeywords = ['mom', 'dad', 'mother', 'father', 'sister', 'brother', 'family', 'grandma', 'grandpa']
    const hasFamilyKeywords = titles.some((title) => 
      familyKeywords.some((keyword) => title.includes(keyword))
    )

    if (hasFamilyKeywords) {
      return 'family'
    }

    // Default to friend for personal relationships
    return 'friend'
  }
}

