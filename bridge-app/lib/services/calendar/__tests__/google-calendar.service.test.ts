/**
 * Unit tests for GoogleCalendarService
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GoogleCalendarService } from '../google-calendar.service'
import { TokenRepository } from '@/lib/repositories/token.repository'
import { google } from 'googleapis'
import type { GoogleCalendarEvent } from '@/types/calendar'

// Mock dependencies
vi.mock('@/lib/repositories/token.repository')

// Create a shared mock OAuth2 client that we can access in tests
const mockOAuth2ClientInstance = {
  generateAuthUrl: vi.fn(() => 'https://accounts.google.com/oauth?scope=calendar.readonly'),
  getToken: vi.fn(),
  setCredentials: vi.fn(),
  refreshAccessToken: vi.fn(),
}

// Mock googleapis - OAuth2 needs to be a constructor class
vi.mock('googleapis', () => {
  // OAuth2 constructor class that returns our mock instance
  class MockOAuth2 {
    constructor() {
      return mockOAuth2ClientInstance
    }
  }
  
  return {
    google: {
      auth: {
        OAuth2: MockOAuth2,
      },
      calendar: vi.fn(() => ({
        events: {
          list: vi.fn(),
        },
      })),
    },
  }
})

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService
  let mockTokenRepository: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Reset the mock OAuth2 client methods
    mockOAuth2ClientInstance.generateAuthUrl = vi.fn(() => 'https://accounts.google.com/oauth?scope=calendar.readonly')
    mockOAuth2ClientInstance.getToken = vi.fn()
    mockOAuth2ClientInstance.setCredentials = vi.fn()
    mockOAuth2ClientInstance.refreshAccessToken = vi.fn()

    // Create service instance - this will use the mocked OAuth2
    service = new GoogleCalendarService()
  })

  describe('getAuthUrl', () => {
    it('should generate a valid OAuth URL', () => {
      const url = service.getAuthUrl('test-state')
      
      expect(mockOAuth2ClientInstance.generateAuthUrl).toHaveBeenCalled()
      expect(url).toContain('accounts.google.com')
      expect(url).toContain('oauth')
    })

    it('should include calendar scope in auth URL', () => {
      service.getAuthUrl('test-state')
      
      const callArgs = (mockOAuth2ClientInstance.generateAuthUrl as any).mock.calls[0][0]
      // Scope is an array, check if it includes the calendar scope URL
      expect(callArgs.scope).toEqual(
        expect.arrayContaining(['https://www.googleapis.com/auth/calendar.readonly'])
      )
      expect(callArgs.access_type).toBe('offline')
      expect(callArgs.prompt).toBe('consent')
    })
  })

  describe('exchangeCodeForTokens', () => {
    it('should exchange code for tokens successfully', async () => {
      // Mock successful token exchange
      ;(mockOAuth2ClientInstance.getToken as any).mockResolvedValue({
        tokens: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expiry_date: Date.now() + 3600000,
        },
      })

      const code = 'test-auth-code'
      const result = await service.exchangeCodeForTokens(code)
      
      expect(mockOAuth2ClientInstance.getToken).toHaveBeenCalledWith(code)
      expect(result.accessToken).toBe('test-access-token')
      expect(result.refreshToken).toBe('test-refresh-token')
      expect(result.expiresAt).toBeInstanceOf(Date)
    })

    it('should throw error if no access token received', async () => {
      ;(mockOAuth2ClientInstance.getToken as any).mockResolvedValue({
        tokens: {},
      })

      await expect(
        service.exchangeCodeForTokens('invalid-code')
      ).rejects.toThrow('No access token received from Google')
    })
  })

  describe('getValidAccessToken', () => {
    it('should return existing token if not expired', async () => {
      const userId = 'user-123'
      const validToken = 'valid-token'
      
      // Mock TokenRepository methods
      const mockGetTokens = vi.fn().mockResolvedValue({
        id: '1',
        user_id: userId,
        provider: 'google_calendar',
        access_token: validToken,
        expires_at: new Date(Date.now() + 3600000),
      })

      const mockIsTokenExpired = vi.fn().mockReturnValue(false)

      // Replace TokenRepository instance methods
      const tokenRepo = new TokenRepository()
      tokenRepo.getTokens = mockGetTokens
      tokenRepo.isTokenExpired = mockIsTokenExpired

      // Use reflection to replace the repository
      ;(service as any).tokenRepository = tokenRepo

      const result = await service.getValidAccessToken(userId)
      
      expect(result).toBe(validToken)
      expect(mockGetTokens).toHaveBeenCalledWith(userId, 'google_calendar')
    })

    it('should throw error if no token found', async () => {
      const userId = 'user-123'
      
      const mockGetTokens = vi.fn().mockResolvedValue(null)
      const tokenRepo = new TokenRepository()
      tokenRepo.getTokens = mockGetTokens
      ;(service as any).tokenRepository = tokenRepo

      await expect(
        service.getValidAccessToken(userId)
      ).rejects.toThrow('No access token found')
    })

    it('should refresh token if expired', async () => {
      const userId = 'user-123'
      
      const mockGetTokens = vi.fn().mockResolvedValue({
        id: '1',
        user_id: userId,
        provider: 'google_calendar',
        access_token: 'old-token',
        refresh_token: 'refresh-token',
        expires_at: new Date(Date.now() - 1000), // Expired
      })

      const mockIsTokenExpired = vi.fn().mockReturnValue(true)
      const mockRefreshAccessToken = vi.fn().mockResolvedValue('new-token')

      const tokenRepo = new TokenRepository()
      tokenRepo.getTokens = mockGetTokens
      tokenRepo.isTokenExpired = mockIsTokenExpired
      ;(service as any).tokenRepository = tokenRepo
      service.refreshAccessToken = mockRefreshAccessToken

      const result = await service.getValidAccessToken(userId)
      
      expect(result).toBe('new-token')
      expect(mockRefreshAccessToken).toHaveBeenCalledWith(userId)
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const userId = 'user-123'
      const refreshToken = 'refresh-token'
      const newAccessToken = 'new-access-token'

      const mockGetTokens = vi.fn().mockResolvedValue({
        id: '1',
        user_id: userId,
        provider: 'google_calendar',
        refresh_token: refreshToken,
      })

      const mockSaveTokens = vi.fn().mockResolvedValue(undefined)

      ;(mockOAuth2ClientInstance.refreshAccessToken as any).mockResolvedValue({
        credentials: {
          access_token: newAccessToken,
          expiry_date: Date.now() + 3600000,
        },
      })

      const tokenRepo = new TokenRepository()
      tokenRepo.getTokens = mockGetTokens
      tokenRepo.saveTokens = mockSaveTokens
      ;(service as any).tokenRepository = tokenRepo

      const result = await service.refreshAccessToken(userId)
      
      expect(result).toBe(newAccessToken)
      expect(mockOAuth2ClientInstance.setCredentials).toHaveBeenCalledWith({
        refresh_token: refreshToken,
      })
      expect(mockSaveTokens).toHaveBeenCalled()
    })

    it('should throw error if no refresh token available', async () => {
      const userId = 'user-123'

      const mockGetTokens = vi.fn().mockResolvedValue({
        id: '1',
        user_id: userId,
        provider: 'google_calendar',
        refresh_token: null, // No refresh token
      })

      const tokenRepo = new TokenRepository()
      tokenRepo.getTokens = mockGetTokens
      ;(service as any).tokenRepository = tokenRepo

      await expect(service.refreshAccessToken(userId)).rejects.toThrow(
        'No refresh token available'
      )
    })

    it('should throw error if refresh fails', async () => {
      const userId = 'user-123'
      const refreshToken = 'refresh-token'

      const mockGetTokens = vi.fn().mockResolvedValue({
        id: '1',
        user_id: userId,
        provider: 'google_calendar',
        refresh_token: refreshToken,
      })

      ;(mockOAuth2ClientInstance.refreshAccessToken as any).mockResolvedValue({
        credentials: {}, // No access_token
      })

      const tokenRepo = new TokenRepository()
      tokenRepo.getTokens = mockGetTokens
      ;(service as any).tokenRepository = tokenRepo

      await expect(service.refreshAccessToken(userId)).rejects.toThrow(
        'Failed to refresh access token'
      )
    })
  })

  describe('fetchEvents', () => {
    it('should fetch events successfully', async () => {
      const accessToken = 'valid-token'
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const mockEvents: GoogleCalendarEvent[] = [
        {
          id: 'event-1',
          summary: 'Event 1',
          start: { dateTime: '2024-01-15T10:00:00Z' },
          end: { dateTime: '2024-01-15T11:00:00Z' },
        },
        {
          id: 'event-2',
          summary: 'Event 2',
          start: { dateTime: '2024-01-20T14:00:00Z' },
          end: { dateTime: '2024-01-20T15:00:00Z' },
        },
      ]

      const mockCalendar = {
        events: {
          list: vi.fn().mockResolvedValue({
            data: { items: mockEvents },
          }),
        },
      }

      ;(google.calendar as any).mockReturnValue(mockCalendar)

      const result = await service.fetchEvents(accessToken, startDate, endDate)
      
      expect(result).toEqual(mockEvents)
      expect(mockOAuth2ClientInstance.setCredentials).toHaveBeenCalledWith({
        access_token: accessToken,
      })
      expect(mockCalendar.events.list).toHaveBeenCalledWith({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime',
      })
    })

    it('should handle empty events list', async () => {
      const accessToken = 'valid-token'
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const mockCalendar = {
        events: {
          list: vi.fn().mockResolvedValue({
            data: { items: [] },
          }),
        },
      }

      ;(google.calendar as any).mockReturnValue(mockCalendar)

      const result = await service.fetchEvents(accessToken, startDate, endDate)
      
      expect(result).toEqual([])
    })

    it('should throw error for invalid/expired token (401)', async () => {
      const accessToken = 'invalid-token'
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const mockCalendar = {
        events: {
          list: vi.fn().mockRejectedValue({
            response: { status: 401 },
            message: 'Unauthorized',
          }),
        },
      }

      ;(google.calendar as any).mockReturnValue(mockCalendar)

      await expect(
        service.fetchEvents(accessToken, startDate, endDate)
      ).rejects.toThrow('Invalid or expired access token')
    })

    it('should throw error for other API failures', async () => {
      const accessToken = 'valid-token'
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const mockCalendar = {
        events: {
          list: vi.fn().mockRejectedValue({
            message: 'Network error',
          }),
        },
      }

      ;(google.calendar as any).mockReturnValue(mockCalendar)

      await expect(
        service.fetchEvents(accessToken, startDate, endDate)
      ).rejects.toThrow('Failed to fetch calendar events')
    })
  })

  describe('transformEventToTouchpointData', () => {
    it('should transform Google event to touchpoint format', () => {
      const event = {
        id: 'event-1',
        summary: 'Coffee Meeting',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
        description: 'Meeting with John',
        location: 'Coffee Shop',
      }

      const result = service.transformEventToTouchpointData(event)
      
      expect(result.title).toBe('Coffee Meeting')
      expect(result.occurredAt).toBeInstanceOf(Date)
      expect(result.durationMinutes).toBe(60)
      expect(result.data.description).toBe('Meeting with John')
      expect(result.data.location).toBe('Coffee Shop')
    })

    it('should handle all-day events', () => {
      const event = {
        id: 'event-2',
        summary: 'All Day Event',
        start: { date: '2024-01-15' },
        end: { date: '2024-01-16' },
      }

      const result = service.transformEventToTouchpointData(event)
      
      expect(result.title).toBe('All Day Event')
      expect(result.occurredAt).toBeInstanceOf(Date)
      // All-day events from 2024-01-15 to 2024-01-16 = 24 hours = 1440 minutes
      expect(result.durationMinutes).toBe(1440)
    })

    it('should throw error if event has no start time', () => {
      const event = {
        id: 'event-3',
        summary: 'Invalid Event',
      }

      expect(() => {
        service.transformEventToTouchpointData(event)
      }).toThrow('Event has no start time')
    })

    it('should use "Untitled Event" if summary is missing', () => {
      const event = {
        id: 'event-4',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
      }

      const result = service.transformEventToTouchpointData(event)
      
      expect(result.title).toBe('Untitled Event')
    })

    it('should handle event with no end time', () => {
      const event = {
        id: 'event-5',
        summary: 'No End Time Event',
        start: { dateTime: '2024-01-15T10:00:00Z' },
      }

      const result = service.transformEventToTouchpointData(event)
      
      expect(result.title).toBe('No End Time Event')
      expect(result.occurredAt).toBeInstanceOf(Date)
      expect(result.durationMinutes).toBeUndefined()
    })

    it('should handle event with no description or location', () => {
      const event = {
        id: 'event-6',
        summary: 'Minimal Event',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
      }

      const result = service.transformEventToTouchpointData(event)
      
      expect(result.title).toBe('Minimal Event')
      expect(result.data.description).toBeUndefined()
      expect(result.data.location).toBeUndefined()
    })
  })
})
