/**
 * Tests for SummaryAnalyticsService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SummaryAnalyticsService } from '../summary-analytics.service'
import { createClient } from '@/lib/supabase/server'
import { TouchpointRepository } from '@/lib/repositories/touchpoint.repository'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/repositories/touchpoint.repository')

describe('SummaryAnalyticsService', () => {
  let service: SummaryAnalyticsService
  let mockSupabase: any
  let mockTouchpointRepository: any

  beforeEach(() => {
    mockTouchpointRepository = {
      findByDateRange: vi.fn(),
    }
    
    class MockTouchpointRepository {
      constructor() {
        return mockTouchpointRepository
      }
    }
    ;(TouchpointRepository as any).mockImplementation(MockTouchpointRepository)
    
    service = new SummaryAnalyticsService()

    // Create chainable query builder
    const createQueryChain = () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }
      return chain
    }
    
    mockSupabase = {
      from: vi.fn().mockReturnValue(createQueryChain()),
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)
  })

  describe('calculateWeeklyMetrics', () => {
    it('should calculate metrics correctly', async () => {
      const startDate = new Date('2024-01-15')
      const endDate = new Date('2024-01-22')

      const mockTouchpoints = [
        {
          id: '1',
          user_id: 'user-1',
          relationship_id: 'rel-1',
          type: 'calendar',
          source: 'google_calendar',
          occurred_at: new Date('2024-01-16'),
          duration_minutes: 60,
          title: 'Coffee with Friend',
        },
        {
          id: '2',
          user_id: 'user-1',
          relationship_id: 'rel-1',
          type: 'calendar',
          source: 'google_calendar',
          occurred_at: new Date('2024-01-17'),
          duration_minutes: 90,
          title: 'Lunch',
        },
      ]

      mockTouchpointRepository.findByDateRange.mockResolvedValue(mockTouchpoints)

      // Mock the query chain
      const queryChain = mockSupabase.from()
      queryChain.eq.mockResolvedValue({
        data: [
          {
            id: 'rel-1',
            user_id: 'user-1',
            person_id: 'person-1',
            people: {
              id: 'person-1',
              name: 'John Doe',
              email: 'john@example.com',
            },
          },
        ],
        error: null,
      })

      const result = await service.calculateWeeklyMetrics('user-1', startDate, endDate)

      expect(result.stats.totalMeetings).toBeGreaterThan(0)
      expect(result.relationships.length).toBeGreaterThan(0)
      expect(result.insights.topRelationships.length).toBeGreaterThan(0)
    })

    it('should handle empty touchpoints', async () => {
      const startDate = new Date('2024-01-15')
      const endDate = new Date('2024-01-22')

      mockTouchpointRepository.findByDateRange.mockResolvedValue([])
      
      // Mock the query chain
      const queryChain = mockSupabase.from()
      queryChain.eq.mockResolvedValue({ data: [], error: null })

      const result = await service.calculateWeeklyMetrics('user-1', startDate, endDate)

      expect(result.stats.totalMeetings).toBe(0)
      expect(result.relationships).toHaveLength(0)
    })
  })

  describe('getRelationshipMetrics', () => {
    it('should calculate relationship metrics correctly', () => {
      const relationship = {
        id: 'rel-1',
        user_id: 'user-1',
        person_id: 'person-1',
        people: {
          id: 'person-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      }

      const touchpoints = [
        {
          id: '1',
          relationship_id: 'rel-1',
          occurred_at: new Date('2024-01-16'),
          duration_minutes: 60,
          type: 'calendar',
        },
        {
          id: '2',
          relationship_id: 'rel-1',
          occurred_at: new Date('2024-01-17'),
          duration_minutes: 90,
          type: 'calendar',
        },
      ]

      const metrics = service.getRelationshipMetrics(relationship as any, touchpoints as any)

      expect(metrics.interactionCount).toBe(2)
      expect(metrics.totalTimeMinutes).toBe(150)
      expect(metrics.averageDurationMinutes).toBe(75)
      expect(metrics.personName).toBe('John Doe')
    })
  })
})

