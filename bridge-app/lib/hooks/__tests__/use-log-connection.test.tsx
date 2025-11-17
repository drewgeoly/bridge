/**
 * @vitest-environment jsdom
 * Tests for useLogConnection hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useLogConnection } from '../use-log-connection'
import { apiPost } from '@/lib/api/client'

// Mock API client
vi.mock('@/lib/api/client', () => ({
  apiPost: vi.fn(),
  API_ENDPOINTS: {
    logConnection: '/api/connections/log',
  },
}))

describe('useLogConnection', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  it('should log a connection successfully', async () => {
    const mockResponse = {
      success: true,
      touchpoint: { id: 'tp-1' },
      relationship: { id: 'rel-1' },
      person: { id: 'person-1' },
    }

    ;(apiPost as any).mockResolvedValue(mockResponse)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useLogConnection(), { wrapper })

    const input = {
      name: 'John Doe',
      method: 'Coffee',
      description: 'Great conversation',
      occurredAt: new Date('2024-01-15'),
    }

    await result.current.mutateAsync(input)

    expect(apiPost).toHaveBeenCalledWith(
      '/api/connections/log',
      expect.objectContaining({
        name: 'John Doe',
        method: 'Coffee',
        description: 'Great conversation',
        occurredAt: expect.any(String),
      })
    )
  })

  it('should handle null occurredAt', async () => {
    const mockResponse = {
      success: true,
      touchpoint: { id: 'tp-1' },
      relationship: { id: 'rel-1' },
      person: { id: 'person-1' },
    }

    ;(apiPost as any).mockResolvedValue(mockResponse)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useLogConnection(), { wrapper })

    const input = {
      name: 'John Doe',
      method: 'Coffee',
      occurredAt: null,
    }

    await result.current.mutateAsync(input)

    expect(apiPost).toHaveBeenCalledWith(
      '/api/connections/log',
      expect.objectContaining({
        name: 'John Doe',
        method: 'Coffee',
        occurredAt: null,
      })
    )
  })
})

