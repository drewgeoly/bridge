/**
 * @vitest-environment jsdom
 * Tests for useRelationships hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useRelationships } from '../use-relationships'
import { apiGet } from '@/lib/api/client'

// Mock API client
vi.mock('@/lib/api/client', () => ({
  apiGet: vi.fn(),
  API_ENDPOINTS: {
    relationships: '/api/relationships',
  },
}))

describe('useRelationships', () => {
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

  it('should fetch relationships', async () => {
    const mockData = {
      relationships: [
        {
          id: 'rel-1',
          person_id: 'person-1',
          person: { id: 'person-1', name: 'John Doe' },
        },
      ],
      total: 1,
    }

    ;(apiGet as any).mockResolvedValue(mockData)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useRelationships(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData)
    expect(apiGet).toHaveBeenCalledWith('/api/relationships')
  })

  it('should pass query parameters', async () => {
    const mockData = { relationships: [], total: 0 }
    ;(apiGet as any).mockResolvedValue(mockData)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    renderHook(
      () => useRelationships({ limit: 10, offset: 0, search: 'john' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('limit=10')
      )
      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('search=john')
      )
    })
  })
})

