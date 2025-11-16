/**
 * Service for deduplicating contacts against existing people
 */

import { createClient } from '@/lib/supabase/server'
import type { Person } from '@/types/database'
import type { Contact, DeduplicationMatch } from '@/types/contacts'
import {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  fuzzyMatchEmail,
  matchPhone,
  calculateNameSimilarity,
} from '@/lib/utils/contact.utils'

export class DeduplicationService {
  /**
   * Find matching person for a contact
   * Returns the best match with confidence score
   */
  async findMatchingPerson(
    userId: string,
    contact: Contact
  ): Promise<DeduplicationMatch | null> {
    const supabase = await createClient()
    let bestMatch: DeduplicationMatch | null = null
    let bestConfidence = 0

    // Strategy 1: Email exact match (confidence: 1.0)
    if (contact.emails.length > 0) {
      for (const email of contact.emails) {
        const normalizedEmail = normalizeEmail(email)
        const { data: person, error } = await supabase
          .from('people')
          .select('*')
          .eq('email', normalizedEmail)
          .single()

        if (person && !error) {
          return {
            person: { id: person.id, email: person.email, name: person.name },
            matchType: 'email_exact',
            confidence: 1.0,
            matchedFields: ['email'],
          }
        }
      }
    }

    // Strategy 2: Email fuzzy match (confidence: 0.9)
    if (contact.emails.length > 0) {
      const allPeople = await this.getAllPeople(userId)
      for (const email of contact.emails) {
        for (const person of allPeople) {
          if (person.email && fuzzyMatchEmail(email, person.email)) {
            const normalized1 = normalizeEmail(email)
            const normalized2 = normalizeEmail(person.email)
            if (normalized1 !== normalized2) {
              // Different normalized versions but fuzzy match
              if (0.9 > bestConfidence) {
                bestMatch = {
                  person: { id: person.id, email: person.email, name: person.name },
                  matchType: 'email_fuzzy',
                  confidence: 0.9,
                  matchedFields: ['email'],
                }
                bestConfidence = 0.9
              }
            }
          }
        }
      }
    }

    // Strategy 3: Name exact match (confidence: 0.8)
    if (contact.name) {
      const normalizedContactName = normalizeName(contact.name)
      const { data: people, error } = await supabase
        .from('people')
        .select('*')
        .ilike('name', normalizedContactName)
        .limit(10)

      if (people && people.length > 0 && !error) {
        // Check for exact match
        for (const person of people) {
          if (person.name && normalizeName(person.name) === normalizedContactName) {
            if (0.8 > bestConfidence) {
              bestMatch = {
                person: { id: person.id, email: person.email, name: person.name },
                matchType: 'name_exact',
                confidence: 0.8,
                matchedFields: ['name'],
              }
              bestConfidence = 0.8
            }
          }
        }
      }
    }

    // Strategy 4: Name fuzzy match (confidence: 0.7 if similarity > 0.85)
    if (contact.name) {
      const allPeople = await this.getAllPeople(userId)
      for (const person of allPeople) {
        if (person.name) {
          const similarity = calculateNameSimilarity(contact.name, person.name)
          if (similarity >= 0.85 && similarity * 0.7 > bestConfidence) {
            bestMatch = {
              person: { id: person.id, email: person.email, name: person.name },
              matchType: 'name_fuzzy',
              confidence: similarity * 0.7, // Scale similarity to 0.7 max
              matchedFields: ['name'],
            }
            bestConfidence = similarity * 0.7
          }
        }
      }
    }

    // Strategy 5: Phone match (confidence: 0.6)
    if (contact.phones.length > 0) {
      const allPeople = await this.getAllPeople(userId)
      for (const phone of contact.phones) {
        for (const person of allPeople) {
          const personPhones = (person.phone_numbers as string[]) || []
          for (const personPhone of personPhones) {
            if (matchPhone(phone, personPhone)) {
              if (0.6 > bestConfidence) {
                bestMatch = {
                  person: { id: person.id, email: person.email, name: person.name },
                  matchType: 'phone',
                  confidence: 0.6,
                  matchedFields: ['phone'],
                }
                bestConfidence = 0.6
              }
            }
          }
        }
      }
    }

    // Only return if confidence >= 0.7 (as per plan)
    if (bestMatch && bestConfidence >= 0.7) {
      return bestMatch
    }

    return null
  }

  /**
   * Merge contact data into existing person
   */
  async mergeContactIntoPerson(personId: string, contact: Contact): Promise<Person> {
    const supabase = await createClient()

    // Get current person
    const { data: currentPerson, error: getError } = await supabase
      .from('people')
      .select('*')
      .eq('id', personId)
      .single()

    if (getError || !currentPerson) {
      throw new Error(`Person not found: ${personId}`)
    }

    // Prepare updates
    const updates: any = {}

    // Merge emails
    const currentEmails = currentPerson.email ? [currentPerson.email] : []
    const mergedEmails = currentEmails.concat(contact.emails)
    const uniqueEmails = Array.from(new Set(mergedEmails.map(normalizeEmail)))
    const primaryEmail = uniqueEmails[0]
    const otherEmails = uniqueEmails.slice(1)

    updates.email = primaryEmail || currentPerson.email
    if (otherEmails.length > 0) {
      const currentMerged = (currentPerson.merged_emails as string[]) || []
      updates.merged_emails = Array.from(new Set([...currentMerged, ...otherEmails]))
    }

    // Merge phone numbers
    const currentPhones = (currentPerson.phone_numbers as string[]) || []
    const normalizedContactPhones = contact.phones.map(normalizePhone).filter(Boolean)
    const allPhones = [...currentPhones, ...normalizedContactPhones]
    updates.phone_numbers = Array.from(new Set(allPhones))

    // Update name if contact has better name
    if (contact.name && !currentPerson.name) {
      updates.name = contact.name
    } else if (contact.name && currentPerson.name) {
      // Add to aliases if different
      const currentAliases = (currentPerson.aliases as string[]) || []
      if (!currentAliases.includes(contact.name)) {
        updates.aliases = [...currentAliases, contact.name]
      }
    }

    // Update aliases
    if (contact.name) {
      const currentAliases = (currentPerson.aliases as string[]) || []
      const normalizedContactName = normalizeName(contact.name)
      if (!currentAliases.some((a) => normalizeName(a) === normalizedContactName)) {
        updates.aliases = [...currentAliases, contact.name]
      }
    }

    // Update metadata
    const currentMetadata = currentPerson.metadata || {}
    updates.metadata = {
      ...currentMetadata,
      contactSource: 'vcf_upload',
      lastContactSync: new Date().toISOString(),
    }

    // Update last_contact_sync
    updates.last_contact_sync = new Date().toISOString()

    // Update contact_source if not set
    if (!currentPerson.contact_source) {
      updates.contact_source = 'vcf_upload'
    }

    // Apply updates
    const { data: updatedPerson, error: updateError } = await supabase
      .from('people')
      .update(updates)
      .eq('id', personId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update person: ${updateError.message}`)
    }

    return updatedPerson as Person
  }

  /**
   * Get all people for a user (for matching)
   * This is a helper method to avoid multiple queries
   */
  private async getAllPeople(userId: string): Promise<Person[]> {
    const supabase = await createClient()

    // Get all relationships for user, then get people
    const { data: relationships, error: relError } = await supabase
      .from('relationships')
      .select('person_id')
      .eq('user_id', userId)

    if (relError || !relationships || relationships.length === 0) {
      return []
    }

    const personIds = relationships.map((r) => r.person_id)

    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('*')
      .in('id', personIds)

    if (peopleError) {
      return []
    }

    return (people || []) as Person[]
  }
}

