/**
 * Unit tests for TokenRepository
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TokenRepository } from '../token.repository'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server')

describe('TokenRepository', () => {
  let repository: TokenRepository
  let mockSupabase: any

  beforeEach(() => {
    repository = new TokenRepository()
    
    // Create mock Supabase query builder with proper chaining
    // Each method returns 'this' to allow chaining, and the final call resolves
    const createUpdateChain = () => {
      const chain = {
        eq: vi.fn().mockReturnThis(),
      }
      // Make eq() return the chain itself for chaining, but also resolve on await
      chain.eq = vi.fn().mockReturnValue(chain)
      return chain
    }
    
    const createDeleteChain = () => {
      const chain = {
        eq: vi.fn().mockReturnThis(),
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
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    
    ;(createClient as any).mockResolvedValue(mockSupabase)
  })

  describe('getTokens', () => {
    it('should get tokens successfully', async () => {
      const userId = 'user-123'
      const provider = 'google_calendar'
      
      const mockTokens = {
        id: '1',
        user_id: userId,
        provider,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      }

      mockSupabase.single.mockResolvedValue({
        data: mockTokens,
        error: null,
      })

      const result = await repository.getTokens(userId, provider)
      
      expect(result).not.toBeNull()
      expect(result?.access_token).toBe('access-token')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('provider', provider)
    })

    it('should return null if tokens not found', async () => {
      const userId = 'user-123'
      const provider = 'google_calendar'

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows
      })

      const result = await repository.getTokens(userId, provider)
      
      expect(result).toBeNull()
    })

    it('should throw error on database failure', async () => {
      const userId = 'user-123'
      const provider = 'google_calendar'

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'OTHER' },
      })

      await expect(repository.getTokens(userId, provider)).rejects.toThrow(
        'Failed to get tokens'
      )
    })
  })

  describe('saveTokens', () => {
    it('should save new tokens', async () => {
      const userId = 'user-123'
      const provider = 'google_calendar'
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
      }

      mockSupabase.upsert.mockResolvedValue({
        error: null,
      })

      await repository.saveTokens(userId, provider, tokens)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('external_accounts')
      expect(mockSupabase.upsert).toHaveBeenCalled()
    })

    it('should update existing tokens', async () => {
      const userId = 'user-123'
      const provider = 'google_calendar'
      const tokens = {
        accessToken: 'updated-access-token',
        refreshToken: 'updated-refresh-token',
        expiresAt: new Date(Date.now() + 7200000),
      }

      mockSupabase.upsert.mockResolvedValue({
        error: null,
      })

      await repository.saveTokens(userId, provider, tokens)
      
      expect(mockSupabase.upsert).toHaveBeenCalled()
    })

    it('should handle tokens without refresh token', async () => {
      const userId = 'user-123'
      const provider = 'google_calendar'
      const tokens = {
        accessToken: 'access-token',
        expiresAt: new Date(Date.now() + 3600000),
      }

      mockSupabase.upsert.mockResolvedValue({
        error: null,
      })

      await repository.saveTokens(userId, provider, tokens)
      
      expect(mockSupabase.upsert).toHaveBeenCalled()
    })

    it('should handle tokens without expiresAt', async () => {
      const userId = 'user-123'
      const provider = 'google_calendar'
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      mockSupabase.upsert.mockResolvedValue({
        error: null,
      })

      await repository.saveTokens(userId, provider, tokens)
      
      expect(mockSupabase.upsert).toHaveBeenCalled()
    })

    it('should throw error on database failure', async () => {
      const userId = 'user-123'
      const provider = 'google_calendar'
      const tokens = {
        accessToken: 'access-token',
      }

      mockSupabase.upsert.mockResolvedValue({
        error: { message: 'Database error' },
      })

      await expect(repository.saveTokens(userId, provider, tokens)).rejects.toThrow(
        'Failed to save tokens'
      )
    })
  })

  describe('updateLastSynced', () => {
    it('should update last synced timestamp', async () => {
      const userId = 'user-123'
      const provider = 'google_calendar'

      // Create chain that allows multiple eq() calls and resolves on await
      const updateChain = {
        eq: vi.fn(),
      }
      
      // First eq() returns chain, second eq() also returns chain
      // When awaited, the chain itself resolves to the result
      updateChain.eq.mockReturnValue(updateChain)
      
      // Make the chain itself thenable (can be awaited)
      Object.assign(updateChain, {
        then: (resolve: any) => resolve({ error: null }),
      })
      
      mockSupabase.update.mockReturnValue(updateChain)

      await repository.updateLastSynced(userId, provider)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('external_accounts')
      expect(mockSupabase.update).toHaveBeenCalled()
      expect(updateChain.eq).toHaveBeenCalledWith('user_id', userId)
      expect(updateChain.eq).toHaveBeenCalledWith('provider', provider)
    })

    it('should throw error on database failure', async () => {
      const userId = 'user-123'
      const provider = 'google_calendar'

      const updateChain = {
        eq: vi.fn(),
      }
      
      updateChain.eq.mockReturnValue(updateChain)
      
      Object.assign(updateChain, {
        then: (resolve: any) => resolve({ error: { message: 'Database error' } }),
      })
      
      mockSupabase.update.mockReturnValue(updateChain)

      await expect(repository.updateLastSynced(userId, provider)).rejects.toThrow(
        'Failed to update last synced'
      )
    })
  })

  describe('isTokenExpired', () => {
    it('should return true if expiresAt is null', () => {
      expect(repository.isTokenExpired(null)).toBe(true)
    })

    it('should return true if expiresAt is undefined', () => {
      expect(repository.isTokenExpired(undefined)).toBe(true)
    })

    it('should return false if token is not expired', () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      expect(repository.isTokenExpired(futureDate)).toBe(false)
    })

    it('should return true if token is expired', () => {
      const pastDate = new Date(Date.now() - 1000) // 1 second ago
      expect(repository.isTokenExpired(pastDate)).toBe(true)
    })

    it('should return true if token expires within 5 minutes', () => {
      const soonDate = new Date(Date.now() + 4 * 60 * 1000) // 4 minutes from now
      expect(repository.isTokenExpired(soonDate)).toBe(true)
    })

    it('should return false if token expires after 5 minutes', () => {
      const laterDate = new Date(Date.now() + 6 * 60 * 1000) // 6 minutes from now
      expect(repository.isTokenExpired(laterDate)).toBe(false)
    })

    it('should handle string date format', () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000)
      expect(repository.isTokenExpired(futureDate.toISOString())).toBe(false)
      
      const pastDate = new Date(Date.now() - 1000)
      expect(repository.isTokenExpired(pastDate.toISOString())).toBe(true)
    })
  })

  describe('deleteTokens', () => {
    it('should delete tokens successfully', async () => {
      const userId = 'user-123'
      const provider = 'google_calendar'

      const deleteChain = {
        eq: vi.fn(),
      }
      
      deleteChain.eq.mockReturnValue(deleteChain)
      
      Object.assign(deleteChain, {
        then: (resolve: any) => resolve({ error: null }),
      })
      
      mockSupabase.delete.mockReturnValue(deleteChain)

      await repository.deleteTokens(userId, provider)
      
      expect(mockSupabase.from).toHaveBeenCalledWith('external_accounts')
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(deleteChain.eq).toHaveBeenCalledWith('user_id', userId)
      expect(deleteChain.eq).toHaveBeenCalledWith('provider', provider)
    })

    it('should throw error on database failure', async () => {
      const userId = 'user-123'
      const provider = 'google_calendar'

      const deleteChain = {
        eq: vi.fn(),
      }
      
      deleteChain.eq.mockReturnValue(deleteChain)
      
      Object.assign(deleteChain, {
        then: (resolve: any) => resolve({ error: { message: 'Database error' } }),
      })
      
      mockSupabase.delete.mockReturnValue(deleteChain)

      await expect(repository.deleteTokens(userId, provider)).rejects.toThrow(
        'Failed to delete tokens'
      )
    })
  })
})

