/**
 * API Route: Handle Google Calendar OAuth callback
 * GET /api/calendar/callback
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleCalendarService } from '@/lib/services/calendar/google-calendar.service'
import { TokenRepository } from '@/lib/repositories/token.repository'

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

    // Exchange code for tokens
    const googleCalendarService = new GoogleCalendarService()
    const tokens = await googleCalendarService.exchangeCodeForTokens(code)

    // Save tokens to database
    const tokenRepository = new TokenRepository()
    await tokenRepository.saveTokens(user.id, 'google_calendar', tokens)

    // Redirect to dashboard with success
    return NextResponse.redirect(
      new URL('/?calendar_connected=true', requestUrl.origin)
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

