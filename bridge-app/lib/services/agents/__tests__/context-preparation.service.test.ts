/**
 * Unit tests for ContextPreparationService
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContextPreparationService } from '../context-preparation.service'
import { TouchpointRepository } from '@/lib/repositories/touchpoint.repository'
import { AgentConversationRepository } from '@/lib/repositories/agent-conversation.repository'
import { createClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/repositories/touchpoint.repository')
vi.mock('@/lib/repositories/agent-conversation.repository')
vi.mock('@/lib/supabase/server')

describe('ContextPreparationService', () => {
  let service: ContextPreparationService
  let mockTouchpointRepository: any
  let mockConversationRepository: any
  let mockSupabase: any

  beforeEach(() => {
    // Create mock instances
    mockTouchpointRepository = {
      findByRelationshipId: vi.fn(),
      findByDateRange: vi.fn(),
    }

    mockConversationRepository = {
      getConversationsByUser: vi.fn(),
    }

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }

    // Create constructor classes
    class MockTouchpointRepository {
      constructor() {
        return mockTouchpointRepository
      }
    }

    class MockConversationRepository {
      constructor() {
        return mockConversationRepository
      }
    }

    ;(TouchpointRepository as any).mockImplementation(MockTouchpointRepository)
    ;(AgentConversationRepository as any).mockImplementation(MockConversationRepository)
    ;(createClient as any).mockResolvedValue(mockSupabase)

    service = new ContextPreparationService()
  })

  describe('prepareContext', () => {
    it('should prepare context with all default options', async () => {
      const userId = 'user-123'

      mockSupabase.order.mockResolvedValue({
        data: [
          { id: 'rel-1', user_id: userId, status: 'active' },
        ],
        error: null,
      })

      mockTouchpointRepository.findByDateRange.mockResolvedValue([
        { id: 'tp-1', type: 'calendar', title: 'Meeting', occurred_at: new Date() },
      ])

      mockConversationRepository.getConversationsByUser.mockResolvedValue([
        { id: 'conv-1', message: 'Previous question' },
      ])

      const context = await service.prepareContext(userId)

      expect(context.userId).toBe(userId)
      expect(context.relationships).toBeDefined()
      expect(context.touchpoints).toBeDefined()
      expect(context.calendarEvents).toBeDefined()
      expect(context.pastConversations).toBeDefined()
    })

    it('should prepare context for specific relationship', async () => {
      const userId = 'user-123'
      const relationshipId = 'rel-1'

      mockSupabase.single.mockResolvedValue({
        data: { id: relationshipId, user_id: userId },
        error: null,
      })

      mockTouchpointRepository.findByRelationshipId.mockResolvedValue([
        { id: 'tp-1', relationship_id: relationshipId, type: 'note' },
      ])

      const context = await service.prepareContext(userId, {
        relationshipId,
      })

      expect(context.focusedRelationship).toBe(relationshipId)
      expect(context.relationships).toHaveLength(1)
      expect(mockTouchpointRepository.findByRelationshipId).toHaveBeenCalledWith(
        relationshipId,
        userId
      )
    })

    it('should exclude calendar events if option set', async () => {
      const userId = 'user-123'

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      })

      mockTouchpointRepository.findByDateRange.mockResolvedValue([
        { id: 'tp-1', type: 'note' },
      ])

      const context = await service.prepareContext(userId, {
        includeCalendarEvents: false,
      })

      expect(context.calendarEvents).toBeUndefined()
    })

    it('should exclude touchpoints if option set', async () => {
      const userId = 'user-123'

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      })

      const context = await service.prepareContext(userId, {
        includeTouchpoints: false,
      })

      expect(context.touchpoints).toBeUndefined()
    })

    it('should use custom touchpointDaysBack', async () => {
      const userId = 'user-123'
      const daysBack = 60

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      })

      mockTouchpointRepository.findByDateRange.mockResolvedValue([])

      await service.prepareContext(userId, {
        touchpointDaysBack: daysBack,
      })

      const callArgs = mockTouchpointRepository.findByDateRange.mock.calls[0]
      const startDate = callArgs[1]
      const endDate = callArgs[2]

      const expectedStart = new Date()
      expectedStart.setDate(expectedStart.getDate() - daysBack)

      expect(startDate.getTime()).toBeCloseTo(expectedStart.getTime(), -3) // Within 1 second
      expect(endDate).toBeInstanceOf(Date)
    })

    it('should filter calendar events from touchpoints', async () => {
      const userId = 'user-123'

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      })

      mockTouchpointRepository.findByDateRange.mockResolvedValue([
        { id: 'tp-1', type: 'calendar', title: 'Meeting', occurred_at: new Date() },
        { id: 'tp-2', type: 'note', title: 'Note', occurred_at: new Date() },
      ])

      const context = await service.prepareContext(userId)

      expect(context.calendarEvents).toHaveLength(1)
      expect(context.calendarEvents?.[0].id).toBe('tp-1')
    })
  })
})

