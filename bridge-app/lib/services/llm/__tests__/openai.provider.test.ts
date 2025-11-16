/**
 * Unit tests for OpenAIProvider
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OpenAIProvider } from '../openai.provider'
import OpenAI from 'openai'

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn(),
  }
})

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider
  let mockOpenAIClient: any

  beforeEach(() => {
    // Create mock OpenAI client
    mockOpenAIClient = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
      embeddings: {
        create: vi.fn(),
      },
    }

    // Create a constructor class that returns the mock client
    class MockOpenAI {
      constructor() {
        return mockOpenAIClient
      }
    }

    // Mock OpenAI constructor
    ;(OpenAI as any).mockImplementation(MockOpenAI)

    // Set environment variables
    process.env.OPENAI_API_KEY = 'test-key'
    process.env.OPENAI_MODEL = 'gpt-4'
  })

  afterEach(() => {
    vi.clearAllMocks()
    // Restore env var
    process.env.OPENAI_API_KEY = 'test-key'
  })

  describe('constructor', () => {
    it('should initialize with API key from environment', () => {
      process.env.OPENAI_API_KEY = 'test-key'
      provider = new OpenAIProvider()
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
      })
    })

    it('should throw error if API key not set', () => {
      const originalKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY
      expect(() => new OpenAIProvider()).toThrow('OPENAI_API_KEY environment variable is required')
      process.env.OPENAI_API_KEY = originalKey
    })
  })

  describe('generateCompletion', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key'
      provider = new OpenAIProvider()
    })

    it('should generate completion successfully', async () => {
      const prompt = 'Test prompt'
      const response = 'Test response'

      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: response,
            },
          },
        ],
      })

      const result = await provider.generateCompletion(prompt)

      expect(result).toBe(response)
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalled()
    })

    it('should include system prompt if provided', async () => {
      const prompt = 'Test prompt'
      const systemPrompt = 'You are a helpful assistant'

      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      })

      await provider.generateCompletion(prompt, {}, {
        systemPrompt,
      })

      const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0]
      expect(callArgs.messages[0].role).toBe('system')
      expect(callArgs.messages[0].content).toBe(systemPrompt)
    })

    it('should include context if provided', async () => {
      const prompt = 'Test prompt'
      const context = { relationships: [] }

      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      })

      await provider.generateCompletion(prompt, context)

      const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0]
      expect(callArgs.messages[0].role).toBe('system')
      expect(callArgs.messages[0].content).toContain('Context:')
    })

    it('should handle rate limit error', async () => {
      const prompt = 'Test prompt'

      mockOpenAIClient.chat.completions.create.mockRejectedValue({
        status: 429,
        message: 'Rate limit',
      })

      await expect(provider.generateCompletion(prompt)).rejects.toThrow(
        'Rate limit exceeded'
      )
    })

    it('should handle invalid API key error', async () => {
      const prompt = 'Test prompt'

      mockOpenAIClient.chat.completions.create.mockRejectedValue({
        status: 401,
        message: 'Invalid key',
      })

      await expect(provider.generateCompletion(prompt)).rejects.toThrow(
        'Invalid OpenAI API key'
      )
    })

    it('should throw error if no content in response', async () => {
      const prompt = 'Test prompt'

      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{}],
      })

      await expect(provider.generateCompletion(prompt)).rejects.toThrow(
        'No content in OpenAI response'
      )
    })
  })

  describe('generateCompletionStream', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key'
      provider = new OpenAIProvider()
    })

    it('should generate streaming completion', async () => {
      const prompt = 'Test prompt'

      // Create async generator for stream
      async function* mockStream() {
        yield { choices: [{ delta: { content: 'Hello' } }] }
        yield { choices: [{ delta: { content: ' World' } }] }
      }

      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockStream())

      const stream = await provider.generateCompletionStream(prompt)

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

    it('should handle rate limit error in streaming', async () => {
      const prompt = 'Test prompt'

      mockOpenAIClient.chat.completions.create.mockRejectedValue({
        status: 429,
        message: 'Rate limit',
      })

      await expect(provider.generateCompletionStream(prompt)).rejects.toThrow(
        'Rate limit exceeded'
      )
    })
  })

  describe('generateEmbedding', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key'
      provider = new OpenAIProvider()
    })

    it('should generate embedding successfully', async () => {
      const text = 'Test text'
      const embedding = [0.1, 0.2, 0.3]

      mockOpenAIClient.embeddings.create.mockResolvedValue({
        data: [{ embedding }],
      })

      const result = await provider.generateEmbedding(text)

      expect(result).toEqual(embedding)
      expect(mockOpenAIClient.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: text,
      })
    })

    it('should return empty array if no embedding', async () => {
      const text = 'Test text'

      mockOpenAIClient.embeddings.create.mockResolvedValue({
        data: [{}],
      })

      const result = await provider.generateEmbedding(text)

      expect(result).toEqual([])
    })
  })
})

