/**
 * Tests for profile preferences API route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PUT } from '../preferences/route'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('PUT /api/profile/preferences', () => {
  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
  }

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockResolvedValue(mockSupabase)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('should update preferences successfully', async () => {
    const mockCurrentProfile = {
      id: 'user-1',
      email: 'user@example.com',
      preferences: { existing: 'value' },
    }

    const mockUpdatedProfile = {
      id: 'user-1',
      email: 'user@example.com',
      preferences: {
        existing: 'value',
        usageFrequency: 'daily',
        advicePreference: 'practical',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCurrentProfile,
        error: null,
      }),
      upsert: vi.fn().mockReturnThis(),
    })

    const selectChain = mockSupabase.from('profiles').select().eq('id', mockUser.id).single()
    const upsertChain = mockSupabase.from('profiles').upsert({
      id: mockUser.id,
      email: mockUser.email,
      preferences: {
        existing: 'value',
        usageFrequency: 'daily',
        advicePreference: 'practical',
      },
      updated_at: expect.any(String),
    }, { onConflict: 'id' })

    upsertChain.select = vi.fn().mockReturnThis()
    upsertChain.single = vi.fn().mockResolvedValue({
      data: mockUpdatedProfile,
      error: null,
    })

    const request = new NextRequest('http://localhost/api/profile/preferences', {
      method: 'PUT',
      body: JSON.stringify({
        usageFrequency: 'daily',
        advicePreference: 'practical',
      }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.preferences).toMatchObject({
      existing: 'value',
      usageFrequency: 'daily',
      advicePreference: 'practical',
    })
  })

  it('should create profile if it does not exist', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows found
      }),
      upsert: vi.fn().mockReturnThis(),
    })

    const mockNewProfile = {
      id: 'user-1',
      email: 'user@example.com',
      preferences: {
        usageFrequency: 'weekly',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const upsertChain = mockSupabase.from('profiles').upsert({
      id: mockUser.id,
      email: mockUser.email,
      preferences: {
        usageFrequency: 'weekly',
      },
      updated_at: expect.any(String),
    }, { onConflict: 'id' })

    upsertChain.select = vi.fn().mockReturnThis()
    upsertChain.single = vi.fn().mockResolvedValue({
      data: mockNewProfile,
      error: null,
    })

    const request = new NextRequest('http://localhost/api/profile/preferences', {
      method: 'PUT',
      body: JSON.stringify({
        usageFrequency: 'weekly',
      }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.preferences.usageFrequency).toBe('weekly')
  })

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Unauthorized' },
    })

    const request = new NextRequest('http://localhost/api/profile/preferences', {
      method: 'PUT',
      body: JSON.stringify({
        usageFrequency: 'daily',
      }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 for invalid JSON', async () => {
    const request = new NextRequest('http://localhost/api/profile/preferences', {
      method: 'PUT',
      body: 'invalid json',
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid JSON')
  })
})

