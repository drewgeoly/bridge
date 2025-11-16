/**
 * Repository for managing agent conversations and insights
 */

import { createClient } from '@/lib/supabase/server'
import type { Conversation, AgentInsight } from '@/types/agents'

export interface CreateConversationInput {
  userId: string
  agentName: string
  message: string
  response: string
  contextSnapshot: Record<string, any>
  insights?: any[]
  metadata?: Record<string, any>
}

export interface CreateInsightInput {
  userId: string
  conversationId: string
  insightType: string
  content: string
  relatedPersonId?: string | null
}

export class AgentConversationRepository {
  /**
   * Create a new conversation
   */
  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('agent_conversations')
      .insert({
        user_id: input.userId,
        agent_name: input.agentName,
        message: input.message,
        response: input.response,
        context_snapshot: input.contextSnapshot || {},
        insights: input.insights || [],
        metadata: input.metadata || {},
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`)
    }

    return data as Conversation
  }

  /**
   * Get conversations by user
   */
  async getConversationsByUser(
    userId: string,
    limit: number = 10,
    agentName?: string
  ): Promise<Conversation[]> {
    const supabase = await createClient()

    let query = supabase
      .from('agent_conversations')
      .select('*')
      .eq('user_id', userId)

    if (agentName) {
      query = query.eq('agent_name', agentName)
    }

    query = query.order('created_at', { ascending: false }).limit(limit)

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get conversations: ${error.message}`)
    }

    return (data || []) as Conversation[]
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(id: string, userId: string): Promise<Conversation | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get conversation: ${error.message}`)
    }

    return data as Conversation
  }

  /**
   * Create an insight
   */
  async createInsight(input: CreateInsightInput): Promise<AgentInsight> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('agent_insights')
      .insert({
        user_id: input.userId,
        conversation_id: input.conversationId,
        insight_type: input.insightType,
        content: input.content,
        related_person_id: input.relatedPersonId || null,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create insight: ${error.message}`)
    }

    return data as AgentInsight
  }

  /**
   * Get insights by user
   */
  async getInsightsByUser(userId: string, limit: number = 20): Promise<AgentInsight[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('agent_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get insights: ${error.message}`)
    }

    return (data || []) as AgentInsight[]
  }

  /**
   * Get user request count for rate limiting
   */
  async getUserRequestCount(
    userId: string,
    timeWindowMinutes: number = 60
  ): Promise<number> {
    const supabase = await createClient()

    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString()

    const { count, error } = await supabase
      .from('agent_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', cutoffTime)

    if (error) {
      throw new Error(`Failed to get request count: ${error.message}`)
    }

    return count || 0
  }
}

