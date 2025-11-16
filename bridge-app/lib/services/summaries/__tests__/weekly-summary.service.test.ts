/**
 * Tests for WeeklySummaryService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WeeklySummaryService } from '../weekly-summary.service'
import { SummaryAnalyticsService } from '../summary-analytics.service'
import { AgentService } from '../../agents/agent.service'

vi.mock('../summary-analytics.service')
vi.mock('../../agents/agent.service')

describe('WeeklySummaryService', () => {
  let service: WeeklySummaryService
  let mockAnalyticsService: any
  let mockAgentService: any

  beforeEach(() => {
    mockAnalyticsService = {
      calculateWeeklyMetrics: vi.fn(),
    }
    
    mockAgentService = {
      getAdvice: vi.fn(),
    }
    
    class MockSummaryAnalyticsService {
      constructor() {
        return mockAnalyticsService
      }
    }
    
    class MockAgentService {
      constructor() {
        return mockAgentService
      }
    }
    
    ;(SummaryAnalyticsService as any).mockImplementation(MockSummaryAnalyticsService)
    ;(AgentService as any).mockImplementation(MockAgentService)
    
    service = new WeeklySummaryService()
  })

  describe('generateWeeklySummary', () => {
    it('should generate summary without narrative', async () => {
      const mockMetrics = {
        stats: {
          totalMeetings: 5,
          totalTimeMinutes: 300,
          uniquePeopleCount: 3,
          averageMeetingDurationMinutes: 60,
          meetingsByDay: {},
          timeByDay: {},
          categoryBreakdown: {},
        },
        relationships: [],
        insights: {
          topRelationships: [],
          mostActiveDay: '2024-01-16',
          relationshipHealth: { strong: 2, moderate: 1, weak: 0 },
          patterns: [],
        },
      }

      mockAnalyticsService.calculateWeeklyMetrics.mockResolvedValue(mockMetrics)

      const result = await service.generateWeeklySummary('user-1', {
        includeNarrative: false,
      })

      expect(result.stats).toBeDefined()
      expect(result.narrative).toBeUndefined()
      expect(result.generatedAt).toBeInstanceOf(Date)
    })

    it('should generate summary with narrative', async () => {
      const mockMetrics = {
        stats: {
          totalMeetings: 5,
          totalTimeMinutes: 300,
          uniquePeopleCount: 3,
          averageMeetingDurationMinutes: 60,
          meetingsByDay: {},
          timeByDay: {},
          categoryBreakdown: {},
        },
        relationships: [],
        insights: {
          topRelationships: [],
          mostActiveDay: '2024-01-16',
          relationshipHealth: { strong: 2, moderate: 1, weak: 0 },
          patterns: [],
        },
      }

      mockAnalyticsService.calculateWeeklyMetrics.mockResolvedValue(mockMetrics)
      mockAgentService.getAdvice.mockResolvedValue({
        response: 'This was a great week for relationships!',
      })

      const result = await service.generateWeeklySummary('user-1', {
        includeNarrative: true,
      })

      expect(result.narrative).toBeDefined()
      expect(mockAgentService.getAdvice).toHaveBeenCalled()
    })

    it('should use custom date range', async () => {
      const startDate = new Date('2024-01-10')
      const endDate = new Date('2024-01-17')

      mockAnalyticsService.calculateWeeklyMetrics.mockResolvedValue({
        stats: { totalMeetings: 0, totalTimeMinutes: 0, uniquePeopleCount: 0, averageMeetingDurationMinutes: 0, meetingsByDay: {}, timeByDay: {}, categoryBreakdown: {} },
        relationships: [],
        insights: { topRelationships: [], mostActiveDay: '', relationshipHealth: { strong: 0, moderate: 0, weak: 0 }, patterns: [] },
      })

      await service.generateWeeklySummary('user-1', {
        startDate,
        endDate,
      })

      expect(mockAnalyticsService.calculateWeeklyMetrics).toHaveBeenCalledWith(
        'user-1',
        startDate,
        endDate
      )
    })

    it('should use default date range (past 7 days)', async () => {
      mockAnalyticsService.calculateWeeklyMetrics.mockResolvedValue({
        stats: { totalMeetings: 0, totalTimeMinutes: 0, uniquePeopleCount: 0, averageMeetingDurationMinutes: 0, meetingsByDay: {}, timeByDay: {}, categoryBreakdown: {} },
        relationships: [],
        insights: { topRelationships: [], mostActiveDay: '', relationshipHealth: { strong: 0, moderate: 0, weak: 0 }, patterns: [] },
      })

      await service.generateWeeklySummary('user-1')

      expect(mockAnalyticsService.calculateWeeklyMetrics).toHaveBeenCalled()
      const callArgs = mockAnalyticsService.calculateWeeklyMetrics.mock.calls[0]
      const startDate = callArgs[1]
      const endDate = callArgs[2]

      // Check that it's approximately 7 days
      const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeCloseTo(7, 0)
    })

    it('should handle LLM failure gracefully', async () => {
      const mockMetrics = {
        stats: {
          totalMeetings: 5,
          totalTimeMinutes: 300,
          uniquePeopleCount: 3,
          averageMeetingDurationMinutes: 60,
          meetingsByDay: {},
          timeByDay: {},
          categoryBreakdown: {},
        },
        relationships: [],
        insights: {
          topRelationships: [],
          mostActiveDay: '2024-01-16',
          relationshipHealth: { strong: 2, moderate: 1, weak: 0 },
          patterns: [],
        },
      }

      mockAnalyticsService.calculateWeeklyMetrics.mockResolvedValue(mockMetrics)
      mockAgentService.getAdvice.mockRejectedValue(new Error('LLM API error'))

      const result = await service.generateWeeklySummary('user-1', {
        includeNarrative: true,
      })

      // Should have fallback narrative
      expect(result.narrative).toBeDefined()
      expect(result.narrative).toContain('meaningful interactions')
    })
  })
})

