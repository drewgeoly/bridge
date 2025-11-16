/**
 * Integration tests for /api/agents/advice endpoint
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../advice/route'
import { createClient } from '@/lib/supabase/server'
import { AgentService } from '@/lib/services/agents/agent.service'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/agents/agent.service')

describe('POST /api/agents/advice', () => {
  let mockSupabase: any
  let mockAgentService: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    }

    mockAgentService = {
      getAdvice: vi.fn(),
      getAdviceStream: vi.fn(),
    }

    // Create constructor class
    class MockAgentService {
      constructor() {
        return mockAgentService
      }
    }

    ;(createClient as any).mockResolvedValue(mockSupabase)
    ;(AgentService as any).mockImplementation(MockAgentService)
  })

  it('should return streaming response by default', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue('Hello')
        controller.close()
      },
    })

    mockAgentService.getAdviceStream.mockResolvedValue(mockStream)

    const request = new Request('http://localhost/api/agents/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How should I reconnect?',
      }),
    })

    const response = await POST(request)

    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(mockAgentService.getAdviceStream).toHaveBeenCalled()
  })

  it('should return non-streaming response if stream=false', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    mockAgentService.getAdvice.mockResolvedValue({
      response: 'You should reach out...',
      insights: ['Reach out to John'],
      conversationId: 'conv-1',
    })

    const request = new Request('http://localhost/api/agents/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How should I reconnect?',
        stream: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.response).toBe('You should reach out...')
    expect(data.insights).toEqual(['Reach out to John'])
    expect(mockAgentService.getAdvice).toHaveBeenCalled()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new Request('http://localhost/api/agents/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test message',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 if message is missing', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    const request = new Request('http://localhost/api/agents/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Message is required')
  })

  it('should return 400 if message is empty', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    const request = new Request('http://localhost/api/agents/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '   ',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('cannot be empty')
  })

  it('should pass context options to agent service', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    mockAgentService.getAdvice.mockResolvedValue({
      response: 'Response',
      insights: [],
      conversationId: 'conv-1',
    })

    const contextOptions = {
      relationshipId: 'rel-1',
      touchpointDaysBack: 60,
    }

    const request = new Request('http://localhost/api/agents/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test message',
        stream: false,
        contextOptions,
      }),
    })

    await POST(request)

    expect(mockAgentService.getAdvice).toHaveBeenCalledWith(
      userId,
      'Test message',
      'advice',
      contextOptions
    )
  })

  it('should return 429 on rate limit error', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    mockAgentService.getAdvice.mockRejectedValue(
      new Error('Rate limit exceeded. Maximum 20 requests per hour.')
    )

    const request = new Request('http://localhost/api/agents/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test message',
        stream: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toContain('Rate limit exceeded')
  })

  it('should return 500 on service errors', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    mockAgentService.getAdvice.mockRejectedValue(
      new Error('LLM API error')
    )

    const request = new Request('http://localhost/api/agents/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test message',
        stream: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('LLM API error')
  })

  it('should use custom agent name if provided', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    mockAgentService.getAdvice.mockResolvedValue({
      response: 'Response',
      insights: [],
      conversationId: 'conv-1',
    })

    const request = new Request('http://localhost/api/agents/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test message',
        agentName: 'summary',
        stream: false,
      }),
    })

    await POST(request)

    expect(mockAgentService.getAdvice).toHaveBeenCalledWith(
      userId,
      'Test message',
      'summary',
      undefined
    )
  })
})

