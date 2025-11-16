/**
 * Service for interacting with Google Calendar API
 */

import { google } from 'googleapis'
import { TokenRepository } from '@/lib/repositories/token.repository'
import type { GoogleCalendarEvent } from '@/types/calendar'
import { parseGoogleAPIDate, calculateDurationMinutes } from '@/lib/utils/date.utils'

export class GoogleCalendarService {
  private tokenRepository: TokenRepository
  private oauth2Client: any

  constructor() {
    this.tokenRepository = new TokenRepository()
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI
    )
  }

  /**
   * Get OAuth2 authorization URL
   */
  getAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
      state,
    })
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
  }> {
    const { tokens } = await this.oauth2Client.getToken(code)

    if (!tokens.access_token) {
      throw new Error('No access token received from Google')
    }

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : undefined

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
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

    this.oauth2Client.setCredentials({
      refresh_token: account.refresh_token,
    })

    const { credentials } = await this.oauth2Client.refreshAccessToken()

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
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    })

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

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

