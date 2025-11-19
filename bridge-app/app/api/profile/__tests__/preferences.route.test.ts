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

    // Mock the select chain (for checking if profile exists)
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCurrentProfile,
        error: null,
      }),
    }

    // Mock the update chain
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockUpdatedProfile,
        error: null,
      }),
    }

    // Mock from() to return appropriate chain based on method called
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        // First call is select, subsequent calls are update
        let callCount = 0
        return {
          select: vi.fn().mockReturnValue(selectChain),
          update: vi.fn().mockReturnValue(updateChain),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockCurrentProfile,
            error: null,
          }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
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
    const mockNewProfile = {
      id: 'user-1',
      email: 'user@example.com',
      preferences: {
        usageFrequency: 'weekly',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Mock the select chain (returns error indicating profile doesn't exist)
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows found
      }),
    }

    // Mock the insert chain
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockNewProfile,
        error: null,
      }),
    }

    // Mock from() to return appropriate chain
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue(selectChain),
          insert: vi.fn().mockReturnValue(insertChain),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
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

