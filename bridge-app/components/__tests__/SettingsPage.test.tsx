/**
 * @vitest-environment jsdom
 * Tests for SettingsPage component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { SettingsPage } from '../SettingsPage'
import { useCalendarStatus } from '@/lib/hooks/use-calendar-status'
import { useProfile } from '@/lib/hooks/use-profile'
import { useUpdatePreferences } from '@/lib/hooks/use-update-preferences'

// Mock hooks
vi.mock('@/lib/hooks/use-calendar-status', () => ({
  useCalendarStatus: vi.fn(),
}))

vi.mock('@/lib/hooks/use-profile', () => ({
  useProfile: vi.fn(),
}))

vi.mock('@/lib/hooks/use-update-preferences', () => ({
  useUpdatePreferences: vi.fn(),
}))

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock API endpoints
vi.mock('@/lib/api/endpoints', () => ({
  API_ENDPOINTS: {
    calendarConnect: '/api/calendar/connect',
  },
}))

describe('SettingsPage', () => {
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
    mockPush.mockClear()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('should display loading state', () => {
    ;(useCalendarStatus as any).mockReturnValue({
      data: null,
      isLoading: true,
    })
    ;(useProfile as any).mockReturnValue({
      data: null,
      isLoading: true,
    })
    ;(useUpdatePreferences as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })

    render(<SettingsPage />, { wrapper })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should display calendar connection status', async () => {
    ;(useCalendarStatus as any).mockReturnValue({
      data: {
        connected: true,
        lastSyncedAt: '2025-01-15T10:00:00Z',
      },
      isLoading: false,
    })
    ;(useProfile as any).mockReturnValue({
      data: {
        id: 'user-1',
        email: 'user@example.com',
        preferences: {},
      },
      isLoading: false,
    })
    ;(useUpdatePreferences as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })

    render(<SettingsPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Google Calendar')).toBeInTheDocument()
      expect(screen.getByText('Calendar Connected')).toBeInTheDocument()
      expect(screen.getByText('Synced')).toBeInTheDocument()
    })
  })

  it('should allow connecting calendar when not connected', async () => {
    const originalLocation = window.location
    delete (window as any).location
    ;(window as any).location = { ...originalLocation, href: '' } as Location

    ;(useCalendarStatus as any).mockReturnValue({
      data: {
        connected: false,
      },
      isLoading: false,
    })
    ;(useProfile as any).mockReturnValue({
      data: {
        id: 'user-1',
        email: 'user@example.com',
        preferences: {},
      },
      isLoading: false,
    })
    ;(useUpdatePreferences as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })

    render(<SettingsPage />, { wrapper })

    await waitFor(() => {
      const connectButton = screen.getByText('Connect Google Calendar')
      expect(connectButton).toBeInTheDocument()
    })

    const connectButton = screen.getByText('Connect Google Calendar')
    fireEvent.click(connectButton)

    expect(window.location.href).toBe('/api/calendar/connect')

    ;(window as any).location = originalLocation
  })

  it('should load existing preferences', async () => {
    ;(useCalendarStatus as any).mockReturnValue({
      data: { connected: false },
      isLoading: false,
    })
    ;(useProfile as any).mockReturnValue({
      data: {
        id: 'user-1',
        email: 'user@example.com',
        preferences: {
          usageFrequency: 'daily',
          advicePreference: 'practical',
        },
      },
      isLoading: false,
    })
    ;(useUpdatePreferences as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })

    render(<SettingsPage />, { wrapper })

    await waitFor(() => {
      expect(
        screen.getByText('Daily - I want to stay on top of my connections')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Practical suggestions - Simple, actionable ideas')
      ).toBeInTheDocument()
    })
  })

  it('should save preferences successfully', async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({
      id: 'user-1',
      preferences: {
        usageFrequency: 'weekly',
        advicePreference: 'thoughtful',
      },
    })

    ;(useCalendarStatus as any).mockReturnValue({
      data: { connected: false },
      isLoading: false,
    })
    ;(useProfile as any).mockReturnValue({
      data: {
        id: 'user-1',
        email: 'user@example.com',
        preferences: {},
      },
      isLoading: false,
    })
    ;(useUpdatePreferences as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    })

    render(<SettingsPage />, { wrapper })

    await waitFor(() => {
      const weeklyOption = screen.getByText(
        'Weekly - Once a week is enough for me'
      )
      fireEvent.click(weeklyOption)
    })

    await waitFor(() => {
      const thoughtfulOption = screen.getByText(
        'Thoughtful prompts - Deeper connection ideas'
      )
      fireEvent.click(thoughtfulOption)
    })

    const saveButton = screen.getByText('Save Preferences')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        usageFrequency: 'weekly',
        advicePreference: 'thoughtful',
      })
    })
  })

  it('should display error message on save failure', async () => {
    const mockMutateAsync = vi.fn().mockRejectedValue(
      new Error('Failed to save preferences')
    )

    ;(useCalendarStatus as any).mockReturnValue({
      data: { connected: false },
      isLoading: false,
    })
    ;(useProfile as any).mockReturnValue({
      data: {
        id: 'user-1',
        email: 'user@example.com',
        preferences: {},
      },
      isLoading: false,
    })
    ;(useUpdatePreferences as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    })

    render(<SettingsPage />, { wrapper })

    await waitFor(() => {
      const saveButton = screen.getByText('Save Preferences')
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Failed to save preferences')).toBeInTheDocument()
    })
  })

  it('should show loading state while saving', async () => {
    const mockMutateAsync = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    ;(useCalendarStatus as any).mockReturnValue({
      data: { connected: false },
      isLoading: false,
    })
    ;(useProfile as any).mockReturnValue({
      data: {
        id: 'user-1',
        email: 'user@example.com',
        preferences: {},
      },
      isLoading: false,
    })
    ;(useUpdatePreferences as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    })

    render(<SettingsPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
  })
})

