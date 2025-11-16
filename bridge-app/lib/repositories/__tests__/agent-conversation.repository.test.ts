/**
 * Unit tests for AgentConversationRepository
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AgentConversationRepository } from '../agent-conversation.repository'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server')

describe('AgentConversationRepository', () => {
  let repository: AgentConversationRepository
  let mockSupabase: any

  beforeEach(() => {
    repository = new AgentConversationRepository()
    
    // Create mock Supabase query builder with proper chaining
    const createInsertChain = () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }
      return chain
    }
    
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnValue(createInsertChain()),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    
    ;(createClient as any).mockResolvedValue(mockSupabase)
  })

  describe('createConversation', () => {
    it('should create conversation successfully', async () => {
      const input = {
        userId: 'user-123',
        agentName: 'advice',
        message: 'How should I reconnect with John?',
        response: 'You should reach out...',
        contextSnapshot: { relationships: [] },
        insights: [],
        metadata: { model: 'gpt-4' },
      }

      const createdConversation = {
        id: 'conv-1',
        ...input,
        created_at: new Date().toISOString(),
      }

      const insertChain = mockSupabase.insert()
      insertChain.single.mockResolvedValue({
        data: createdConversation,
        error: null,
      })

      const result = await repository.createConversation(input)

      expect(result.id).toBe('conv-1')
      expect(result.message).toBe(input.message)
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_conversations')
    })

    it('should throw error on database failure', async () => {
      const input = {
        userId: 'user-123',
        agentName: 'advice',
        message: 'Test',
        response: 'Response',
        contextSnapshot: {},
      }

      const insertChain = mockSupabase.insert()
      insertChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(repository.createConversation(input)).rejects.toThrow(
        'Failed to create conversation'
      )
    })
  })

  describe('getConversationsByUser', () => {
    it('should get conversations successfully', async () => {
      const userId = 'user-123'
      const conversations = [
        { id: 'conv-1', user_id: userId, agent_name: 'advice' },
        { id: 'conv-2', user_id: userId, agent_name: 'advice' },
      ]

      mockSupabase.limit.mockResolvedValue({
        data: conversations,
        error: null,
      })

      const result = await repository.getConversationsByUser(userId, 10)

      expect(result).toHaveLength(2)
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_conversations')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
    })

    it('should filter by agent name if provided', async () => {
      const userId = 'user-123'
      const conversations = [
        { id: 'conv-1', user_id: userId, agent_name: 'advice' },
      ]

      // Create chainable query mock
      const queryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: conversations,
          error: null,
        }),
      }
      queryChain.eq.mockReturnValue(queryChain)
      queryChain.order.mockReturnValue(queryChain)

      mockSupabase.select.mockReturnValue(queryChain)

      await repository.getConversationsByUser(userId, 10, 'advice')

      expect(queryChain.eq).toHaveBeenCalledWith('user_id', userId)
      expect(queryChain.eq).toHaveBeenCalledWith('agent_name', 'advice')
    })

    it('should return empty array if no conversations found', async () => {
      const userId = 'user-123'

      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await repository.getConversationsByUser(userId)

      expect(result).toEqual([])
    })
  })

  describe('getConversationById', () => {
    it('should get conversation by ID', async () => {
      const id = 'conv-1'
      const userId = 'user-123'
      const conversation = {
        id,
        user_id: userId,
        agent_name: 'advice',
      }

      mockSupabase.single.mockResolvedValue({
        data: conversation,
        error: null,
      })

      const result = await repository.getConversationById(id, userId)

      expect(result).toEqual(conversation)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', id)
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
    })

    it('should return null if conversation not found', async () => {
      const id = 'conv-1'
      const userId = 'user-123'

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await repository.getConversationById(id, userId)

      expect(result).toBeNull()
    })
  })

  describe('createInsight', () => {
    it('should create insight successfully', async () => {
      const input = {
        userId: 'user-123',
        conversationId: 'conv-1',
        insightType: 'relationship_tip',
        content: 'You should reach out to John',
        relatedPersonId: 'person-1',
      }

      const createdInsight = {
        id: 'insight-1',
        ...input,
        created_at: new Date().toISOString(),
      }

      const insertChain = mockSupabase.insert()
      insertChain.single.mockResolvedValue({
        data: createdInsight,
        error: null,
      })

      const result = await repository.createInsight(input)

      expect(result.id).toBe('insight-1')
      expect(result.content).toBe(input.content)
    })

    it('should handle null relatedPersonId', async () => {
      const input = {
        userId: 'user-123',
        conversationId: 'conv-1',
        insightType: 'insight',
        content: 'General insight',
      }

      const insertChain = mockSupabase.insert()
      insertChain.single.mockResolvedValue({
        data: { id: 'insight-1', ...input, related_person_id: null },
        error: null,
      })

      await repository.createInsight(input)

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          related_person_id: null,
        })
      )
    })
  })

  describe('getInsightsByUser', () => {
    it('should get insights successfully', async () => {
      const userId = 'user-123'
      const insights = [
        { id: 'insight-1', user_id: userId },
        { id: 'insight-2', user_id: userId },
      ]

      mockSupabase.limit.mockResolvedValue({
        data: insights,
        error: null,
      })

      const result = await repository.getInsightsByUser(userId, 20)

      expect(result).toHaveLength(2)
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_insights')
    })
  })

  describe('getUserRequestCount', () => {
    it('should get request count for time window', async () => {
      const userId = 'user-123'
      const timeWindowMinutes = 60

      mockSupabase.gte.mockResolvedValue({
        count: 5,
        error: null,
      })

      const result = await repository.getUserRequestCount(userId, timeWindowMinutes)

      expect(result).toBe(5)
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_conversations')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
    })

    it('should return 0 if no requests', async () => {
      const userId = 'user-123'

      mockSupabase.gte.mockResolvedValue({
        count: 0,
        error: null,
      })

      const result = await repository.getUserRequestCount(userId)

      expect(result).toBe(0)
    })
  })
})

