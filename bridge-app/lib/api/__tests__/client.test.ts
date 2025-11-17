/**
 * Tests for API client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiGet, apiPost, ApiError } from '../client'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn()

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'test-token',
            },
          },
        }),
      },
    })
  })

  describe('apiGet', () => {
    it('should make a GET request with authentication', async () => {
      const mockResponse = { data: 'test' }
      ;(fetch as any).mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => mockResponse,
      })

      const result = await apiGet('/api/test')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw ApiError on non-ok response', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({ error: 'Not found' }),
      })

      await expect(apiGet('/api/test')).rejects.toThrow(ApiError)
    })
  })

  describe('apiPost', () => {
    it('should make a POST request with body', async () => {
      const mockResponse = { success: true }
      const requestBody = { name: 'test' }
      ;(fetch as any).mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => mockResponse,
      })

      const result = await apiPost('/api/test', requestBody)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })
})

