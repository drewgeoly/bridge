/**
 * Tests for contact utility functions
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  calculateNameSimilarity,
  fuzzyMatchEmail,
  matchPhone,
} from '../contact.utils'

describe('ContactUtils', () => {
  describe('normalizeEmail', () => {
    it('should lowercase email', () => {
      expect(normalizeEmail('John@Example.com')).toBe('john@example.com')
    })

    it('should remove dots from Gmail addresses', () => {
      expect(normalizeEmail('john.doe@gmail.com')).toBe('johndoe@gmail.com')
    })

    it('should handle Gmail aliases (remove +aliases)', () => {
      expect(normalizeEmail('john+test@gmail.com')).toBe('john@gmail.com')
    })

    it('should handle Gmail with both dots and aliases', () => {
      expect(normalizeEmail('john.doe+test@gmail.com')).toBe('johndoe@gmail.com')
    })

    it('should not modify non-Gmail addresses', () => {
      expect(normalizeEmail('john@example.com')).toBe('john@example.com')
    })

    it('should handle empty string', () => {
      expect(normalizeEmail('')).toBe('')
    })
  })

  describe('normalizeName', () => {
    it('should trim whitespace', () => {
      expect(normalizeName('  John Doe  ')).toBe('john doe')
    })

    it('should normalize multiple spaces', () => {
      expect(normalizeName('John    Doe')).toBe('john doe')
    })

    it('should lowercase', () => {
      expect(normalizeName('John Doe')).toBe('john doe')
    })

    it('should handle empty string', () => {
      expect(normalizeName('')).toBe('')
    })
  })

  describe('normalizePhone', () => {
    it('should remove non-digit characters', () => {
      expect(normalizePhone('(555) 123-4567')).toBe('5551234567')
    })

    it('should remove leading 1 for US numbers', () => {
      expect(normalizePhone('15551234567')).toBe('5551234567')
    })

    it('should handle formatted numbers', () => {
      expect(normalizePhone('+1-555-123-4567')).toBe('5551234567')
    })

    it('should handle empty string', () => {
      expect(normalizePhone('')).toBe('')
    })
  })

  describe('calculateNameSimilarity', () => {
    it('should return 1.0 for identical names', () => {
      expect(calculateNameSimilarity('John Doe', 'John Doe')).toBe(1.0)
    })

    it('should handle initials', () => {
      const similarity = calculateNameSimilarity('J. Smith', 'John Smith')
      expect(similarity).toBeGreaterThan(0.6) // Initial matching may not be perfect
    })

    it('should handle case differences', () => {
      const similarity = calculateNameSimilarity('John Doe', 'john doe')
      expect(similarity).toBeGreaterThan(0.8)
    })

    it('should return lower similarity for different names', () => {
      const similarity = calculateNameSimilarity('John Doe', 'Jane Smith')
      expect(similarity).toBeLessThan(0.5)
    })

    it('should handle similar names', () => {
      const similarity = calculateNameSimilarity('John Smith', 'Johnny Smith')
      expect(similarity).toBeGreaterThan(0.7)
    })
  })

  describe('fuzzyMatchEmail', () => {
    it('should match identical emails', () => {
      expect(fuzzyMatchEmail('john@example.com', 'john@example.com')).toBe(true)
    })

    it('should match Gmail addresses with dots', () => {
      expect(fuzzyMatchEmail('john.doe@gmail.com', 'johndoe@gmail.com')).toBe(true)
    })

    it('should not match different emails', () => {
      expect(fuzzyMatchEmail('john@example.com', 'jane@example.com')).toBe(false)
    })
  })

  describe('matchPhone', () => {
    it('should match identical phone numbers', () => {
      expect(matchPhone('5551234567', '5551234567')).toBe(true)
    })

    it('should match formatted vs unformatted', () => {
      expect(matchPhone('(555) 123-4567', '5551234567')).toBe(true)
    })

    it('should match last 10 digits for US numbers', () => {
      expect(matchPhone('15551234567', '5551234567')).toBe(true)
    })

    it('should not match different numbers', () => {
      expect(matchPhone('5551234567', '5559876543')).toBe(false)
    })
  })
})

