/**
 * @vitest-environment jsdom
 * Tests for useWeeklySummary hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useWeeklySummary } from '../use-weekly-summary'
import { apiGet } from '@/lib/api/client'

// Mock API client
vi.mock('@/lib/api/client', () => ({
  apiGet: vi.fn(),
  API_ENDPOINTS: {
    weeklySummary: '/api/summaries/weekly',
  },
}))

describe('useWeeklySummary', () => {
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

  it('should fetch weekly summary without parameters', async () => {
    const mockData = {
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-08T00:00:00Z',
      totalMeetings: 10,
      totalTimeMinutes: 600,
      uniquePeople: 5,
      averageDurationMinutes: 60,
      categoryBreakdown: { friend: 8, family: 2 },
      relationshipMetrics: [],
      insights: [],
    }

    ;(apiGet as any).mockResolvedValue(mockData)

    const { result } = renderHook(() => useWeeklySummary(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData)
    expect(apiGet).toHaveBeenCalledWith('/api/summaries/weekly')
  })

  it('should fetch weekly summary with date range', async () => {
    const mockData = {
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-07T00:00:00Z',
      totalMeetings: 5,
      totalTimeMinutes: 300,
      uniquePeople: 3,
      averageDurationMinutes: 60,
      categoryBreakdown: {},
      relationshipMetrics: [],
      insights: [],
    }

    ;(apiGet as any).mockResolvedValue(mockData)

    const { result } = renderHook(
      () =>
        useWeeklySummary({
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-07T00:00:00Z',
        }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData)
    expect(apiGet).toHaveBeenCalledWith(
      expect.stringContaining('startDate=2025-01-01T00%3A00%3A00Z')
    )
    expect(apiGet).toHaveBeenCalledWith(
      expect.stringContaining('endDate=2025-01-07T00%3A00%3A00Z')
    )
  })

  it('should fetch weekly summary with narrative', async () => {
    const mockData = {
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-08T00:00:00Z',
      totalMeetings: 10,
      totalTimeMinutes: 600,
      uniquePeople: 5,
      averageDurationMinutes: 60,
      categoryBreakdown: {},
      relationshipMetrics: [],
      insights: [],
      narrative: 'This week you had meaningful connections with 5 people...',
    }

    ;(apiGet as any).mockResolvedValue(mockData)

    const { result } = renderHook(
      () => useWeeklySummary({ includeNarrative: true }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData)
    expect(result.current.data.narrative).toBeDefined()
    expect(apiGet).toHaveBeenCalledWith(
      expect.stringContaining('includeNarrative=true')
    )
  })

  it('should handle error', async () => {
    const mockError = new Error('Failed to fetch weekly summary')
    ;(apiGet as any).mockRejectedValue(mockError)

    const { result } = renderHook(() => useWeeklySummary(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(mockError)
  })
})

