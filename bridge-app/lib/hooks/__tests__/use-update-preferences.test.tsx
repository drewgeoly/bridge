/**
 * @vitest-environment jsdom
 * Tests for useUpdatePreferences hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useUpdatePreferences } from '../use-update-preferences'
import { apiPut } from '@/lib/api/client'

// Mock API client
vi.mock('@/lib/api/client', () => ({
  apiPut: vi.fn(),
  API_ENDPOINTS: {
    profilePreferences: '/api/profile/preferences',
  },
}))

describe('useUpdatePreferences', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('should successfully update preferences and invalidate queries', async () => {
    const mockRequest = {
      usageFrequency: 'daily',
      advicePreference: 'practical',
    }
    const mockResponse = {
      id: 'user-1',
      email: 'user@example.com',
      preferences: {
        usageFrequency: 'daily',
        advicePreference: 'practical',
      },
      created_at: new Date(),
      updated_at: new Date(),
    }

    ;(apiPut as any).mockResolvedValue(mockResponse)
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdatePreferences(), { wrapper })

    result.current.mutate(mockRequest)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiPut).toHaveBeenCalledWith(
      '/api/profile/preferences',
      expect.objectContaining({
        usageFrequency: 'daily',
        advicePreference: 'practical',
      })
    )
    expect(result.current.data).toEqual(mockResponse)
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['profile'] })
  })

  it('should handle partial preferences update', async () => {
    const mockRequest = {
      usageFrequency: 'weekly',
    }
    const mockResponse = {
      id: 'user-1',
      email: 'user@example.com',
      preferences: {
        usageFrequency: 'weekly',
      },
      created_at: new Date(),
      updated_at: new Date(),
    }

    ;(apiPut as any).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useUpdatePreferences(), { wrapper })

    result.current.mutate(mockRequest)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiPut).toHaveBeenCalledWith(
      '/api/profile/preferences',
      expect.objectContaining({
        usageFrequency: 'weekly',
      })
    )
  })

  it('should handle mutation error', async () => {
    const mockRequest = {
      usageFrequency: 'daily',
    }
    const mockError = new Error('Failed to update preferences')
    ;(apiPut as any).mockRejectedValue(mockError)

    const { result } = renderHook(() => useUpdatePreferences(), { wrapper })

    result.current.mutate(mockRequest)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(mockError)
  })
})

