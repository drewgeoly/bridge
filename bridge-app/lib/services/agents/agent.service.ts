/**
 * Service for orchestrating agent execution
 */

import { OpenAIProvider } from '../llm/openai.provider'
import { ContextPreparationService } from './context-preparation.service'
import { AgentConversationRepository } from '@/lib/repositories/agent-conversation.repository'
import type { LLMProvider } from '../llm/llm-provider.interface'
import type { AgentName, ContextOptions, ExtractedInsight } from '@/types/agents'

// Rate limiting configuration
const RATE_LIMIT_REQUESTS_PER_HOUR = 20
const RATE_LIMIT_WINDOW_MINUTES = 60

export class AgentService {
  private llmProvider: LLMProvider
  private contextService: ContextPreparationService
  private conversationRepository: AgentConversationRepository

  constructor() {
    this.llmProvider = new OpenAIProvider()
    this.contextService = new ContextPreparationService()
    this.conversationRepository = new AgentConversationRepository()
  }

  /**
   * Get advice from an agent (streaming)
   * Returns a stream that also stores the conversation when complete
   */
  async getAdviceStream(
    userId: string,
    message: string,
    agentName: AgentName = 'advice',
    contextOptions?: ContextOptions
  ): Promise<ReadableStream<string>> {
    // Check rate limit
    await this.checkRateLimit(userId)

    // Prepare context
    const context = await this.contextService.prepareContext(userId, contextOptions)

    // Build prompt
    const systemPrompt = this.buildSystemPrompt(agentName, context)
    const userPrompt = message

    // Get streaming response
    if (!this.llmProvider.generateCompletionStream) {
      throw new Error('Streaming not supported by LLM provider')
    }

    const llmStream = await this.llmProvider.generateCompletionStream(
      userPrompt,
      context,
      {
        systemPrompt,
        maxTokens: 2000,
        temperature: 0.7,
      }
    )

    // Wrap the stream to collect the full response and store conversation
    return this.wrapStreamWithStorage(
      llmStream,
      userId,
      agentName,
      message,
      context
    )
  }

  /**
   * Wrap LLM stream to collect full response and store conversation
   */
  private wrapStreamWithStorage(
    llmStream: ReadableStream<string>,
    userId: string,
    agentName: AgentName,
    message: string,
    context: any
  ): ReadableStream<string> {
    const reader = llmStream.getReader()
    let fullResponse = ''
    let conversationStored = false
    
    // Capture 'this' context for use in callbacks
    const conversationRepository = this.conversationRepository
    const extractInsights = this.extractInsights.bind(this)

    return new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read()

          if (done) {
            // Stream complete - store conversation and extract insights
            if (!conversationStored) {
              conversationStored = true
              try {
                const conversation = await conversationRepository.createConversation({
                  userId,
                  agentName,
                  message,
                  response: fullResponse,
                  contextSnapshot: context,
                  metadata: {
                    model: 'gpt-4',
                    streamed: true,
                  },
                })

                // Extract insights asynchronously (don't block)
                extractInsights(userId, conversation.id, fullResponse, context).catch(
                  (error) => {
                    console.error('Failed to extract insights:', error)
                  }
                )
              } catch (error) {
                console.error('Failed to store conversation:', error)
              }
            }
            controller.close()
            return
          }

          // Accumulate full response
          fullResponse += value

          // Forward chunk to client
          controller.enqueue(value)
        } catch (error) {
          controller.error(error)
        }
      },
      cancel() {
        reader.cancel()
      },
    })
  }

  /**
   * Get advice from an agent (non-streaming)
   */
  async getAdvice(
    userId: string,
    message: string,
    agentName: AgentName = 'advice',
    contextOptions?: ContextOptions
  ): Promise<{ response: string; insights: string[]; conversationId: string }> {
    // Check rate limit
    await this.checkRateLimit(userId)

    // Prepare context
    const context = await this.contextService.prepareContext(userId, contextOptions)

    // Build prompt
    const systemPrompt = this.buildSystemPrompt(agentName, context)
    const userPrompt = message

    // Get response
    const response = await this.llmProvider.generateCompletion(userPrompt, context, {
      systemPrompt,
      maxTokens: 2000,
      temperature: 0.7,
    })

    // Store conversation
    const conversation = await this.conversationRepository.createConversation({
      userId,
      agentName,
      message,
      response,
      contextSnapshot: context,
      metadata: {
        model: 'gpt-4',
      },
    })

    // Extract insights
    const insights = await this.extractInsights(userId, conversation.id, response, context)

    return {
      response,
      insights: insights.map((i) => i.content),
      conversationId: conversation.id,
    }
  }

  /**
   * Extract insights from agent response using LLM
   */
  private async extractInsights(
    userId: string,
    conversationId: string,
    response: string,
    context: any
  ): Promise<ExtractedInsight[]> {
    const extractionPrompt = `Extract key insights from the following agent response. Return a JSON array of insights, each with "type" (relationship_tip, pattern_detected, action_item, or insight), "content" (the insight text), and optionally "relatedPersonId" if the insight relates to a specific person.

Response to analyze:
${response}

Return only valid JSON array, no other text. Example format:
[{"type": "relationship_tip", "content": "You haven't talked to John in 2 weeks", "relatedPersonId": "person-123"}]`

    try {
      const extractionResponse = await this.llmProvider.generateCompletion(
        extractionPrompt,
        {},
        {
          systemPrompt: 'You are an insight extraction assistant. Extract actionable insights from text.',
          maxTokens: 500,
          temperature: 0.3,
        }
      )

      // Parse JSON response
      const insights = JSON.parse(extractionResponse) as ExtractedInsight[]

      // Store insights
      for (const insight of insights) {
        await this.conversationRepository.createInsight({
          userId,
          conversationId,
          insightType: insight.type,
          content: insight.content,
          relatedPersonId: insight.relatedPersonId,
        })
      }

      return insights
    } catch (error) {
      // If extraction fails, return empty array (don't fail the whole request)
      console.error('Failed to extract insights:', error)
      return []
    }
  }

  /**
   * Build system prompt based on agent name and context
   */
  private buildSystemPrompt(agentName: AgentName, context: any): string {
    const basePrompt = `You are a helpful relationship advisor. You help users understand and improve their relationships based on their calendar events, interactions, and relationship history.`

    if (context.focusedRelationship) {
      return `${basePrompt} The user is asking about a specific relationship. Focus your advice on that relationship and its history.`
    }

    if (agentName === 'summary') {
      return `${basePrompt} Provide comprehensive summaries of relationships and interactions.`
    }

    return basePrompt
  }

  /**
   * Check rate limit for user
   */
  private async checkRateLimit(userId: string): Promise<void> {
    const requestCount = await this.conversationRepository.getUserRequestCount(
      userId,
      RATE_LIMIT_WINDOW_MINUTES
    )

    if (requestCount >= RATE_LIMIT_REQUESTS_PER_HOUR) {
      throw new Error(
        `Rate limit exceeded. Maximum ${RATE_LIMIT_REQUESTS_PER_HOUR} requests per hour.`
      )
    }
  }

}

