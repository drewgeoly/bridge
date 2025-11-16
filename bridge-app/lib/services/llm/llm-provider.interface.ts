/**
 * LLM Provider Interface - abstraction layer for different LLM providers
 * 
 * This allows easy swapping between OpenAI, Anthropic, local models, etc.
 */

export interface LLMProvider {
  /**
   * Generate a completion/response from the LLM
   */
  generateCompletion(
    prompt: string,
    context?: Record<string, any>,
    options?: LLMCompletionOptions
  ): Promise<string>

  /**
   * Generate a streaming completion/response from the LLM
   */
  generateCompletionStream?(
    prompt: string,
    context?: Record<string, any>,
    options?: LLMCompletionOptions
  ): Promise<ReadableStream<string>>

  /**
   * Generate embeddings for text (for semantic search, clustering, etc.)
   */
  generateEmbedding?(text: string): Promise<number[]>
}

export interface LLMCompletionOptions {
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  stopSequences?: string[]
}

/**
 * Context that can be passed to agents
 */
export interface AgentContext {
  userId: string
  calendarEvents?: any[]
  contacts?: any[]
  pastConversations?: any[]
  relationships?: any[]
  touchpoints?: any[]
  [key: string]: any
}

