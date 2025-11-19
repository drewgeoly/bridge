/**
 * Agent-related types
 */

/**
 * Agent name type - flexible for future agents
 */
export type AgentName = 'advice' | 'summary' | string

/**
 * Context preparation options
 */
export interface ContextOptions {
  relationshipId?: string
  includeCalendarEvents?: boolean
  includeTouchpoints?: boolean
  includeRelationships?: boolean
  includePastConversations?: boolean
  touchpointDaysBack?: number
  conversationLimit?: number
  // Conversation metadata from frontend
  intent?: string
  friend?: { id?: string; name: string }
  activity?: string
  userTextHistory?: string[]
}

/**
 * Agent request
 */
export interface AgentRequest {
  message: string
  agentName?: AgentName
  contextOptions?: ContextOptions
  stream?: boolean
}

/**
 * Agent response (non-streaming)
 */
export interface AgentResponse {
  response: string
  insights?: string[]
  conversationId: string
  metadata?: Record<string, any>
}

/**
 * Conversation stored in database
 */
export interface Conversation {
  id: string
  user_id: string
  agent_name: string
  message: string
  response: string
  context_snapshot: Record<string, any>
  insights: any[]
  metadata: Record<string, any>
  created_at: Date
}

/**
 * Agent insight
 */
export interface AgentInsight {
  id: string
  user_id: string
  conversation_id: string
  insight_type: string
  content: string
  related_person_id?: string | null
  created_at: Date
}

/**
 * Insight extraction result
 */
export interface ExtractedInsight {
  type: string
  content: string
  relatedPersonId?: string
}

