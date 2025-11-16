/**
 * Service for managing relationships and people extraction
 */

import { createClient } from '@/lib/supabase/server'
import type { GoogleCalendarEvent } from '@/types/calendar'
import type { Person, Relationship } from '@/types/database'

export interface ExtractedPerson {
  email?: string
  name?: string
}

export class RelationshipService {
  /**
   * Extract people from a calendar event
   */
  extractPeopleFromEvent(event: GoogleCalendarEvent): ExtractedPerson[] {
    const people: ExtractedPerson[] = []

    // Add organizer if present
    if (event.organizer?.email) {
      people.push({
        email: event.organizer.email,
        name: event.organizer.displayName,
      })
    }

    // Add attendees
    if (event.attendees) {
      for (const attendee of event.attendees) {
        // Skip if no email or if it's the organizer (already added)
        if (!attendee.email || attendee.email === event.organizer?.email) {
          continue
        }

        // Skip if it's a resource or room
        if (attendee.email.includes('resource.calendar.google.com')) {
          continue
        }

        people.push({
          email: attendee.email,
          name: attendee.displayName,
        })
      }
    }

    return people
  }

  /**
   * Find or create a person (simple deduplication by email)
   */
  async findOrCreatePerson(
    email: string,
    name?: string,
    userId?: string
  ): Promise<Person> {
    const supabase = await createClient()

    // First, try to find existing person by email
    const { data: existingPerson, error: findError } = await supabase
      .from('people')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (existingPerson && !findError) {
      // Update name if provided and different
      if (name && existingPerson.name !== name) {
        const { data: updated, error: updateError } = await supabase
          .from('people')
          .update({
            name,
            aliases: existingPerson.aliases 
              ? [...existingPerson.aliases, name].filter((n, i, arr) => arr.indexOf(n) === i)
              : [name],
          })
          .eq('id', existingPerson.id)
          .select()
          .single()

        if (updateError) {
          throw new Error(`Failed to update person: ${updateError.message}`)
        }

        return updated as Person
      }

      return existingPerson as Person
    }

    // Create new person
    const { data: newPerson, error: createError } = await supabase
      .from('people')
      .insert({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        aliases: name ? [name] : [],
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create person: ${createError.message}`)
    }

    return newPerson as Person
  }

  /**
   * Find or create a person by name only (for manual connection logging)
   */
  async findOrCreatePersonByName(name: string): Promise<Person> {
    const supabase = await createClient()
    const normalizedName = name.trim()

    if (!normalizedName) {
      throw new Error('Name cannot be empty')
    }

    // Try to find existing person by name (case-insensitive)
    const { data: existingPeople, error: findError } = await supabase
      .from('people')
      .select('*')
      .ilike('name', normalizedName)
      .limit(1)

    if (existingPeople && existingPeople.length > 0 && !findError) {
      // Found existing person by name
      return existingPeople[0] as Person
    }

    // Create new person with just name (no email)
    const { data: newPerson, error: createError } = await supabase
      .from('people')
      .insert({
        name: normalizedName,
        aliases: [normalizedName],
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create person: ${createError.message}`)
    }

    return newPerson as Person
  }

  /**
   * Ensure a relationship exists between user and person
   */
  async ensureRelationship(
    userId: string,
    personId: string
  ): Promise<Relationship> {
    const supabase = await createClient()

    // Try to find existing relationship
    const { data: existing, error: findError } = await supabase
      .from('relationships')
      .select('*')
      .eq('user_id', userId)
      .eq('person_id', personId)
      .single()

    if (existing && !findError) {
      // Update last interaction and increment count
      const { data: updated, error: updateError } = await supabase
        .from('relationships')
        .update({
          last_interaction: new Date().toISOString(),
          interaction_count: (existing.interaction_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update relationship: ${updateError.message}`)
      }

      return updated as Relationship
    }

    // Create new relationship
    const { data: newRelationship, error: createError } = await supabase
      .from('relationships')
      .insert({
        user_id: userId,
        person_id: personId,
        status: 'active',
        last_interaction: new Date().toISOString(),
        interaction_count: 1,
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create relationship: ${createError.message}`)
    }

    return newRelationship as Relationship
  }

  /**
   * Get relationship by person email
   */
  async getRelationshipByPersonEmail(
    userId: string,
    email: string
  ): Promise<Relationship | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('relationships')
      .select(`
        *,
        people!inner(email)
      `)
      .eq('user_id', userId)
      .eq('people.email', email.toLowerCase())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get relationship: ${error.message}`)
    }

    return data as Relationship
  }

  /**
   * Find person by email or name (enhanced search for contacts)
   */
  async findPersonByEmailOrName(
    email?: string,
    name?: string
  ): Promise<Person | null> {
    const supabase = await createClient()

    // Try email first
    if (email) {
      const { data: personByEmail, error: emailError } = await supabase
        .from('people')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (personByEmail && !emailError) {
        return personByEmail as Person
      }
    }

    // Try name
    if (name) {
      const normalizedName = name.trim()
      const { data: peopleByName, error: nameError } = await supabase
        .from('people')
        .select('*')
        .ilike('name', normalizedName)
        .limit(1)

      if (peopleByName && peopleByName.length > 0 && !nameError) {
        return peopleByName[0] as Person
      }
    }

    return null
  }

  /**
   * Update person with contact data
   */
  async updatePersonWithContact(personId: string, contact: any): Promise<Person> {
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

    const updates: any = {}

    // Update phone numbers if provided
    if (contact.phones && contact.phones.length > 0) {
      const currentPhones = (currentPerson.phone_numbers as string[]) || []
      updates.phone_numbers = Array.from(new Set([...currentPhones, ...contact.phones]))
    }

    // Update contact source
    if (!currentPerson.contact_source) {
      updates.contact_source = 'vcf_upload'
    }

    // Update last contact sync
    updates.last_contact_sync = new Date().toISOString()

    // Update metadata
    const currentMetadata = currentPerson.metadata || {}
    updates.metadata = {
      ...currentMetadata,
      lastContactSync: new Date().toISOString(),
    }

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
}

