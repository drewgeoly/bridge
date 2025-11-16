/**
 * Tests for EventFilterService
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EventFilterService } from '../event-filter.service'
import type { Touchpoint } from '@/types/database'

describe('EventFilterService', () => {
  let service: EventFilterService

  beforeEach(() => {
    service = new EventFilterService()
  })

  describe('isMeaningfulEvent', () => {
    it('should filter out solo events', () => {
      const touchpoint: Touchpoint = {
        id: '1',
        user_id: 'user-1',
        type: 'calendar',
        source: 'google_calendar',
        occurred_at: new Date(),
        title: 'Coffee with Friend',
        raw_event_data: {
          attendees: [
            { email: 'user@example.com', displayName: 'User' },
          ],
        },
      } as Touchpoint

      expect(service.isMeaningfulEvent(touchpoint)).toBe(false)
    })

    it('should filter out short events (< 15 minutes)', () => {
      const touchpoint: Touchpoint = {
        id: '1',
        user_id: 'user-1',
        type: 'calendar',
        source: 'google_calendar',
        occurred_at: new Date(),
        title: 'Quick Chat',
        duration_minutes: 10,
        raw_event_data: {
          attendees: [
            { email: 'user@example.com' },
            { email: 'friend@example.com' },
          ],
        },
      } as Touchpoint

      expect(service.isMeaningfulEvent(touchpoint)).toBe(false)
    })

    it('should filter out events with work/school keywords', () => {
      const touchpoint: Touchpoint = {
        id: '1',
        user_id: 'user-1',
        type: 'calendar',
        source: 'google_calendar',
        occurred_at: new Date(),
        title: 'Standup Meeting',
        duration_minutes: 30,
        raw_event_data: {
          attendees: [
            { email: 'user@example.com' },
            { email: 'colleague@example.com' },
          ],
        },
      } as Touchpoint

      expect(service.isMeaningfulEvent(touchpoint)).toBe(false)
    })

    it('should filter out events from work/school sources', () => {
      const touchpoint: Touchpoint = {
        id: '1',
        user_id: 'user-1',
        type: 'calendar',
        source: 'work_calendar',
        occurred_at: new Date(),
        title: 'Team Lunch',
        duration_minutes: 60,
        raw_event_data: {
          attendees: [
            { email: 'user@example.com' },
            { email: 'colleague@example.com' },
          ],
        },
      } as Touchpoint

      expect(service.isMeaningfulEvent(touchpoint)).toBe(false)
    })

    it('should allow meaningful personal events', () => {
      const touchpoint: Touchpoint = {
        id: '1',
        user_id: 'user-1',
        type: 'calendar',
        source: 'google_calendar',
        occurred_at: new Date(),
        title: 'Coffee with Sarah',
        duration_minutes: 60,
        raw_event_data: {
          attendees: [
            { email: 'user@example.com' },
            { email: 'sarah@example.com' },
          ],
        },
      } as Touchpoint

      expect(service.isMeaningfulEvent(touchpoint)).toBe(true)
    })

    it('should filter out resource calendar attendees', () => {
      const touchpoint: Touchpoint = {
        id: '1',
        user_id: 'user-1',
        type: 'calendar',
        source: 'google_calendar',
        occurred_at: new Date(),
        title: 'Meeting',
        duration_minutes: 30,
        raw_event_data: {
          attendees: [
            { email: 'user@example.com' },
            { email: 'room@resource.calendar.google.com' },
          ],
        },
      } as Touchpoint

      expect(service.isMeaningfulEvent(touchpoint)).toBe(false)
    })
  })

  describe('categorizeRelationship', () => {
    it('should categorize as work for work sources', () => {
      const touchpoints: Touchpoint[] = [
        {
          id: '1',
          user_id: 'user-1',
          type: 'calendar',
          source: 'work_calendar',
          occurred_at: new Date(),
        } as Touchpoint,
      ]

      expect(service.categorizeRelationship(touchpoints)).toBe('work')
    })

    it('should categorize as school for school sources', () => {
      const touchpoints: Touchpoint[] = [
        {
          id: '1',
          user_id: 'user-1',
          type: 'calendar',
          source: 'university_calendar',
          occurred_at: new Date(),
        } as Touchpoint,
      ]

      expect(service.categorizeRelationship(touchpoints)).toBe('school')
    })

    it('should categorize as family for family keywords', () => {
      const touchpoints: Touchpoint[] = [
        {
          id: '1',
          user_id: 'user-1',
          type: 'calendar',
          source: 'google_calendar',
          occurred_at: new Date(),
          title: 'Dinner with Mom',
        } as Touchpoint,
      ]

      expect(service.categorizeRelationship(touchpoints)).toBe('family')
    })

    it('should default to friend for personal relationships', () => {
      const touchpoints: Touchpoint[] = [
        {
          id: '1',
          user_id: 'user-1',
          type: 'calendar',
          source: 'google_calendar',
          occurred_at: new Date(),
          title: 'Coffee with Friend',
        } as Touchpoint,
      ]

      expect(service.categorizeRelationship(touchpoints)).toBe('friend')
    })

    it('should return other for empty touchpoints', () => {
      expect(service.categorizeRelationship([])).toBe('other')
    })
  })
})

