/**
 * Google Gemini LLM Provider Implementation
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { LLMProvider, LLMCompletionOptions } from './llm-provider.interface'

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI
  private model: string
  private maxTokens: number

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || ''
    this.model = process.env.GEMINI_MODEL || 'gemini-pro'
    this.maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '2000', 10)

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }

    this.client = new GoogleGenerativeAI(apiKey)
  }

  /**
   * Generate a completion using Gemini API
   */
  async generateCompletion(
    prompt: string,
    context?: Record<string, any>,
    options?: LLMCompletionOptions
  ): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? this.maxTokens,
          stopSequences: options?.stopSequences,
        },
      })

      // Build the full prompt with context and system prompt
      const fullPrompt = this.buildPrompt(prompt, context, options)

      const result = await model.generateContent(fullPrompt)
      const response = await result.response
      const text = response.text()

      if (!text) {
        throw new Error('No content in Gemini response')
      }

      return text
    } catch (error: any) {
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }
      if (error.status === 401 || error.status === 403) {
        throw new Error('Invalid Gemini API key')
      }
      throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Generate a streaming completion using Gemini API
   */
  async generateCompletionStream(
    prompt: string,
    context?: Record<string, any>,
    options?: LLMCompletionOptions
  ): Promise<ReadableStream<string>> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? this.maxTokens,
          stopSequences: options?.stopSequences,
        },
      })

      // Build the full prompt with context and system prompt
      const fullPrompt = this.buildPrompt(prompt, context, options)

      const result = await model.generateContentStream(fullPrompt)

      // Convert Gemini stream to ReadableStream<string>
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text()
              if (text) {
                controller.enqueue(text)
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
      if (error.status === 401 || error.status === 403) {
        throw new Error('Invalid Gemini API key')
      }
      throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Generate embeddings using Gemini API
   * Note: Gemini doesn't have a separate embeddings API, so we'll use the model for this
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Gemini doesn't have a dedicated embeddings endpoint
    // For now, we'll throw an error or return empty array
    // In production, you might want to use a different service for embeddings
    throw new Error('Embeddings not supported with Gemini provider. Use a dedicated embeddings service.')
  }

  /**
   * Build the full prompt with context and system prompt
   */
  private buildPrompt(
    prompt: string,
    context?: Record<string, any>,
    options?: LLMCompletionOptions
  ): string {
    let fullPrompt = ''

    // Add system prompt if provided
    if (options?.systemPrompt) {
      fullPrompt += `${options.systemPrompt}\n\n`
    }

    // Add context if provided
    if (context && Object.keys(context).length > 0) {
      const contextText = this.formatContext(context)
      fullPrompt += `Context:\n${contextText}\n\n`
    }

    // Add user prompt
    fullPrompt += prompt

    return fullPrompt
  }

  /**
   * Format context object as text for LLM
   */
  private formatContext(context: Record<string, any>): string {
    return JSON.stringify(context, null, 2)
  }
}

