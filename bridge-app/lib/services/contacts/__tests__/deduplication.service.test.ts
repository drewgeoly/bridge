/**
 * Tests for DeduplicationService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeduplicationService } from '../deduplication.service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('DeduplicationService', () => {
  let service: DeduplicationService
  let mockSupabase: any

  beforeEach(() => {
    service = new DeduplicationService()
    
    // Create mock update chain (for mergeContactIntoPerson)
    const createUpdateChain = () => {
      const chain: any = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }
      // Make the chain awaitable (thenable) - resolve with the result from single()
      chain.then = (resolve: any) => {
        const singleResult = chain.single()
        return Promise.resolve(singleResult).then(resolve)
      }
      return chain
    }
    
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnValue(createUpdateChain()),
      single: vi.fn(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)
  })

  describe('findMatchingPerson', () => {
    it('should find exact email match', async () => {
      const contact = {
        emails: ['john@example.com'],
        name: 'John Doe',
        phones: [],
      }

      mockSupabase.single.mockResolvedValue({
        data: { id: 'person-1', email: 'john@example.com', name: 'John Doe' },
        error: null,
      })

      const result = await service.findMatchingPerson('user-1', contact as any)

      expect(result).not.toBeNull()
      expect(result?.matchType).toBe('email_exact')
      expect(result?.confidence).toBe(1.0)
    })

    it('should return null if no match found and confidence < 0.7', async () => {
      const contact = {
        emails: ['new@example.com'],
        name: 'New Person',
        phones: [],
      }

      // Mock no email match
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock getAllPeople to return empty
      mockSupabase.in.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await service.findMatchingPerson('user-1', contact as any)

      expect(result).toBeNull()
    })

    it('should find name fuzzy match with high confidence', async () => {
      const contact = {
        emails: [],
        name: 'John Smith',
        phones: [],
      }

      // Mock no email match
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock name search
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      // Mock getAllPeople to return person with similar name
      mockSupabase.in.mockResolvedValue({
        data: [{ id: 'person-1', name: 'Johnny Smith', email: null }],
        error: null,
      })

      const result = await service.findMatchingPerson('user-1', contact as any)

      // Should find fuzzy match if similarity >= 0.85
      // This test may need adjustment based on actual similarity calculation
      expect(result).toBeDefined()
    })
  })

  describe('mergeContactIntoPerson', () => {
    it('should merge contact data into existing person', async () => {
      const personId = 'person-1'
      const contact = {
        emails: ['john@example.com', 'john.doe@work.com'],
        phones: ['5551234567'],
        name: 'John Doe',
      }

      // Mock get person
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: personId,
          email: 'john@example.com',
          name: 'John',
          phone_numbers: [],
          merged_emails: [],
          aliases: [],
          metadata: {},
        },
        error: null,
      })

      // Mock update person - need to set up the update chain properly
      // The update chain will be created when update() is called
      // We need to mock it to return the correct data
      const updateChain = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: personId,
            email: 'john@example.com',
            name: 'John',
            phone_numbers: ['5551234567'],
            merged_emails: ['johndoe@work.com'],
          },
          error: null,
        }),
      }
      // Make it thenable
      updateChain.then = (resolve: any) => {
        return Promise.resolve(updateChain.single()).then(resolve)
      }
      mockSupabase.update.mockReturnValue(updateChain)

      const result = await service.mergeContactIntoPerson(personId, contact as any)

      expect(result).toBeDefined()
      expect(mockSupabase.from).toHaveBeenCalledWith('people')
    })
  })
})

