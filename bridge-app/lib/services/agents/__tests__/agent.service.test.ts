/**
 * Unit tests for AgentService
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AgentService } from '../agent.service'
import { GeminiProvider } from '../../llm/gemini.provider'
import { ContextPreparationService } from '../context-preparation.service'
import { AgentConversationRepository } from '@/lib/repositories/agent-conversation.repository'

// Mock dependencies
vi.mock('../../llm/gemini.provider')
vi.mock('../context-preparation.service')
vi.mock('@/lib/repositories/agent-conversation.repository')

describe('AgentService', () => {
  let service: AgentService
  let mockLLMProvider: any
  let mockContextService: any
  let mockConversationRepository: any

  beforeEach(() => {
    // Create mock instances
    mockLLMProvider = {
      generateCompletion: vi.fn(),
      generateCompletionStream: vi.fn(),
      generateEmbedding: vi.fn(),
    }

    mockContextService = {
      prepareContext: vi.fn(),
    }

    mockConversationRepository = {
      createConversation: vi.fn(),
      createInsight: vi.fn(),
      getUserRequestCount: vi.fn(),
    }

    // Create constructor classes
    class MockGeminiProvider {
      constructor() {
        return mockLLMProvider
      }
    }

    class MockContextPreparationService {
      constructor() {
        return mockContextService
      }
    }

    class MockAgentConversationRepository {
      constructor() {
        return mockConversationRepository
      }
    }

    ;(GeminiProvider as any).mockImplementation(MockGeminiProvider)
    ;(ContextPreparationService as any).mockImplementation(MockContextPreparationService)
    ;(AgentConversationRepository as any).mockImplementation(MockAgentConversationRepository)

    service = new AgentService()
  })

  describe('getAdvice', () => {
    it('should get advice successfully', async () => {
      const userId = 'user-123'
      const message = 'How should I reconnect with John?'
      const context = { relationships: [], touchpoints: [] }
      const response = 'You should reach out to John...'

      mockConversationRepository.getUserRequestCount.mockResolvedValue(5)
      mockContextService.prepareContext.mockResolvedValue(context)
      mockLLMProvider.generateCompletion.mockResolvedValue(response)
      mockConversationRepository.createConversation.mockResolvedValue({
        id: 'conv-1',
        user_id: userId,
        agent_name: 'advice',
        message,
        response,
      })
      mockLLMProvider.generateCompletion.mockResolvedValueOnce(response) // For main call
        .mockResolvedValueOnce('[]') // For insight extraction

      const result = await service.getAdvice(userId, message)

      expect(result.response).toBe(response)
      expect(result.conversationId).toBe('conv-1')
      expect(mockContextService.prepareContext).toHaveBeenCalled()
      expect(mockLLMProvider.generateCompletion).toHaveBeenCalled()
    })

    it('should check rate limit before processing', async () => {
      const userId = 'user-123'
      const message = 'Test message'

      mockConversationRepository.getUserRequestCount.mockResolvedValue(25) // Exceeds limit

      await expect(service.getAdvice(userId, message)).rejects.toThrow(
        'Rate limit exceeded'
      )

      expect(mockContextService.prepareContext).not.toHaveBeenCalled()
    })

    it('should use custom agent name', async () => {
      const userId = 'user-123'
      const message = 'Test message'
      const agentName = 'summary'
      const context = { relationships: [] }

      mockConversationRepository.getUserRequestCount.mockResolvedValue(5)
      mockContextService.prepareContext.mockResolvedValue(context)
      mockLLMProvider.generateCompletion.mockResolvedValue('Response')
      mockConversationRepository.createConversation.mockResolvedValue({
        id: 'conv-1',
        agent_name: agentName,
      })
      mockLLMProvider.generateCompletion.mockResolvedValueOnce('Response')
        .mockResolvedValueOnce('[]')

      await service.getAdvice(userId, message, agentName)

      expect(mockConversationRepository.createConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          agentName,
        })
      )
    })

    it('should pass context options to context service', async () => {
      const userId = 'user-123'
      const message = 'Test message'
      const contextOptions = {
        relationshipId: 'rel-1',
        touchpointDaysBack: 60,
      }
      const context = { relationships: [] }

      mockConversationRepository.getUserRequestCount.mockResolvedValue(5)
      mockContextService.prepareContext.mockResolvedValue(context)
      mockLLMProvider.generateCompletion.mockResolvedValue('Response')
      mockConversationRepository.createConversation.mockResolvedValue({
        id: 'conv-1',
      })
      mockLLMProvider.generateCompletion.mockResolvedValueOnce('Response')
        .mockResolvedValueOnce('[]')

      await service.getAdvice(userId, message, 'advice', contextOptions)

      expect(mockContextService.prepareContext).toHaveBeenCalledWith(
        userId,
        contextOptions
      )
    })

    it('should extract and store insights', async () => {
      const userId = 'user-123'
      const message = 'Test message'
      const response = 'You should reach out to John'
      const insights = [
        { type: 'relationship_tip', content: 'Reach out to John', relatedPersonId: 'person-1' },
      ]

      mockConversationRepository.getUserRequestCount.mockResolvedValue(5)
      mockContextService.prepareContext.mockResolvedValue({})
      mockLLMProvider.generateCompletion.mockResolvedValueOnce(response)
        .mockResolvedValueOnce(JSON.stringify(insights))
      mockConversationRepository.createConversation.mockResolvedValue({
        id: 'conv-1',
      })
      mockConversationRepository.createInsight.mockResolvedValue({
        id: 'insight-1',
      })

      const result = await service.getAdvice(userId, message)

      expect(result.insights).toHaveLength(1)
      expect(mockConversationRepository.createInsight).toHaveBeenCalled()
    })

    it('should handle insight extraction failure gracefully', async () => {
      const userId = 'user-123'
      const message = 'Test message'
      const response = 'Response'

      mockConversationRepository.getUserRequestCount.mockResolvedValue(5)
      mockContextService.prepareContext.mockResolvedValue({})
      mockLLMProvider.generateCompletion.mockResolvedValueOnce(response)
        .mockResolvedValueOnce('invalid json')
      mockConversationRepository.createConversation.mockResolvedValue({
        id: 'conv-1',
      })

      const result = await service.getAdvice(userId, message)

      // Should still return response even if insight extraction fails
      expect(result.response).toBe(response)
      expect(result.insights).toEqual([])
    })
  })

  describe('getAdviceStream', () => {
    it('should return streaming response', async () => {
      const userId = 'user-123'
      const message = 'Test message'
      const context = { relationships: [] }

      // Create mock stream
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue('Hello')
          controller.enqueue(' World')
          controller.close()
        },
      })

      mockConversationRepository.getUserRequestCount.mockResolvedValue(5)
      mockContextService.prepareContext.mockResolvedValue(context)
      mockLLMProvider.generateCompletionStream.mockResolvedValue(mockStream)

      const stream = await service.getAdviceStream(userId, message)

      // Read stream
      const reader = stream.getReader()
      const chunks: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }

      expect(chunks).toContain('Hello')
      expect(chunks).toContain(' World')
    })

    it('should check rate limit before streaming', async () => {
      const userId = 'user-123'
      const message = 'Test message'

      mockConversationRepository.getUserRequestCount.mockResolvedValue(25)

      await expect(service.getAdviceStream(userId, message)).rejects.toThrow(
        'Rate limit exceeded'
      )
    })

    it('should store conversation after stream completes', async () => {
      const userId = 'user-123'
      const message = 'Test message'
      const context = { relationships: [] }

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue('Response')
          controller.close()
        },
      })

      mockConversationRepository.getUserRequestCount.mockResolvedValue(5)
      mockContextService.prepareContext.mockResolvedValue(context)
      mockLLMProvider.generateCompletionStream.mockResolvedValue(mockStream)
      mockConversationRepository.createConversation.mockResolvedValue({
        id: 'conv-1',
      })
      mockLLMProvider.generateCompletion.mockResolvedValue('[]') // For insight extraction

      const stream = await service.getAdviceStream(userId, message)

      // Consume stream to trigger storage
      const reader = stream.getReader()
      const chunks: string[] = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) chunks.push(value)
      }

      // Wait for async storage to complete
      await new Promise((resolve) => setTimeout(resolve, 200))

      expect(mockConversationRepository.createConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          agentName: 'advice',
          message,
          response: 'Response',
        })
      )
    })
  })
})

