/**
 * Integration tests for weekly summary API route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../weekly/route'
import { createClient } from '@/lib/supabase/server'
import { WeeklySummaryService } from '@/lib/services/summaries/weekly-summary.service'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/summaries/weekly-summary.service')

describe('GET /api/summaries/weekly', () => {
  let mockSupabase: any
  let mockSummaryService: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)

    mockSummaryService = {
      generateWeeklySummary: vi.fn(),
    }
    
    class MockWeeklySummaryService {
      constructor() {
        return mockSummaryService
      }
    }
    ;(WeeklySummaryService as any).mockImplementation(MockWeeklySummaryService)
  })

  it('should return weekly summary successfully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const mockSummary = {
      weekStart: new Date('2024-01-15'),
      weekEnd: new Date('2024-01-22'),
      stats: {
        totalMeetings: 5,
        totalTimeMinutes: 300,
        uniquePeopleCount: 3,
        averageMeetingDurationMinutes: 60,
        categoryBreakdown: {},
      },
      relationships: [],
      insights: {
        topRelationships: [],
        mostActiveDay: '2024-01-16',
        relationshipHealth: { strong: 2, moderate: 1, weak: 0 },
        patterns: [],
      },
      narrative: undefined,
      generatedAt: new Date(),
    }

    mockSummaryService.generateWeeklySummary.mockResolvedValue(mockSummary)

    const url = new URL('http://localhost/api/summaries/weekly')
    const request = {
      nextUrl: url,
    } as any
    const response = await GET(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats).toBeDefined()
    expect(data.relationships).toBeDefined()
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const url = new URL('http://localhost/api/summaries/weekly')
    const request = {
      nextUrl: url,
    } as any
    const response = await GET(request as any)

    expect(response.status).toBe(401)
  })

  it('should handle includeNarrative query parameter', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    mockSummaryService.generateWeeklySummary.mockResolvedValue({
      weekStart: new Date(),
      weekEnd: new Date(),
      stats: {},
      relationships: [],
      insights: {},
      narrative: 'Test narrative',
      generatedAt: new Date(),
    })

    const url = new URL('http://localhost/api/summaries/weekly?includeNarrative=true')
    const request = {
      nextUrl: url,
    } as any
    await GET(request as any)

    expect(mockSummaryService.generateWeeklySummary).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        includeNarrative: true,
      })
    )
  })

  it('should handle custom date range', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    mockSummaryService.generateWeeklySummary.mockResolvedValue({
      weekStart: new Date('2024-01-10'),
      weekEnd: new Date('2024-01-17'),
      stats: {},
      relationships: [],
      insights: {},
      generatedAt: new Date(),
    })

    const url = new URL('http://localhost/api/summaries/weekly?startDate=2024-01-10&endDate=2024-01-17')
    const request = {
      nextUrl: url,
    } as any
    await GET(request as any)

    expect(mockSummaryService.generateWeeklySummary).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      })
    )
  })

  it('should return 400 for invalid date format', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const url = new URL('http://localhost/api/summaries/weekly?startDate=invalid')
    const request = {
      nextUrl: url,
    } as any
    const response = await GET(request as any)

    expect(response.status).toBe(400)
  })

  it('should return 400 if startDate > endDate', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const url = new URL('http://localhost/api/summaries/weekly?startDate=2024-01-17&endDate=2024-01-10')
    const request = {
      nextUrl: url,
    } as any
    const response = await GET(request as any)

    expect(response.status).toBe(400)
  })

  it('should return 500 on service error', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    mockSummaryService.generateWeeklySummary.mockRejectedValue(new Error('Service error'))

    const url = new URL('http://localhost/api/summaries/weekly')
    const request = {
      nextUrl: url,
    } as any
    const response = await GET(request as any)

    expect(response.status).toBe(500)
  })
})

