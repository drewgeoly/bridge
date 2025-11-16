/**
 * Unit tests for TouchpointRepository
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TouchpointRepository } from '../touchpoint.repository'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server')

describe('TouchpointRepository', () => {
  let repository: TouchpointRepository
  let mockSupabase: any

  beforeEach(() => {
    repository = new TouchpointRepository()
    
    // Create mock Supabase query builder with proper chaining
    const createUpdateChain = () => {
      const chain = {
        eq: vi.fn(),
        select: vi.fn(),
        single: vi.fn(),
      }
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.select = vi.fn().mockReturnValue(chain)
      return chain
    }
    
    const createDeleteChain = () => {
      const chain = {
        eq: vi.fn(),
      }
      chain.eq = vi.fn().mockReturnValue(chain)
      return chain
    }
    
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnValue(createUpdateChain()),
      delete: vi.fn().mockReturnValue(createDeleteChain()),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    
    ;(createClient as any).mockResolvedValue(mockSupabase)
  })

  describe('createTouchpoint', () => {
    it('should create a touchpoint successfully', async () => {
      const input = {
        userId: 'user-123',
        type: 'calendar' as const,
        source: 'google_calendar',
        occurredAt: new Date('2024-01-15T10:00:00Z'),
        title: 'Test Event',
        externalId: 'event-123',
      }

      const mockTouchpoint = {
        id: 'touchpoint-1',
        user_id: input.userId,
        type: input.type,
        source: input.source,
        occurred_at: input.occurredAt.toISOString(),
        title: input.title,
        external_id: input.externalId,
        created_at: new Date().toISOString(),
      }

      mockSupabase.single.mockResolvedValue({
        data: mockTouchpoint,
        error: null,
      })

      const result = await repository.createTouchpoint(input)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('touchpoints')
      expect(mockSupabase.insert).toHaveBeenCalled()
      expect(result.id).toBe('touchpoint-1')
      expect(result.title).toBe('Test Event')
    })

    it('should throw error on database failure', async () => {
      const input = {
        userId: 'user-123',
        type: 'calendar' as const,
        source: 'google_calendar',
        occurredAt: new Date(),
      }

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(repository.createTouchpoint(input)).rejects.toThrow(
        'Failed to create touchpoint'
      )
    })
  })

  describe('findByExternalId', () => {
    it('should find touchpoint by external ID', async () => {
      const externalId = 'event-123'
      const source = 'google_calendar'
      const userId = 'user-123'

      const mockTouchpoint = {
        id: 'touchpoint-1',
        external_id: externalId,
        source,
        user_id: userId,
      }

      mockSupabase.single.mockResolvedValue({
        data: mockTouchpoint,
        error: null,
      })

      const result = await repository.findByExternalId(externalId, source, userId)
      
      expect(result).not.toBeNull()
      expect(result?.external_id).toBe(externalId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('external_id', externalId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('source', source)
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
    })

    it('should return null if not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows
      })

      const result = await repository.findByExternalId(
        'nonexistent',
        'google_calendar',
        'user-123'
      )
      
      expect(result).toBeNull()
    })
  })

  describe('findByDateRange', () => {
    it('should find touchpoints within date range', async () => {
      const userId = 'user-123'
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-31')

      const mockTouchpoints = [
        { id: 'touchpoint-1', occurred_at: '2024-01-15T10:00:00Z' },
        { id: 'touchpoint-2', occurred_at: '2024-01-20T14:00:00Z' },
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockTouchpoints,
        error: null,
      })

      const result = await repository.findByDateRange(userId, start, end)
      
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(2)
      expect(mockSupabase.gte).toHaveBeenCalledWith('occurred_at', start.toISOString())
      expect(mockSupabase.lte).toHaveBeenCalledWith('occurred_at', end.toISOString())
      expect(mockSupabase.order).toHaveBeenCalledWith('occurred_at', { ascending: false })
    })

    it('should return empty array if no touchpoints found', async () => {
      const userId = 'user-123'
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-31')

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await repository.findByDateRange(userId, start, end)
      
      expect(result).toEqual([])
    })
  })

  describe('findByRelationshipId', () => {
    it('should find touchpoints by relationship ID', async () => {
      const relationshipId = 'rel-123'
      const userId = 'user-123'

      const mockTouchpoints = [
        { id: 'touchpoint-1', relationship_id: relationshipId },
        { id: 'touchpoint-2', relationship_id: relationshipId },
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockTouchpoints,
        error: null,
      })

      const result = await repository.findByRelationshipId(relationshipId, userId)
      
      expect(result).toHaveLength(2)
      expect(mockSupabase.eq).toHaveBeenCalledWith('relationship_id', relationshipId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
    })

    it('should return empty array if no touchpoints found', async () => {
      const relationshipId = 'rel-123'
      const userId = 'user-123'

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await repository.findByRelationshipId(relationshipId, userId)
      
      expect(result).toEqual([])
    })
  })

  describe('updateTouchpoint', () => {
    it('should update touchpoint successfully', async () => {
      const id = 'touchpoint-1'
      const updates = {
        title: 'Updated Title',
        durationMinutes: 120,
      }

      const updatedTouchpoint = {
        id,
        title: 'Updated Title',
        duration_minutes: 120,
      }

      const updateChain = mockSupabase.update()
      updateChain.select.mockReturnValue(updateChain)
      updateChain.single.mockResolvedValue({
        data: updatedTouchpoint,
        error: null,
      })

      const result = await repository.updateTouchpoint(id, updates)
      
      expect(result.title).toBe('Updated Title')
      expect(mockSupabase.update).toHaveBeenCalled()
      expect(updateChain.eq).toHaveBeenCalledWith('id', id)
      expect(updateChain.select).toHaveBeenCalled()
    })

    it('should throw error on database failure', async () => {
      const id = 'touchpoint-1'
      const updates = { title: 'Updated' }

      const updateChain = mockSupabase.update()
      updateChain.select.mockReturnValue(updateChain)
      updateChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(repository.updateTouchpoint(id, updates)).rejects.toThrow(
        'Failed to update touchpoint'
      )
    })
  })

  describe('deleteTouchpoint', () => {
    it('should delete touchpoint successfully', async () => {
      const id = 'touchpoint-1'
      const userId = 'user-123'

      const deleteChain = mockSupabase.delete()
      deleteChain.eq.mockReturnValue(deleteChain)
      
      Object.assign(deleteChain, {
        then: (resolve: any) => resolve({ error: null }),
      })

      await repository.deleteTouchpoint(id, userId)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('touchpoints')
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(deleteChain.eq).toHaveBeenCalledWith('id', id)
      expect(deleteChain.eq).toHaveBeenCalledWith('user_id', userId)
    })

    it('should throw error on database failure', async () => {
      const id = 'touchpoint-1'
      const userId = 'user-123'

      const deleteChain = mockSupabase.delete()
      deleteChain.eq.mockReturnValue(deleteChain)
      
      Object.assign(deleteChain, {
        then: (resolve: any) => resolve({ error: { message: 'Database error' } }),
      })

      await expect(repository.deleteTouchpoint(id, userId)).rejects.toThrow(
        'Failed to delete touchpoint'
      )
    })
  })
})

