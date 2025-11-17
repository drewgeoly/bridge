/**
 * API Route: Trigger manual calendar sync
 * POST /api/calendar/sync
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CalendarSyncService } from '@/lib/services/calendar/calendar-sync.service'

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse optional request body for daysBack
    let daysBack = 90
    try {
      const body = await request.json().catch(() => ({}))
      if (body.daysBack && typeof body.daysBack === 'number') {
        daysBack = body.daysBack
      }
    } catch {
      // No body provided, use default
    }

    // Trigger sync
    const syncService = new CalendarSyncService()
    const result = await syncService.syncUserCalendar(user.id, daysBack)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Sync failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...result,
      lastSyncedAt: result.lastSyncedAt?.toISOString(),
    })
  } catch (error: any) {
    console.error('Error syncing calendar:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync calendar' },
      { status: 500 }
    )
  }
}

