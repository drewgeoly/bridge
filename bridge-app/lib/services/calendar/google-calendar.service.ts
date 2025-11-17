/**
 * Service for interacting with Google Calendar API
 */

import { google } from 'googleapis'
import { TokenRepository } from '@/lib/repositories/token.repository'
import type { GoogleCalendarEvent } from '@/types/calendar'
import { parseGoogleAPIDate, calculateDurationMinutes } from '@/lib/utils/date.utils'

export class GoogleCalendarService {
  private tokenRepository: TokenRepository
  private clientId: string
  private clientSecret: string
  private baseRedirectUri: string

  constructor() {
    this.tokenRepository = new TokenRepository()
    
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim()
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim()
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI?.trim()

    if (!clientId || !clientSecret) {
      const missing = []
      if (!clientId) missing.push('GOOGLE_CALENDAR_CLIENT_ID')
      if (!clientSecret) missing.push('GOOGLE_CALENDAR_CLIENT_SECRET')
      
      console.error('Missing Google Calendar env vars:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      })
      
      throw new Error(
        `Missing required Google Calendar environment variables: ${missing.join(', ')}. ` +
        `Please set these in your Vercel environment variables and redeploy.`
      )
    }

    this.clientId = clientId
    this.clientSecret = clientSecret
    // Use redirect URI from env if set, otherwise we'll construct it from request origin
    this.baseRedirectUri = redirectUri || ''
  }

  /**
   * Get OAuth2 authorization URL
   * @param state Optional state parameter
   * @param requestOrigin Optional origin from request (for dynamic redirect URI)
   */
  getAuthUrl(state?: string, requestOrigin?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
    ]

    // Determine redirect URI - use request origin if provided, otherwise use env var
    let redirectUri = this.baseRedirectUri
    if (requestOrigin && !redirectUri) {
      redirectUri = `${requestOrigin}/api/calendar/callback`
    }

    if (!redirectUri) {
      throw new Error(
        'Redirect URI not configured. Either set GOOGLE_CALENDAR_REDIRECT_URI environment variable ' +
        'or provide requestOrigin parameter.'
      )
    }

    // Create OAuth2 client with current redirect URI
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      redirectUri
    )

    try {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent', // Force consent to get refresh token
        state,
      })

      // Verify the URL contains client_id
      if (!authUrl.includes('client_id=')) {
        console.error('OAuth URL missing client_id:', {
          hasClientId: !!this.clientId,
          redirectUri: redirectUri,
          authUrl: authUrl.substring(0, 100)
        })
        throw new Error('Generated OAuth URL is missing client_id. Check GOOGLE_CALENDAR_CLIENT_ID environment variable.')
      }

      // Log for debugging
      console.log('OAuth URL generated successfully:', {
        hasClientId: authUrl.includes('client_id='),
        hasRedirectUri: authUrl.includes('redirect_uri='),
        redirectUri: redirectUri,
        urlLength: authUrl.length
      })

      return authUrl
    } catch (error: any) {
      console.error('Error generating OAuth URL:', {
        error: error.message,
        clientIdSet: !!this.clientId,
        clientSecretSet: !!this.clientSecret,
        redirectUri: redirectUri
      })
      throw error
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, requestOrigin?: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
  }> {
    // Determine redirect URI - use request origin if provided, otherwise use env var
    let redirectUri = this.baseRedirectUri
    if (requestOrigin && !redirectUri) {
      redirectUri = `${requestOrigin}/api/calendar/callback`
    }

    if (!redirectUri) {
      throw new Error('Redirect URI not configured for token exchange')
    }

    // Create OAuth2 client with current redirect URI
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      redirectUri
    )

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      throw new Error('No access token received from Google')
    }

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : undefined

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt,
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(userId: string): Promise<string> {
    const account = await this.tokenRepository.getTokens(userId, 'google_calendar')

    if (!account?.refresh_token) {
      throw new Error('No refresh token available')
    }

    // Create OAuth2 client for refresh (redirect URI not needed for refresh)
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.baseRedirectUri || 'http://localhost:3000/api/calendar/callback' // Dummy URI for refresh
    )

    oauth2Client.setCredentials({
      refresh_token: account.refresh_token,
    })

    const { credentials } = await oauth2Client.refreshAccessToken()

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token')
    }

    // Save new tokens
    await this.tokenRepository.saveTokens(userId, 'google_calendar', {
      accessToken: credentials.access_token,
      refreshToken: account.refresh_token, // Refresh token doesn't change
      expiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : undefined,
    })

    return credentials.access_token
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const account = await this.tokenRepository.getTokens(userId, 'google_calendar')

    if (!account?.access_token) {
      throw new Error('No access token found. Please reconnect your calendar.')
    }

    // Check if token is expired or will expire soon
    if (this.tokenRepository.isTokenExpired(account.expires_at)) {
      return await this.refreshAccessToken(userId)
    }

    return account.access_token
  }

  /**
   * Fetch events from Google Calendar API
   */
  async fetchEvents(
    accessToken: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<GoogleCalendarEvent[]> {
    // Create OAuth2 client for API calls (redirect URI not needed)
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.baseRedirectUri || 'http://localhost:3000/api/calendar/callback' // Dummy URI for API calls
    )

    oauth2Client.setCredentials({
      access_token: accessToken,
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: 2500, // Google Calendar API limit
        singleEvents: true,
        orderBy: 'startTime',
      })

      return (response.data.items || []) as GoogleCalendarEvent[]
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid or expired access token')
      }
      throw new Error(`Failed to fetch calendar events: ${error.message}`)
    }
  }

  /**
   * Transform Google Calendar event to our touchpoint format
   */
  transformEventToTouchpointData(event: GoogleCalendarEvent): {
    title?: string
    occurredAt: Date
    durationMinutes?: number
    data: Record<string, any>
  } {
    // Parse start time
    const startTime = parseGoogleAPIDate(
      event.start?.dateTime || event.start?.date
    )
    const endTime = parseGoogleAPIDate(event.end?.dateTime || event.end?.date)

    if (!startTime) {
      throw new Error('Event has no start time')
    }

    // Calculate duration
    const durationMinutes = endTime
      ? calculateDurationMinutes(startTime, endTime)
      : undefined

    return {
      title: event.summary || 'Untitled Event',
      occurredAt: startTime,
      durationMinutes,
      data: {
        description: event.description,
        location: event.location,
        status: event.status,
        htmlLink: event.htmlLink,
        organizer: event.organizer,
        attendees: event.attendees,
      },
    }
  }
}

