/**
 * API Route: Initiate Google Calendar OAuth flow
 * POST /api/calendar/connect
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleCalendarService } from '@/lib/services/calendar/google-calendar.service'

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

    // Generate OAuth URL
    const googleCalendarService = new GoogleCalendarService()
    const authUrl = googleCalendarService.getAuthUrl(user.id)

    return NextResponse.json({
      authUrl,
      message: 'Redirect user to this URL to authorize calendar access',
    })
  } catch (error: any) {
    console.error('Error initiating calendar connection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate calendar connection' },
      { status: 500 }
    )
  }
}

