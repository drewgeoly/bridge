/**
 * Tests for ContactRepository
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContactRepository } from '../contact.repository'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('ContactRepository', () => {
  let repository: ContactRepository
  let mockSupabase: any

  beforeEach(() => {
    repository = new ContactRepository()
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)
  })

  describe('createContactImport', () => {
    it('should create a contact import record', async () => {
      const input = {
        userId: 'user-1',
        source: 'vcf_upload',
        fileName: 'contacts.vcf',
      }

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'import-1',
          user_id: 'user-1',
          source: 'vcf_upload',
          file_name: 'contacts.vcf',
          status: 'pending',
        },
        error: null,
      })

      const result = await repository.createContactImport(input)

      expect(result).toBeDefined()
      expect(result.id).toBe('import-1')
      expect(mockSupabase.from).toHaveBeenCalledWith('contact_imports')
    })

    it('should throw error on database failure', async () => {
      const input = {
        userId: 'user-1',
        source: 'vcf_upload',
      }

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(repository.createContactImport(input)).rejects.toThrow(
        'Failed to create contact import'
      )
    })
  })

  describe('updateContactImport', () => {
    it('should update contact import record', async () => {
      const updates = {
        status: 'completed' as const,
        importedCount: 10,
        matchedCount: 5,
        createdCount: 5,
      }

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'import-1',
          status: 'completed',
          imported_count: 10,
        },
        error: null,
      })

      const result = await repository.updateContactImport('import-1', 'user-1', updates)

      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
    })
  })

  describe('getContactImportsByUser', () => {
    it('should get contact imports for user', async () => {
      mockSupabase.limit.mockResolvedValue({
        data: [
          {
            id: 'import-1',
            user_id: 'user-1',
            status: 'completed',
          },
        ],
        error: null,
      })

      const result = await repository.getContactImportsByUser('user-1', 10)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('import-1')
    })
  })

  describe('createContactMapping', () => {
    it('should create a contact mapping', async () => {
      const input = {
        userId: 'user-1',
        contactImportId: 'import-1',
        personId: 'person-1',
        contactEmail: 'john@example.com',
        contactName: 'John Doe',
        matchType: 'email_exact',
        confidenceScore: 1.0,
      }

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'mapping-1',
          ...input,
        },
        error: null,
      })

      const result = await repository.createContactMapping(input)

      expect(result).toBeDefined()
      expect(result.id).toBe('mapping-1')
    })
  })
})

