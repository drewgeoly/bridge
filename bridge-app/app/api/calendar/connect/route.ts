/**
 * API Route: Initiate Google Calendar OAuth flow
 * GET /api/calendar/connect
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleCalendarService } from '@/lib/services/calendar/google-calendar.service'

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      const requestUrl = new URL(request.url)
      return NextResponse.redirect(
        new URL('/?error=Unauthorized', requestUrl.origin)
      )
    }

    // Generate OAuth URL
    const googleCalendarService = new GoogleCalendarService()
    const authUrl = googleCalendarService.getAuthUrl(user.id)

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Error initiating calendar connection:', error)
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error.message || 'Failed to initiate calendar connection')}`, requestUrl.origin)
    )
  }
}

