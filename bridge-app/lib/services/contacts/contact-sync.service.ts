/**
 * Service for orchestrating contact sync and import
 */

import { ContactParserService } from './contact-parser.service'
import { DeduplicationService } from './deduplication.service'
import { ContactRepository } from '@/lib/repositories/contact.repository'
import { RelationshipService } from '../relationships/relationship.service'
import { TouchpointRepository } from '@/lib/repositories/touchpoint.repository'
import { createClient } from '@/lib/supabase/server'
import type { ContactImportInput, ContactImportResult, Contact } from '@/types/contacts'
import type { Person } from '@/types/database'
import { normalizeEmail } from '@/lib/utils/contact.utils'

export class ContactSyncService {
  private parserService: ContactParserService
  private deduplicationService: DeduplicationService
  private contactRepository: ContactRepository
  private relationshipService: RelationshipService
  private touchpointRepository: TouchpointRepository

  constructor() {
    this.parserService = new ContactParserService()
    this.deduplicationService = new DeduplicationService()
    this.contactRepository = new ContactRepository()
    this.relationshipService = new RelationshipService()
    this.touchpointRepository = new TouchpointRepository()
  }

  /**
   * Sync contacts from import
   */
  async syncContacts(
    userId: string,
    input: ContactImportInput
  ): Promise<ContactImportResult> {
    // Create import record
    const importRecord = await this.contactRepository.createContactImport({
      userId,
      source: input.source,
      fileName: input.fileName,
    })

    try {
      // Update status to processing
      await this.contactRepository.updateContactImport(importRecord.id, userId, {
        status: 'processing',
      })

      // Parse contacts
      let contacts: Contact[]
      if (input.file) {
        contacts = await this.parserService.parseVCardFile(input.file)
      } else if (input.contacts) {
        contacts = input.contacts
      } else {
        throw new Error('No contacts provided')
      }

      // Normalize contacts
      contacts = contacts.map((c) => this.parserService.normalizeContact(c))

      let importedCount = 0
      let matchedCount = 0
      let createdCount = 0
      const mappings: any[] = []

      // Process each contact
      for (const contact of contacts) {
        try {
          importedCount++

          // Find matching person
          const match = await this.deduplicationService.findMatchingPerson(userId, contact)

          let person: Person

          if (match && match.confidence >= 0.7) {
            // Match found - merge contact data
            person = await this.deduplicationService.mergeContactIntoPerson(
              match.person.id,
              contact
            )
            matchedCount++

            // Create mapping
            const mapping = await this.contactRepository.createContactMapping({
              userId,
              contactImportId: importRecord.id,
              personId: person.id,
              contactEmail: contact.emails[0],
              contactName: contact.name,
              matchType: match.matchType,
              confidenceScore: match.confidence,
            })
            mappings.push(mapping)
          } else {
            // No match - create new person
            person = await this.createPersonFromContact(contact)
            createdCount++

            // Create mapping
            const mapping = await this.contactRepository.createContactMapping({
              userId,
              contactImportId: importRecord.id,
              personId: person.id,
              contactEmail: contact.emails[0],
              contactName: contact.name,
              matchType: 'none',
              confidenceScore: 0,
            })
            mappings.push(mapping)
          }

          // Ensure relationship exists
          await this.relationshipService.ensureRelationship(userId, person.id)
        } catch (error: any) {
          console.error(`Error processing contact ${contact.name || contact.emails[0]}:`, error)
          // Continue with next contact
        }
      }

      // Map contacts to calendar attendees (automatically during import)
      await this.mapContactsToCalendarAttendees(userId)

      // Update import record
      await this.contactRepository.updateContactImport(importRecord.id, userId, {
        status: 'completed',
        importedCount,
        matchedCount,
        createdCount,
        completedAt: new Date(),
      })

      return {
        importId: importRecord.id,
        status: 'completed',
        importedCount,
        matchedCount,
        createdCount,
        mappings,
      }
    } catch (error: any) {
      // Update import record with error
      await this.contactRepository.updateContactImport(importRecord.id, userId, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date(),
      })

      throw error
    }
  }

  /**
   * Create a new person from contact
   */
  private async createPersonFromContact(contact: Contact): Promise<Person> {
    const supabase = await createClient()

    const primaryEmail = contact.emails[0]
    const otherEmails = contact.emails.slice(1)

    const { data: newPerson, error } = await supabase
      .from('people')
      .insert({
        email: primaryEmail ? normalizeEmail(primaryEmail) : undefined,
        name: contact.name,
        aliases: contact.name ? [contact.name] : [],
        merged_emails: otherEmails.length > 0 ? otherEmails.map(normalizeEmail) : undefined,
        phone_numbers: contact.phones.length > 0 ? contact.phones : undefined,
        contact_source: 'vcf_upload',
        last_contact_sync: new Date().toISOString(),
        metadata: {
          organization: contact.organization,
          notes: contact.notes,
          rawContactData: contact.rawData,
        },
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create person: ${error.message}`)
    }

    return newPerson as Person
  }

  /**
   * Map contacts to calendar attendees
   */
  async mapContactsToCalendarAttendees(userId: string): Promise<void> {
    // Get all calendar touchpoints
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90) // Last 90 days

    const touchpoints = await this.touchpointRepository.findByDateRange(
      userId,
      startDate,
      endDate
    )

    // Filter to calendar touchpoints
    const calendarTouchpoints = touchpoints.filter((tp) => tp.type === 'calendar')

    // Get all people with contact data
    const supabase = await createClient()
    const { data: people, error } = await supabase
      .from('people')
      .select('*')
      .not('contact_source', 'is', null)

    if (error || !people) {
      return
    }

    // Create a map of email -> person for quick lookup
    const emailToPerson = new Map<string, Person>()
    for (const person of people) {
      if (person.email) {
        emailToPerson.set(normalizeEmail(person.email), person)
      }
      // Also map merged emails
      const mergedEmails = (person.merged_emails as string[]) || []
      for (const email of mergedEmails) {
        emailToPerson.set(normalizeEmail(email), person)
      }
    }

    // Update touchpoints with contact info
    for (const touchpoint of calendarTouchpoints) {
      const rawEventData = touchpoint.raw_event_data as any
      if (!rawEventData || !rawEventData.attendees) continue

      const updatedAttendees = rawEventData.attendees.map((attendee: any) => {
        if (!attendee.email) return attendee

        const normalizedEmail = normalizeEmail(attendee.email)
        const person = emailToPerson.get(normalizedEmail)

        if (person) {
          return {
            ...attendee,
            personId: person.id,
            contactName: person.name,
            hasContact: true,
          }
        }

        return attendee
      })

      // Update touchpoint metadata if we found matches
      if (updatedAttendees.some((a: any) => a.hasContact)) {
        const updatedData = {
          ...rawEventData,
          attendees: updatedAttendees,
        }

        await this.touchpointRepository.updateTouchpoint(touchpoint.id, {
          rawEventData: updatedData,
        })
      }
    }
  }
}

