/**
 * OpenAI LLM Provider Implementation
 */

import OpenAI from 'openai'
import type { LLMProvider, LLMCompletionOptions } from './llm-provider.interface'

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI
  private model: string
  private maxTokens: number

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || ''
    this.model = process.env.OPENAI_MODEL || 'gpt-4'
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10)

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    this.client = new OpenAI({
      apiKey,
    })
  }

  /**
   * Generate a completion using OpenAI API
   */
  async generateCompletion(
    prompt: string,
    context?: Record<string, any>,
    options?: LLMCompletionOptions
  ): Promise<string> {
    try {
      const messages = this.buildMessages(prompt, context, options)

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? this.maxTokens,
        stop: options?.stopSequences,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content in OpenAI response')
      }

      return content
    } catch (error: any) {
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key')
      }
      throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Generate a streaming completion using OpenAI API
   */
  async generateCompletionStream(
    prompt: string,
    context?: Record<string, any>,
    options?: LLMCompletionOptions
  ): Promise<ReadableStream<string>> {
    try {
      const messages = this.buildMessages(prompt, context, options)

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? this.maxTokens,
        stop: options?.stopSequences,
        stream: true,
      })

      // Convert OpenAI stream to ReadableStream<string>
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content
              if (content) {
                // Enqueue as string (not encoded)
                controller.enqueue(content)
              }
            }
            controller.close()
          } catch (error: any) {
            controller.error(error)
          }
        },
      })
    } catch (error: any) {
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key')
      }
      throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Generate embeddings using OpenAI API
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      })

      return response.data[0]?.embedding || []
    } catch (error: any) {
      throw new Error(`OpenAI embeddings error: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Build messages array for OpenAI API
   */
  private buildMessages(
    prompt: string,
    context?: Record<string, any>,
    options?: LLMCompletionOptions
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

    // Add system prompt if provided
    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      })
    }

    // Add context if provided
    if (context && Object.keys(context).length > 0) {
      const contextText = this.formatContext(context)
      messages.push({
        role: 'system',
        content: `Context:\n${contextText}`,
      })
    }

    // Add user prompt
    messages.push({
      role: 'user',
      content: prompt,
    })

    return messages
  }

  /**
   * Format context object as text for LLM
   */
  private formatContext(context: Record<string, any>): string {
    return JSON.stringify(context, null, 2)
  }
}
