/**
 * @vitest-environment jsdom
 * Tests for SummaryView component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { SummaryView } from '../SummaryView'
import { useRelationships } from '@/lib/hooks/use-relationships'
import { useTouchpoints } from '@/lib/hooks/use-touchpoints'
import { useWeeklySummary } from '@/lib/hooks/use-weekly-summary'

// Mock hooks
vi.mock('@/lib/hooks/use-relationships', () => ({
  useRelationships: vi.fn(),
}))

vi.mock('@/lib/hooks/use-touchpoints', () => ({
  useTouchpoints: vi.fn(),
}))

vi.mock('@/lib/hooks/use-weekly-summary', () => ({
  useWeeklySummary: vi.fn(),
}))

describe('SummaryView', () => {
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

  it('should display loading state', () => {
    ;(useRelationships as any).mockReturnValue({
      data: null,
      isLoading: true,
    })
    ;(useTouchpoints as any).mockReturnValue({
      data: null,
      isLoading: true,
    })
    ;(useWeeklySummary as any).mockReturnValue({
      data: null,
      isLoading: false,
    })

    render(<SummaryView />, { wrapper })
    expect(screen.getByText('Loading summary...')).toBeInTheDocument()
  })

  it('should display stats with data', async () => {
    const mockRelationships = {
      relationships: [
        { person_id: 'p1', person: { id: 'p1', name: 'John Doe' } },
        { person_id: 'p2', person: { id: 'p2', name: 'Jane Smith' } },
      ],
    }

    const mockTouchpoints = {
      touchpoints: [
        {
          id: 't1',
          relationship_id: 'p1',
          title: 'Coffee',
          type: 'note',
          occurred_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: 't2',
          relationship_id: 'p2',
          title: 'Lunch',
          type: 'note',
          occurred_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
    }

    ;(useRelationships as any).mockReturnValue({
      data: mockRelationships,
      isLoading: false,
    })
    ;(useTouchpoints as any).mockReturnValue({
      data: mockTouchpoints,
      isLoading: false,
    })
    ;(useWeeklySummary as any).mockReturnValue({
      data: null,
      isLoading: false,
    })

    render(<SummaryView />, { wrapper })

    await waitFor(() => {
      // Check that stats are displayed
      expect(screen.getByText('Contacts')).toBeInTheDocument()
      expect(screen.getByText('Total')).toBeInTheDocument()
      // Check for recent connections
      expect(screen.getByText('Recent Connections')).toBeInTheDocument()
    })
  })

  it('should display weekly summary when showWeeklySummary is true', async () => {
    const mockRelationships = {
      relationships: [],
    }

    const mockTouchpoints = {
      touchpoints: [],
    }

    const mockWeeklySummary = {
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-08T00:00:00Z',
      totalMeetings: 10,
      totalTimeMinutes: 600,
      uniquePeople: 5,
      averageDurationMinutes: 60,
      categoryBreakdown: {},
      relationshipMetrics: [
        {
          personId: 'p1',
          personName: 'John Doe',
          meetingCount: 5,
          totalTimeMinutes: 300,
          lastInteraction: '2025-01-07T00:00:00Z',
        },
      ],
      insights: [],
      narrative: 'This week you had meaningful connections...',
    }

    ;(useRelationships as any).mockReturnValue({
      data: mockRelationships,
      isLoading: false,
    })
    ;(useTouchpoints as any).mockReturnValue({
      data: mockTouchpoints,
      isLoading: false,
    })
    ;(useWeeklySummary as any).mockReturnValue({
      data: mockWeeklySummary,
      isLoading: false,
    })

    render(<SummaryView showWeeklySummary={true} />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Weekly Summary')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument() // Total meetings
      expect(screen.getByText('5')).toBeInTheDocument() // Unique people
      expect(screen.getByText('John Doe')).toBeInTheDocument() // Top relationship
    })
  })

  it('should display empty state when no interactions', async () => {
    ;(useRelationships as any).mockReturnValue({
      data: { relationships: [] },
      isLoading: false,
    })
    ;(useTouchpoints as any).mockReturnValue({
      data: { touchpoints: [] },
      isLoading: false,
    })
    ;(useWeeklySummary as any).mockReturnValue({
      data: null,
      isLoading: false,
    })

    render(<SummaryView />, { wrapper })

    await waitFor(() => {
      expect(
        screen.getByText(
          'No interactions logged yet. Start by logging your first connection!'
        )
      ).toBeInTheDocument()
    })
  })

  it('should display recent interactions', async () => {
    const mockRelationships = {
      relationships: [
        { person_id: 'p1', person: { id: 'p1', name: 'John Doe' } },
      ],
    }

    const mockTouchpoints = {
      touchpoints: [
        {
          id: 't1',
          relationship_id: 'p1',
          title: 'Coffee',
          type: 'note',
          occurred_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
    }

    ;(useRelationships as any).mockReturnValue({
      data: mockRelationships,
      isLoading: false,
    })
    ;(useTouchpoints as any).mockReturnValue({
      data: mockTouchpoints,
      isLoading: false,
    })
    ;(useWeeklySummary as any).mockReturnValue({
      data: null,
      isLoading: false,
    })

    render(<SummaryView />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Recent Connections')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Coffee')).toBeInTheDocument()
    })
  })
})

