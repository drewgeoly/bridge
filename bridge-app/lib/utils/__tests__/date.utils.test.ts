/**
 * Unit tests for date utilities
 * 
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest'
import {
  getSyncDateRange,
  formatDateForGoogleAPI,
  parseGoogleAPIDate,
  calculateDurationMinutes,
  isDateInRange,
} from '../date.utils'

describe('date.utils', () => {
  describe('getSyncDateRange', () => {
    it('should return date range for default 90 days', () => {
      const { startDate, endDate } = getSyncDateRange()
      
      expect(startDate).toBeInstanceOf(Date)
      expect(endDate).toBeInstanceOf(Date)
      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime())
      
      // Check that range is approximately 90 days
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      expect(daysDiff).toBeCloseTo(90, 0)
    })

    it('should return date range for custom days', () => {
      const { startDate, endDate } = getSyncDateRange(30)
      
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      expect(daysDiff).toBeCloseTo(30, 0)
    })
  })

  describe('formatDateForGoogleAPI', () => {
    it('should format date as ISO string', () => {
      const date = new Date('2024-01-15T10:00:00Z')
      const formatted = formatDateForGoogleAPI(date)
      
      expect(formatted).toBe('2024-01-15T10:00:00.000Z')
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('parseGoogleAPIDate', () => {
    it('should parse valid date string', () => {
      const dateString = '2024-01-15T10:00:00Z'
      const parsed = parseGoogleAPIDate(dateString)
      
      expect(parsed).toBeInstanceOf(Date)
      expect(parsed?.getTime()).toBe(new Date(dateString).getTime())
    })

    it('should return null for undefined input', () => {
      const parsed = parseGoogleAPIDate(undefined)
      expect(parsed).toBeNull()
    })

    it('should return null for empty string', () => {
      const parsed = parseGoogleAPIDate('')
      expect(parsed).toBeNull()
    })
  })

  describe('calculateDurationMinutes', () => {
    it('should calculate duration correctly', () => {
      const start = new Date('2024-01-15T10:00:00Z')
      const end = new Date('2024-01-15T11:30:00Z')
      
      const duration = calculateDurationMinutes(start, end)
      
      expect(duration).toBe(90)
    })

    it('should handle same start and end time', () => {
      const date = new Date('2024-01-15T10:00:00Z')
      const duration = calculateDurationMinutes(date, date)
      
      expect(duration).toBe(0)
    })
  })

  describe('isDateInRange', () => {
    it('should return true for date within range', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const start = new Date('2024-01-01T00:00:00Z')
      const end = new Date('2024-01-31T23:59:59Z')
      
      expect(isDateInRange(date, start, end)).toBe(true)
    })

    it('should return false for date before range', () => {
      const date = new Date('2023-12-31T12:00:00Z')
      const start = new Date('2024-01-01T00:00:00Z')
      const end = new Date('2024-01-31T23:59:59Z')
      
      expect(isDateInRange(date, start, end)).toBe(false)
    })

    it('should return false for date after range', () => {
      const date = new Date('2024-02-01T12:00:00Z')
      const start = new Date('2024-01-01T00:00:00Z')
      const end = new Date('2024-01-31T23:59:59Z')
      
      expect(isDateInRange(date, start, end)).toBe(false)
    })

    it('should return true for date at range boundaries', () => {
      const start = new Date('2024-01-01T00:00:00Z')
      const end = new Date('2024-01-31T23:59:59Z')
      
      expect(isDateInRange(start, start, end)).toBe(true)
      expect(isDateInRange(end, start, end)).toBe(true)
    })
  })
})

