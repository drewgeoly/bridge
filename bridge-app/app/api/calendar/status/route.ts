/**
 * API Route: Check calendar connection status
 * GET /api/calendar/status
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TokenRepository } from '@/lib/repositories/token.repository'

export async function GET(request: Request) {
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

    // Check for existing connection
    const tokenRepository = new TokenRepository()
    const account = await tokenRepository.getTokens(user.id, 'google_calendar')

    if (!account) {
      return NextResponse.json({
        connected: false,
        message: 'Calendar not connected',
      })
    }

    // Check if token is expired
    const isExpired = tokenRepository.isTokenExpired(account.expires_at)

    return NextResponse.json({
      connected: true,
      isExpired,
      lastSyncedAt: account.last_synced_at,
      expiresAt: account.expires_at,
    })
  } catch (error: any) {
    console.error('Error checking calendar status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check calendar status' },
      { status: 500 }
    )
  }
}

