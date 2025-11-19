/**
 * API route for getting weekly relationship summary
 * GET /api/summaries/weekly
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WeeklySummaryService } from '@/lib/services/summaries/weekly-summary.service'

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const includeNarrative = searchParams.get('includeNarrative') === 'true'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Parse dates
    let startDate: Date | undefined
    let endDate: Date | undefined

    if (startDateParam) {
      startDate = new Date(startDateParam)
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate format. Use ISO 8601 format.' },
          { status: 400 }
        )
      }
    }

    if (endDateParam) {
      endDate = new Date(endDateParam)
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format. Use ISO 8601 format.' },
          { status: 400 }
        )
      }
    }

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      )
    }

    // Generate summary
    const summaryService = new WeeklySummaryService()
    const summary = await summaryService.generateWeeklySummary(user.id, {
      startDate,
      endDate,
      includeNarrative,
    })

    // Transform to match WeeklySummaryResponse format expected by frontend
    const response = {
      startDate: summary.weekStart.toISOString(),
      endDate: summary.weekEnd.toISOString(),
      totalMeetings: summary.stats.totalMeetings,
      totalTimeMinutes: summary.stats.totalTimeMinutes,
      uniquePeople: summary.stats.uniquePeopleCount,
      averageDurationMinutes: summary.stats.averageMeetingDurationMinutes,
      categoryBreakdown: summary.stats.categoryBreakdown,
      relationshipMetrics: summary.relationships.map((rel) => ({
        personId: rel.personId,
        personName: rel.personName,
        meetingCount: rel.interactionCount,
        totalTimeMinutes: rel.totalTimeMinutes,
        lastInteraction: rel.lastInteractionDate?.toISOString(),
      })),
      insights: (summary.insights?.patterns || []).map((pattern) => ({
        type: 'pattern',
        message: pattern,
      })),
      shortInsights: summary.insights?.shortInsights || [],
      narrative: undefined, // No longer used
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('Error generating weekly summary:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate weekly summary' },
      { status: 500 }
    )
  }
}

