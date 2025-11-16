/**
 * Integration tests for /api/connections/log endpoint
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../log/route'
import { createClient } from '@/lib/supabase/server'
import { ConnectionLoggerService } from '@/lib/services/connections/connection-logger.service'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/connections/connection-logger.service')

describe('POST /api/connections/log', () => {
  let mockSupabase: any
  let mockConnectionLogger: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    }

    mockConnectionLogger = {
      logConnection: vi.fn(),
    }

    // Create constructor class that returns mock instance
    class MockConnectionLoggerService {
      constructor() {
        return mockConnectionLogger
      }
    }

    ;(createClient as any).mockResolvedValue(mockSupabase)
    ;(ConnectionLoggerService as any).mockImplementation(MockConnectionLoggerService)
  })

  it('should log connection successfully', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    const mockResult = {
      touchpoint: { id: 'touchpoint-1', type: 'note', source: 'manual' },
      relationship: { id: 'rel-1', user_id: userId },
      person: { id: 'person-1', name: 'John Doe' },
    }

    mockConnectionLogger.logConnection.mockResolvedValue(mockResult)

    const request = new Request('http://localhost/api/connections/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        method: 'call',
        description: 'Great conversation',
        occurredAt: '2024-01-15T10:00:00Z',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.touchpoint).toEqual(mockResult.touchpoint)
    expect(data.relationship).toEqual(mockResult.relationship)
    expect(data.person).toEqual(mockResult.person)
    expect(mockConnectionLogger.logConnection).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        name: 'John Doe',
        method: 'call',
        description: 'Great conversation',
      })
    )
  })

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new Request('http://localhost/api/connections/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        method: 'call',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 if name is missing', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    const request = new Request('http://localhost/api/connections/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'call',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Name is required')
  })

  it('should return 400 if method is missing', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    const request = new Request('http://localhost/api/connections/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Method is required')
  })

  it('should return 400 if invalid JSON', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    const request = new Request('http://localhost/api/connections/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid JSON')
  })

  it('should return 400 if occurredAt is invalid date', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    const request = new Request('http://localhost/api/connections/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        method: 'call',
        occurredAt: 'invalid-date',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid date format')
  })

  it('should handle connection with custom method', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    const mockResult = {
      touchpoint: { id: 'touchpoint-1', data: { method: 'in-person' } },
      relationship: { id: 'rel-1' },
      person: { id: 'person-1', name: 'Jane Smith' },
    }

    mockConnectionLogger.logConnection.mockResolvedValue(mockResult)

    const request = new Request('http://localhost/api/connections/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Smith',
        method: 'in-person',
        description: 'Met at coffee shop',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.touchpoint.data.method).toBe('in-person')
  })

  it('should handle connection without occurredAt', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    const mockResult = {
      touchpoint: { id: 'touchpoint-1' },
      relationship: { id: 'rel-1' },
      person: { id: 'person-1', name: 'Bob Wilson' },
    }

    mockConnectionLogger.logConnection.mockResolvedValue(mockResult)

    const request = new Request('http://localhost/api/connections/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Wilson',
        method: 'text',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockConnectionLogger.logConnection).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        name: 'Bob Wilson',
        method: 'text',
        occurredAt: undefined,
      })
    )
  })

  it('should handle connection with null occurredAt', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    const mockResult = {
      touchpoint: { id: 'touchpoint-1' },
      relationship: { id: 'rel-1' },
      person: { id: 'person-1', name: 'Alice Brown' },
    }

    mockConnectionLogger.logConnection.mockResolvedValue(mockResult)

    const request = new Request('http://localhost/api/connections/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Brown',
        method: 'call',
        occurredAt: null,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockConnectionLogger.logConnection).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        name: 'Alice Brown',
        method: 'call',
        occurredAt: null,
      })
    )
  })

  it('should return 500 on service errors', async () => {
    const userId = 'user-123'
    const user = { id: userId, email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    })

    mockConnectionLogger.logConnection.mockRejectedValue(
      new Error('Database error')
    )

    const request = new Request('http://localhost/api/connections/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        method: 'call',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database error')
  })

    it('should return 400 on validation errors from service', async () => {
      const userId = 'user-123'
      const user = { id: userId, email: 'test@example.com' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user },
        error: null,
      })

      mockConnectionLogger.logConnection.mockRejectedValue(
        new Error('Name is required')
      )

      const request = new Request('http://localhost/api/connections/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          method: 'call',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      // API validates first, so it returns "Name is required and must be a string"
      // But if it gets past API validation, service error would be "Name is required"
      expect(data.error).toContain('Name is required')
    })
})

