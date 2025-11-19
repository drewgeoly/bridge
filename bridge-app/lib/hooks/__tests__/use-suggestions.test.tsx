/**
 * @vitest-environment jsdom
 * Tests for useSuggestions hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useSuggestions } from '../use-suggestions'
import { apiGet } from '@/lib/api/client'

// Mock API client
vi.mock('@/lib/api/client', () => ({
  apiGet: vi.fn(),
  API_ENDPOINTS: {
    suggestions: '/api/agents/suggestions',
  },
}))

describe('useSuggestions', () => {
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

  it('should fetch suggestions', async () => {
    const mockData = {
      suggestions: [
        { icon: 'message', action: 'Send a text', contactName: '' },
        { icon: 'calendar', action: 'Schedule lunch', contactName: '' },
        { icon: 'coffee', action: 'Grab coffee', contactName: '' },
        { icon: 'phone', action: 'Call someone', contactName: '' },
        { icon: 'email', action: 'Send email', contactName: '' },
        { icon: 'video', action: 'Video call', contactName: '' },
        { icon: 'message', action: 'Text friend', contactName: '' },
        { icon: 'calendar', action: 'Plan meeting', contactName: '' },
        { icon: 'coffee', action: 'Coffee chat', contactName: '' },
        { icon: 'phone', action: 'Phone call', contactName: '' },
        { icon: 'email', action: 'Email friend', contactName: '' },
        { icon: 'video', action: 'Video meeting', contactName: '' },
        { icon: 'message', action: 'Send message', contactName: '' },
        { icon: 'calendar', action: 'Schedule event', contactName: '' },
        { icon: 'coffee', action: 'Meet for coffee', contactName: '' },
      ],
    }

    ;(apiGet as any).mockResolvedValue(mockData)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useSuggestions(3), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.suggestions).toHaveLength(3)
    expect(result.current.cachedCount).toBe(15)
    expect(apiGet).toHaveBeenCalledWith('/api/agents/suggestions?limit=15')
  })

  it('should use default limit of 3', async () => {
    const mockData = { 
      suggestions: Array(15).fill(null).map((_, i) => ({
        icon: 'message',
        action: `Suggestion ${i + 1}`,
        contactName: '',
      }))
    }
    ;(apiGet as any).mockResolvedValue(mockData)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    renderHook(() => useSuggestions(), { wrapper })

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('/api/agents/suggestions?limit=15')
    })
  })
})

