/**
 * Tests for ContactParserService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContactParserService } from '../contact-parser.service'

// Mock vcard-parser
vi.mock('vcard-parser', () => ({
  default: {
    parse: vi.fn(),
  },
}))

describe('ContactParserService', () => {
  let service: ContactParserService
  let mockVCard: any

  beforeEach(() => {
    service = new ContactParserService()
    mockVCard = {
      parse: vi.fn(),
    }
    vi.resetAllMocks()
  })

  describe('parseVCardContent', () => {
    it('should parse valid vCard content', async () => {
      const vcard = await import('vcard-parser')
      const mockCards = [
        {
          fn: [{ value: 'John Doe' }],
          n: [{ value: ['John', 'Doe', '', '', ''] }],
          email: [{ value: 'john@example.com' }],
          tel: [{ value: '5551234567' }],
        },
      ]
      ;(vcard.default.parse as any).mockReturnValue(mockCards)

      const result = service.parseVCardContent('BEGIN:VCARD\n...\nEND:VCARD')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('John Doe')
      expect(result[0].emails).toContain('john@example.com')
      expect(result[0].phones).toContain('5551234567')
    })

    it('should handle contacts without email', async () => {
      const vcard = await import('vcard-parser')
      const mockCards = [
        {
          fn: [{ value: 'John Doe' }],
          tel: [{ value: '5551234567' }],
        },
      ]
      ;(vcard.default.parse as any).mockReturnValue(mockCards)

      const result = service.parseVCardContent('BEGIN:VCARD\n...\nEND:VCARD')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('John Doe')
      expect(result[0].emails).toHaveLength(0)
    })

    it('should skip contacts with no identifying information', async () => {
      const vcard = await import('vcard-parser')
      const mockCards = [
        {
          // No name, email, or phone
        },
      ]
      ;(vcard.default.parse as any).mockReturnValue(mockCards)

      const result = service.parseVCardContent('BEGIN:VCARD\n...\nEND:VCARD')

      expect(result).toHaveLength(0)
    })

    it('should handle multiple emails and phones', async () => {
      const vcard = await import('vcard-parser')
      const mockCards = [
        {
          fn: [{ value: 'John Doe' }],
          email: [
            { value: 'john@example.com' },
            { value: 'john.doe@work.com' },
          ],
          tel: [{ value: '5551234567' }, { value: '5559876543' }],
        },
      ]
      ;(vcard.default.parse as any).mockReturnValue(mockCards)

      const result = service.parseVCardContent('BEGIN:VCARD\n...\nEND:VCARD')

      expect(result[0].emails).toHaveLength(2)
      expect(result[0].phones).toHaveLength(2)
    })

    it('should throw error on invalid vCard', async () => {
      const vcard = await import('vcard-parser')
      ;(vcard.default.parse as any).mockImplementation(() => {
        throw new Error('Invalid vCard')
      })

      expect(() => {
        service.parseVCardContent('invalid')
      }).toThrow('Failed to parse vCard')
    })
  })

  describe('normalizeContact', () => {
    it('should normalize contact data', () => {
      const contact = {
        name: '  John Doe  ',
        emails: ['John@Example.com'],
        phones: ['(555) 123-4567'],
      }

      const normalized = service.normalizeContact(contact as any)

      expect(normalized.name).toBe('john doe')
      expect(normalized.emails[0]).toBe('john@example.com')
      expect(normalized.phones[0]).toBe('5551234567')
    })
  })
})

