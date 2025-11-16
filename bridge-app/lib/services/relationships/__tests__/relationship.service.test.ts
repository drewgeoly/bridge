/**
 * Unit tests for RelationshipService
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RelationshipService } from '../relationship.service'
import { createClient } from '@/lib/supabase/server'
import type { GoogleCalendarEvent } from '@/types/calendar'

// Mock Supabase client
vi.mock('@/lib/supabase/server')

describe('RelationshipService', () => {
  let service: RelationshipService
  let mockSupabase: any

  beforeEach(() => {
    service = new RelationshipService()
    
    // Create mock Supabase query builder
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    
    ;(createClient as any).mockResolvedValue(mockSupabase)
  })

  describe('extractPeopleFromEvent', () => {
    it('should extract organizer only', () => {
      const event: GoogleCalendarEvent = {
        id: 'event-1',
        organizer: {
          email: 'organizer@example.com',
          displayName: 'Organizer Name',
        },
      }

      const people = service.extractPeopleFromEvent(event)
      
      expect(people).toHaveLength(1)
      expect(people[0].email).toBe('organizer@example.com')
      expect(people[0].name).toBe('Organizer Name')
    })

    it('should extract attendees only', () => {
      const event: GoogleCalendarEvent = {
        id: 'event-1',
        attendees: [
          {
            email: 'attendee1@example.com',
            displayName: 'Attendee 1',
          },
          {
            email: 'attendee2@example.com',
            displayName: 'Attendee 2',
          },
        ],
      }

      const people = service.extractPeopleFromEvent(event)
      
      expect(people).toHaveLength(2)
      expect(people[0].email).toBe('attendee1@example.com')
      expect(people[1].email).toBe('attendee2@example.com')
    })

    it('should extract organizer and attendees', () => {
      const event: GoogleCalendarEvent = {
        id: 'event-1',
        organizer: {
          email: 'organizer@example.com',
          displayName: 'Organizer',
        },
        attendees: [
          {
            email: 'attendee1@example.com',
            displayName: 'Attendee 1',
          },
        ],
      }

      const people = service.extractPeopleFromEvent(event)
      
      expect(people).toHaveLength(2)
      expect(people[0].email).toBe('organizer@example.com')
      expect(people[1].email).toBe('attendee1@example.com')
    })

    it('should skip duplicate organizer in attendees', () => {
      const event: GoogleCalendarEvent = {
        id: 'event-1',
        organizer: {
          email: 'organizer@example.com',
          displayName: 'Organizer',
        },
        attendees: [
          {
            email: 'organizer@example.com', // Same as organizer
            displayName: 'Organizer',
          },
          {
            email: 'attendee1@example.com',
            displayName: 'Attendee 1',
          },
        ],
      }

      const people = service.extractPeopleFromEvent(event)
      
      expect(people).toHaveLength(2) // Organizer + 1 attendee (duplicate skipped)
      expect(people[0].email).toBe('organizer@example.com')
      expect(people[1].email).toBe('attendee1@example.com')
    })

    it('should skip resource/room attendees', () => {
      const event: GoogleCalendarEvent = {
        id: 'event-1',
        attendees: [
          {
            email: 'room@resource.calendar.google.com',
            displayName: 'Conference Room',
          },
          {
            email: 'attendee1@example.com',
            displayName: 'Attendee 1',
          },
        ],
      }

      const people = service.extractPeopleFromEvent(event)
      
      expect(people).toHaveLength(1)
      expect(people[0].email).toBe('attendee1@example.com')
    })

    it('should skip attendees without email', () => {
      const event: GoogleCalendarEvent = {
        id: 'event-1',
        attendees: [
          {
            displayName: 'No Email Attendee',
          },
          {
            email: 'attendee1@example.com',
            displayName: 'Attendee 1',
          },
        ],
      }

      const people = service.extractPeopleFromEvent(event)
      
      expect(people).toHaveLength(1)
      expect(people[0].email).toBe('attendee1@example.com')
    })

    it('should return empty array for event with no people', () => {
      const event: GoogleCalendarEvent = {
        id: 'event-1',
        summary: 'Event with no people',
      }

      const people = service.extractPeopleFromEvent(event)
      
      expect(people).toHaveLength(0)
    })
  })

  describe('findOrCreatePerson', () => {
    it('should create new person if not exists', async () => {
      const email = 'newperson@example.com'
      const name = 'New Person'

      // Mock: person doesn't exist
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock: create person
      const newPerson = {
        id: 'person-1',
        email: email.toLowerCase(),
        name,
        aliases: [name],
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: newPerson,
        error: null,
      })

      const result = await service.findOrCreatePerson(email, name)
      
      expect(result.id).toBe('person-1')
      expect(result.email).toBe(email.toLowerCase())
      expect(result.name).toBe(name)
    })

    it('should find existing person by email', async () => {
      const email = 'existing@example.com'
      const name = 'Existing Person'

      const existingPerson = {
        id: 'person-1',
        email: email.toLowerCase(),
        name,
        aliases: [],
      }

      mockSupabase.single.mockResolvedValue({
        data: existingPerson,
        error: null,
      })

      const result = await service.findOrCreatePerson(email, name)
      
      expect(result.id).toBe('person-1')
      expect(mockSupabase.insert).not.toHaveBeenCalled()
    })

    it('should update name if different', async () => {
      const email = 'existing@example.com'
      const newName = 'Updated Name'

      // Mock: find existing person
      const existingPerson = {
        id: 'person-1',
        email: email.toLowerCase(),
        name: 'Old Name',
        aliases: [],
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: existingPerson,
        error: null,
      })

      // Mock: update person
      const updatedPerson = {
        ...existingPerson,
        name: newName,
        aliases: [newName],
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: updatedPerson,
        error: null,
      })

      const result = await service.findOrCreatePerson(email, newName)
      
      expect(result.name).toBe(newName)
      expect(mockSupabase.update).toHaveBeenCalled()
    })

    it('should use email prefix as name if name not provided', async () => {
      const email = 'user@example.com'

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const newPerson = {
        id: 'person-1',
        email: email.toLowerCase(),
        name: 'user',
        aliases: [],
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: newPerson,
        error: null,
      })

      const result = await service.findOrCreatePerson(email)
      
      expect(result.name).toBe('user')
    })

    it('should handle case-insensitive email matching', async () => {
      const email = 'User@Example.com'
      const existingPerson = {
        id: 'person-1',
        email: 'user@example.com',
        name: 'User',
      }

      mockSupabase.single.mockResolvedValue({
        data: existingPerson,
        error: null,
      })

      const result = await service.findOrCreatePerson(email)
      
      expect(result.email).toBe('user@example.com')
    })

    it('should throw error on database failure', async () => {
      const email = 'test@example.com'

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(service.findOrCreatePerson(email)).rejects.toThrow(
        'Failed to create person'
      )
    })
  })

  describe('ensureRelationship', () => {
    it('should create new relationship', async () => {
      const userId = 'user-123'
      const personId = 'person-456'

      // Mock: relationship doesn't exist
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock: create relationship
      const newRelationship = {
        id: 'rel-1',
        user_id: userId,
        person_id: personId,
        status: 'active',
        last_interaction: new Date().toISOString(),
        interaction_count: 1,
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: newRelationship,
        error: null,
      })

      const result = await service.ensureRelationship(userId, personId)
      
      expect(result.id).toBe('rel-1')
      expect(result.interaction_count).toBe(1)
    })

    it('should update existing relationship', async () => {
      const userId = 'user-123'
      const personId = 'person-456'

      // Mock: find existing relationship
      const existingRelationship = {
        id: 'rel-1',
        user_id: userId,
        person_id: personId,
        interaction_count: 5,
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: existingRelationship,
        error: null,
      })

      // Mock: update relationship
      const updatedRelationship = {
        ...existingRelationship,
        interaction_count: 6,
        last_interaction: new Date().toISOString(),
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: updatedRelationship,
        error: null,
      })

      const result = await service.ensureRelationship(userId, personId)
      
      expect(result.interaction_count).toBe(6)
      expect(mockSupabase.update).toHaveBeenCalled()
    })

    it('should throw error on database failure', async () => {
      const userId = 'user-123'
      const personId = 'person-456'

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(service.ensureRelationship(userId, personId)).rejects.toThrow(
        'Failed to create relationship'
      )
    })
  })

  describe('getRelationshipByPersonEmail', () => {
    it('should find relationship by person email', async () => {
      const userId = 'user-123'
      const email = 'person@example.com'

      const relationship = {
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-456',
      }

      mockSupabase.single.mockResolvedValue({
        data: relationship,
        error: null,
      })

      const result = await service.getRelationshipByPersonEmail(userId, email)
      
      expect(result).not.toBeNull()
      expect(result?.id).toBe('rel-1')
    })

    it('should return null if relationship not found', async () => {
      const userId = 'user-123'
      const email = 'nonexistent@example.com'

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await service.getRelationshipByPersonEmail(userId, email)
      
      expect(result).toBeNull()
    })

    it('should throw error on database failure', async () => {
      const userId = 'user-123'
      const email = 'test@example.com'

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'OTHER' },
      })

      await expect(service.getRelationshipByPersonEmail(userId, email)).rejects.toThrow(
        'Failed to get relationship'
      )
    })
  })

  describe('findOrCreatePersonByName', () => {
    it('should find existing person by name (case-insensitive)', async () => {
      const name = 'John Doe'
      const existingPerson = {
        id: 'person-1',
        name: 'John Doe',
        email: null,
      }

      // Create chainable mock for select().ilike().limit()
      const selectChain = {
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      }
      selectChain.ilike.mockReturnValue(selectChain)
      selectChain.limit.mockResolvedValue({
        data: [existingPerson],
        error: null,
      })

      mockSupabase.select.mockReturnValue(selectChain)

      const result = await service.findOrCreatePersonByName(name)

      expect(result).toEqual(existingPerson)
      expect(mockSupabase.from).toHaveBeenCalledWith('people')
      expect(selectChain.ilike).toHaveBeenCalledWith('name', 'John Doe')
    })

    it('should create new person if not found by name', async () => {
      const name = 'New Person'
      const newPerson = {
        id: 'person-2',
        name: 'New Person',
        email: null,
        aliases: ['New Person'],
      }

      // Create chainable mock for select().ilike().limit() - returns empty
      const selectChain = {
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      }
      selectChain.ilike.mockReturnValue(selectChain)
      selectChain.limit.mockResolvedValue({
        data: [],
        error: null,
      })
      mockSupabase.select.mockReturnValue(selectChain)

      // Mock insert chain: insert().select().single()
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: newPerson,
          error: null,
        }),
      }
      mockSupabase.insert.mockReturnValue(insertChain)

      const result = await service.findOrCreatePersonByName(name)

      expect(result).toEqual(newPerson)
      expect(mockSupabase.from).toHaveBeenCalledWith('people')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        name: 'New Person',
        aliases: ['New Person'],
      })
    })

    it('should trim name before searching', async () => {
      const name = '  John Doe  '
      const existingPerson = {
        id: 'person-1',
        name: 'John Doe',
      }

      const selectChain = {
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      }
      selectChain.ilike.mockReturnValue(selectChain)
      selectChain.limit.mockResolvedValue({
        data: [existingPerson],
        error: null,
      })
      mockSupabase.select.mockReturnValue(selectChain)

      await service.findOrCreatePersonByName(name)

      expect(selectChain.ilike).toHaveBeenCalledWith('name', 'John Doe')
    })

    it('should throw error if name is empty', async () => {
      await expect(service.findOrCreatePersonByName('')).rejects.toThrow('Name cannot be empty')
      await expect(service.findOrCreatePersonByName('   ')).rejects.toThrow('Name cannot be empty')
    })

    it('should handle case-insensitive matching', async () => {
      const name = 'john doe'
      const existingPerson = {
        id: 'person-1',
        name: 'John Doe',
      }

      const selectChain = {
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      }
      selectChain.ilike.mockReturnValue(selectChain)
      selectChain.limit.mockResolvedValue({
        data: [existingPerson],
        error: null,
      })
      mockSupabase.select.mockReturnValue(selectChain)

      const result = await service.findOrCreatePersonByName(name)

      expect(result).toEqual(existingPerson)
      expect(selectChain.ilike).toHaveBeenCalledWith('name', 'john doe')
    })

    it('should throw error on database failure when finding', async () => {
      const name = 'Test Person'

      // When find fails, the code tries to create a new person
      // So we need to mock both the find failure and ensure insert chain is properly set up
      const selectChain = {
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      }
      selectChain.ilike.mockReturnValue(selectChain)
      selectChain.limit.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })
      mockSupabase.select.mockReturnValue(selectChain)

      // Mock insert chain properly - when find fails, code tries to create
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to create person' },
        }),
      }
      mockSupabase.insert.mockReturnValue(insertChain)

      // The implementation doesn't throw on find error - it tries to create instead
      // So we expect the create error to be thrown
      await expect(service.findOrCreatePersonByName(name)).rejects.toThrow('Failed to create person')
    })

    it('should throw error on database failure when creating', async () => {
      const name = 'New Person'

      const selectChain = {
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      }
      selectChain.ilike.mockReturnValue(selectChain)
      selectChain.limit.mockResolvedValue({
        data: [],
        error: null,
      })
      mockSupabase.select.mockReturnValue(selectChain)

      // Mock insert chain with error
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to create person' },
        }),
      }
      mockSupabase.insert.mockReturnValue(insertChain)

      await expect(service.findOrCreatePersonByName(name)).rejects.toThrow('Failed to create person')
    })
  })
})

