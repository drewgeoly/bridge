/**
 * Service for preparing context data for agents
 */

import { createClient } from '@/lib/supabase/server'
import { TouchpointRepository } from '@/lib/repositories/touchpoint.repository'
import { AgentConversationRepository } from '@/lib/repositories/agent-conversation.repository'
import type { AgentContext } from '../llm/llm-provider.interface'
import type { ContextOptions } from '@/types/agents'

export class ContextPreparationService {
  private touchpointRepository: TouchpointRepository
  private conversationRepository: AgentConversationRepository

  constructor() {
    this.touchpointRepository = new TouchpointRepository()
    this.conversationRepository = new AgentConversationRepository()
  }

  /**
   * Prepare context for an agent based on options
   */
  async prepareContext(
    userId: string,
    options?: ContextOptions
  ): Promise<AgentContext> {
    const context: AgentContext = {
      userId,
    }

    // Default values
    const includeCalendarEvents = options?.includeCalendarEvents ?? true
    const includeTouchpoints = options?.includeTouchpoints ?? true
    const includeRelationships = options?.includeRelationships ?? true
    const includePastConversations = options?.includePastConversations ?? true
    const touchpointDaysBack = options?.touchpointDaysBack ?? 30
    const conversationLimit = options?.conversationLimit ?? 10

    // Get relationships
    if (includeRelationships) {
      if (options?.relationshipId) {
        // Focus on specific relationship
        context.relationships = await this.getRelationshipById(
          userId,
          options.relationshipId
        )
        context.focusedRelationship = options.relationshipId
      } else {
        // Get all active relationships
        context.relationships = await this.getActiveRelationships(userId)
      }
    }

    // Get touchpoints
    if (includeTouchpoints) {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - touchpointDaysBack)

      if (options?.relationshipId) {
        // Get touchpoints for specific relationship
        context.touchpoints = await this.touchpointRepository.findByRelationshipId(
          options.relationshipId,
          userId
        )
      } else {
        // Get recent touchpoints
        context.touchpoints = await this.touchpointRepository.findByDateRange(
          userId,
          startDate,
          endDate
        )
      }
    }

    // Get calendar events (from touchpoints with type 'calendar')
    if (includeCalendarEvents) {
      const calendarTouchpoints =
        context.touchpoints?.filter((tp) => tp.type === 'calendar') || []
      context.calendarEvents = calendarTouchpoints.map((tp) => ({
        id: tp.id,
        title: tp.title,
        occurredAt: tp.occurred_at,
        durationMinutes: tp.duration_minutes,
        data: tp.data,
        rawEventData: tp.raw_event_data,
      }))
    }

    // Get past conversations
    if (includePastConversations) {
      const agentName = options?.relationshipId ? 'relationship_insights' : 'advice'
      context.pastConversations = await this.conversationRepository.getConversationsByUser(
        userId,
        conversationLimit,
        agentName
      )
    }

    return context
  }

  /**
   * Get active relationships for a user
   */
  private async getActiveRelationships(userId: string): Promise<any[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('relationships')
      .select(`
        *,
        people (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('last_interaction', { ascending: false })

    if (error) {
      throw new Error(`Failed to get relationships: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a specific relationship with related data
   */
  private async getRelationshipById(
    userId: string,
    relationshipId: string
  ): Promise<any[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('relationships')
      .select(`
        *,
        people (*)
      `)
      .eq('id', relationshipId)
      .eq('user_id', userId)
      .single()

    if (error) {
      throw new Error(`Failed to get relationship: ${error.message}`)
    }

    return data ? [data] : []
  }
}

