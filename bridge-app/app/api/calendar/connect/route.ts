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
    let googleCalendarService: GoogleCalendarService
    let authUrl: string
    
    try {
      googleCalendarService = new GoogleCalendarService()
      
      // Use stable domain from env var, fallback to request origin
      const stableDomain = 'https://assignment-3-olive-eight.vercel.app'
      const redirectDomain = process.env.GOOGLE_CALENDAR_REDIRECT_URI 
        ? new URL(process.env.GOOGLE_CALENDAR_REDIRECT_URI).origin
        : stableDomain
      
      authUrl = googleCalendarService.getAuthUrl(user.id, redirectDomain)
      
      // Log for debugging
      console.log('Generated OAuth URL:', {
        hasClientId: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
        redirectDomain: redirectDomain,
        redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${redirectDomain}/api/calendar/callback`,
        authUrlLength: authUrl.length
      })
    } catch (error: any) {
      console.error('Error creating Google Calendar service:', error)
      const requestUrl = new URL(request.url)
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error.message || 'Calendar service configuration error. Please check environment variables.')}`, requestUrl.origin)
      )
    }

    // Redirect to Google OAuth (use 302 for external redirects)
    return NextResponse.redirect(authUrl, { status: 302 })
  } catch (error: any) {
    console.error('Error initiating calendar connection:', error)
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error.message || 'Failed to initiate calendar connection')}`, requestUrl.origin)
    )
  }
}

