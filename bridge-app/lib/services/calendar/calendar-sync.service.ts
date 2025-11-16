/**
 * Calendar sync orchestrator - coordinates the full sync process
 */

import { GoogleCalendarService } from './google-calendar.service'
import { RelationshipService } from '../relationships/relationship.service'
import { TouchpointRepository } from '@/lib/repositories/touchpoint.repository'
import { TokenRepository } from '@/lib/repositories/token.repository'
import { getSyncDateRange } from '@/lib/utils/date.utils'
import type { CalendarSyncResult } from '@/types/calendar'

export class CalendarSyncService {
  private googleCalendarService: GoogleCalendarService
  private relationshipService: RelationshipService
  private touchpointRepository: TouchpointRepository
  private tokenRepository: TokenRepository

  constructor() {
    this.googleCalendarService = new GoogleCalendarService()
    this.relationshipService = new RelationshipService()
    this.touchpointRepository = new TouchpointRepository()
    this.tokenRepository = new TokenRepository()
  }

  /**
   * Sync user's calendar (past 90 days by default)
   */
  async syncUserCalendar(
    userId: string,
    daysBack: number = 90
  ): Promise<CalendarSyncResult> {
    const result: CalendarSyncResult = {
      success: false,
      eventsProcessed: 0,
      eventsCreated: 0,
      eventsSkipped: 0,
      relationshipsCreated: 0,
    }

    try {
      // Get valid access token
      const accessToken = await this.googleCalendarService.getValidAccessToken(
        userId
      )

      // Get date range
      const { startDate, endDate } = getSyncDateRange(daysBack)

      // Fetch events from Google Calendar
      const events = await this.googleCalendarService.fetchEvents(
        accessToken,
        startDate,
        endDate
      )

      result.eventsProcessed = events.length

      // Process each event
      for (const event of events) {
        try {
          // Check if event already exists (deduplication)
          const existing = await this.touchpointRepository.findByExternalId(
            event.id,
            'google_calendar',
            userId
          )

          if (existing) {
            result.eventsSkipped++
            continue
          }

          // Transform event to touchpoint data
          const touchpointData =
            this.googleCalendarService.transformEventToTouchpointData(event)

          // Extract people from event
          const people =
            this.relationshipService.extractPeopleFromEvent(event)

          // Create touchpoint
          // If there are attendees, we'll link to the first relationship
          let relationshipId: string | undefined

          if (people.length > 0) {
            // For now, create relationship with the first person
            // In the future, we might want to handle multiple relationships per event
            const person = await this.relationshipService.findOrCreatePerson(
              people[0].email!,
              people[0].name
            )

            const relationship =
              await this.relationshipService.ensureRelationship(
                userId,
                person.id
              )

            relationshipId = relationship.id
            result.relationshipsCreated++
          }

          // Create touchpoint
          await this.touchpointRepository.createTouchpoint({
            userId,
            relationshipId,
            type: 'calendar',
            source: 'google_calendar',
            occurredAt: touchpointData.occurredAt,
            durationMinutes: touchpointData.durationMinutes,
            title: touchpointData.title,
            data: touchpointData.data,
            externalId: event.id,
            rawEventData: event as any,
          })

          result.eventsCreated++
        } catch (error: any) {
          // Log error but continue processing other events
          console.error(`Error processing event ${event.id}:`, error.message)
          result.eventsSkipped++
        }
      }

      // Update last synced timestamp
      await this.tokenRepository.updateLastSynced(userId, 'google_calendar')

      result.success = true
      result.lastSyncedAt = new Date()
    } catch (error: any) {
      result.error = error.message
      result.success = false
    }

    return result
  }
}

