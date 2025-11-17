/**
 * API Route: Handle Google Calendar OAuth callback
 * GET /api/calendar/callback
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleCalendarService } from '@/lib/services/calendar/google-calendar.service'
import { TokenRepository } from '@/lib/repositories/token.repository'
import { CalendarSyncService } from '@/lib/services/calendar/calendar-sync.service'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state') // userId
  const error = requestUrl.searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/?error=calendar_auth_failed&message=${encodeURIComponent(error)}`,
        requestUrl.origin
      )
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        '/?error=calendar_auth_failed&message=No authorization code received',
        requestUrl.origin
      )
    )
  }

  try {
    // Verify user is authenticated (use state or get from session)
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/?error=unauthorized', requestUrl.origin)
      )
    }

    // Exchange code for tokens (use stable domain to match the redirect URI used in OAuth)
    const googleCalendarService = new GoogleCalendarService()
    const stableDomain = 'https://assignment-3-olive-eight.vercel.app'
    const redirectDomain = process.env.GOOGLE_CALENDAR_REDIRECT_URI 
      ? new URL(process.env.GOOGLE_CALENDAR_REDIRECT_URI).origin
      : stableDomain
    const tokens = await googleCalendarService.exchangeCodeForTokens(code, redirectDomain)

    // Save tokens to database
    const tokenRepository = new TokenRepository()
    await tokenRepository.saveTokens(user.id, 'google_calendar', tokens)

    // Trigger calendar sync in the background (don't wait for it)
    const syncService = new CalendarSyncService()
    syncService.syncUserCalendar(user.id, 90).catch((error) => {
      console.error('Background calendar sync failed:', error)
      // Don't fail the OAuth flow if sync fails
    })

    // Redirect to dashboard with success (use stable domain)
    const redirectTo = process.env.NEXT_PUBLIC_APP_URL || stableDomain || requestUrl.origin
    return NextResponse.redirect(
      new URL('/?calendar_connected=true', redirectTo),
      { status: 302 }
    )
  } catch (error: any) {
    console.error('Error handling calendar callback:', error)
    return NextResponse.redirect(
      new URL(
        `/?error=calendar_auth_failed&message=${encodeURIComponent(error.message)}`,
        requestUrl.origin
      )
    )
  }
}

