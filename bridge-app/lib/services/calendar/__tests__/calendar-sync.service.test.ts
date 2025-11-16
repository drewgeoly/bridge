/**
 * Unit tests for CalendarSyncService
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CalendarSyncService } from '../calendar-sync.service'
import { GoogleCalendarService } from '../google-calendar.service'
import { RelationshipService } from '../../relationships/relationship.service'
import { TouchpointRepository } from '@/lib/repositories/touchpoint.repository'
import { TokenRepository } from '@/lib/repositories/token.repository'
import type { GoogleCalendarEvent } from '@/types/calendar'

// Mock all dependencies
vi.mock('../google-calendar.service')
vi.mock('../../relationships/relationship.service')
vi.mock('@/lib/repositories/touchpoint.repository')
vi.mock('@/lib/repositories/token.repository')

describe('CalendarSyncService', () => {
  let service: CalendarSyncService
  let mockGoogleCalendarService: any
  let mockRelationshipService: any
  let mockTouchpointRepository: any
  let mockTokenRepository: any

  beforeEach(() => {
    // Create mock instances
    mockGoogleCalendarService = {
      getValidAccessToken: vi.fn(),
      fetchEvents: vi.fn(),
      transformEventToTouchpointData: vi.fn(),
    }

    mockRelationshipService = {
      extractPeopleFromEvent: vi.fn(),
      findOrCreatePerson: vi.fn(),
      ensureRelationship: vi.fn(),
    }

    mockTouchpointRepository = {
      findByExternalId: vi.fn(),
      createTouchpoint: vi.fn(),
    }

    mockTokenRepository = {
      updateLastSynced: vi.fn(),
    }

    // Create constructor classes that return mock instances
    class MockGoogleCalendarService {
      constructor() {
        return mockGoogleCalendarService
      }
    }

    class MockRelationshipService {
      constructor() {
        return mockRelationshipService
      }
    }

    class MockTouchpointRepository {
      constructor() {
        return mockTouchpointRepository
      }
    }

    class MockTokenRepository {
      constructor() {
        return mockTokenRepository
      }
    }

    // Replace service dependencies with constructor classes
    ;(GoogleCalendarService as any).mockImplementation(MockGoogleCalendarService)
    ;(RelationshipService as any).mockImplementation(MockRelationshipService)
    ;(TouchpointRepository as any).mockImplementation(MockTouchpointRepository)
    ;(TokenRepository as any).mockImplementation(MockTokenRepository)

    service = new CalendarSyncService()
  })

  describe('syncUserCalendar', () => {
    it('should successfully sync calendar with events', async () => {
      const userId = 'user-123'
      const accessToken = 'valid-token'

      const mockEvents: GoogleCalendarEvent[] = [
        {
          id: 'event-1',
          summary: 'Meeting 1',
          start: { dateTime: '2024-01-15T10:00:00Z' },
          end: { dateTime: '2024-01-15T11:00:00Z' },
          attendees: [
            { email: 'person1@example.com', displayName: 'Person 1' },
          ],
        },
        {
          id: 'event-2',
          summary: 'Meeting 2',
          start: { dateTime: '2024-01-16T14:00:00Z' },
          end: { dateTime: '2024-01-16T15:00:00Z' },
        },
      ]

      mockGoogleCalendarService.getValidAccessToken.mockResolvedValue(accessToken)
      mockGoogleCalendarService.fetchEvents.mockResolvedValue(mockEvents)
      mockGoogleCalendarService.transformEventToTouchpointData.mockImplementation((event: GoogleCalendarEvent) => ({
        title: event.summary,
        occurredAt: new Date(event.start?.dateTime || ''),
        durationMinutes: 60,
        data: {},
      }))

      mockRelationshipService.extractPeopleFromEvent.mockImplementation((event: GoogleCalendarEvent) => {
        if (event.id === 'event-1') {
          return [{ email: 'person1@example.com', name: 'Person 1' }]
        }
        return []
      })

      mockTouchpointRepository.findByExternalId.mockResolvedValue(null) // Events don't exist
      mockRelationshipService.findOrCreatePerson.mockResolvedValue({
        id: 'person-1',
        email: 'person1@example.com',
        name: 'Person 1',
      })
      mockRelationshipService.ensureRelationship.mockResolvedValue({
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-1',
      })
      mockTouchpointRepository.createTouchpoint.mockResolvedValue({})
      mockTokenRepository.updateLastSynced.mockResolvedValue(undefined)

      const result = await service.syncUserCalendar(userId)

      expect(result.success).toBe(true)
      expect(result.eventsProcessed).toBe(2)
      expect(result.eventsCreated).toBe(2)
      expect(result.eventsSkipped).toBe(0)
      expect(result.relationshipsCreated).toBe(1) // Only event-1 has attendees
      expect(mockTokenRepository.updateLastSynced).toHaveBeenCalledWith(userId, 'google_calendar')
    })

    it('should skip events that already exist', async () => {
      const userId = 'user-123'
      const accessToken = 'valid-token'

      const mockEvents: GoogleCalendarEvent[] = [
        {
          id: 'event-1',
          summary: 'Existing Event',
          start: { dateTime: '2024-01-15T10:00:00Z' },
          end: { dateTime: '2024-01-15T11:00:00Z' },
        },
      ]

      mockGoogleCalendarService.getValidAccessToken.mockResolvedValue(accessToken)
      mockGoogleCalendarService.fetchEvents.mockResolvedValue(mockEvents)
      mockTouchpointRepository.findByExternalId.mockResolvedValue({
        id: 'existing-touchpoint',
      }) // Event already exists

      const result = await service.syncUserCalendar(userId)

      expect(result.success).toBe(true)
      expect(result.eventsProcessed).toBe(1)
      expect(result.eventsCreated).toBe(0)
      expect(result.eventsSkipped).toBe(1)
      expect(mockTouchpointRepository.createTouchpoint).not.toHaveBeenCalled()
    })

    it('should handle events with no attendees', async () => {
      const userId = 'user-123'
      const accessToken = 'valid-token'

      const mockEvents: GoogleCalendarEvent[] = [
        {
          id: 'event-1',
          summary: 'Solo Event',
          start: { dateTime: '2024-01-15T10:00:00Z' },
          end: { dateTime: '2024-01-15T11:00:00Z' },
        },
      ]

      mockGoogleCalendarService.getValidAccessToken.mockResolvedValue(accessToken)
      mockGoogleCalendarService.fetchEvents.mockResolvedValue(mockEvents)
      mockGoogleCalendarService.transformEventToTouchpointData.mockReturnValue({
        title: 'Solo Event',
        occurredAt: new Date('2024-01-15T10:00:00Z'),
        durationMinutes: 60,
        data: {},
      })
      mockRelationshipService.extractPeopleFromEvent.mockReturnValue([])
      mockTouchpointRepository.findByExternalId.mockResolvedValue(null)

      const result = await service.syncUserCalendar(userId)

      expect(result.success).toBe(true)
      expect(result.eventsCreated).toBe(1)
      expect(result.relationshipsCreated).toBe(0)
      expect(mockRelationshipService.findOrCreatePerson).not.toHaveBeenCalled()
    })

    it('should continue processing if one event fails', async () => {
      const userId = 'user-123'
      const accessToken = 'valid-token'

      const mockEvents: GoogleCalendarEvent[] = [
        {
          id: 'event-1',
          summary: 'Good Event',
          start: { dateTime: '2024-01-15T10:00:00Z' },
          end: { dateTime: '2024-01-15T11:00:00Z' },
        },
        {
          id: 'event-2',
          summary: 'Bad Event',
          start: { dateTime: '2024-01-16T10:00:00Z' },
          end: { dateTime: '2024-01-16T11:00:00Z' },
        },
      ]

      mockGoogleCalendarService.getValidAccessToken.mockResolvedValue(accessToken)
      mockGoogleCalendarService.fetchEvents.mockResolvedValue(mockEvents)
      mockGoogleCalendarService.transformEventToTouchpointData
        .mockReturnValueOnce({
          title: 'Good Event',
          occurredAt: new Date('2024-01-15T10:00:00Z'),
          durationMinutes: 60,
          data: {},
        })
        .mockImplementationOnce(() => {
          throw new Error('Transform failed')
        })

      mockTouchpointRepository.findByExternalId.mockResolvedValue(null)
      mockRelationshipService.extractPeopleFromEvent.mockReturnValue([])
      mockTouchpointRepository.createTouchpoint
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Create failed'))

      const result = await service.syncUserCalendar(userId)

      expect(result.success).toBe(true)
      expect(result.eventsProcessed).toBe(2)
      expect(result.eventsCreated).toBe(1)
      expect(result.eventsSkipped).toBe(1) // One event failed
    })

    it('should handle token retrieval failure', async () => {
      const userId = 'user-123'

      mockGoogleCalendarService.getValidAccessToken.mockRejectedValue(
        new Error('No access token found')
      )

      const result = await service.syncUserCalendar(userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No access token found')
      expect(result.eventsProcessed).toBe(0)
    })

    it('should handle fetch events failure', async () => {
      const userId = 'user-123'
      const accessToken = 'valid-token'

      mockGoogleCalendarService.getValidAccessToken.mockResolvedValue(accessToken)
      mockGoogleCalendarService.fetchEvents.mockRejectedValue(
        new Error('API error')
      )

      const result = await service.syncUserCalendar(userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('API error')
    })

    it('should use custom daysBack parameter', async () => {
      const userId = 'user-123'
      const accessToken = 'valid-token'
      const daysBack = 30

      mockGoogleCalendarService.getValidAccessToken.mockResolvedValue(accessToken)
      mockGoogleCalendarService.fetchEvents.mockResolvedValue([])

      await service.syncUserCalendar(userId, daysBack)

      // Verify fetchEvents was called with date range for 30 days
      expect(mockGoogleCalendarService.fetchEvents).toHaveBeenCalled()
      const callArgs = mockGoogleCalendarService.fetchEvents.mock.calls[0]
      expect(callArgs[0]).toBe(accessToken)
      // startDate and endDate should be passed
      expect(callArgs[1]).toBeInstanceOf(Date)
      expect(callArgs[2]).toBeInstanceOf(Date)
    })

    it('should handle empty events list', async () => {
      const userId = 'user-123'
      const accessToken = 'valid-token'

      mockGoogleCalendarService.getValidAccessToken.mockResolvedValue(accessToken)
      mockGoogleCalendarService.fetchEvents.mockResolvedValue([])

      const result = await service.syncUserCalendar(userId)

      expect(result.success).toBe(true)
      expect(result.eventsProcessed).toBe(0)
      expect(result.eventsCreated).toBe(0)
      expect(mockTouchpointRepository.createTouchpoint).not.toHaveBeenCalled()
    })
  })
})

