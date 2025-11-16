/**
 * Repository for managing OAuth tokens in external_accounts table
 */

import { createClient } from '@/lib/supabase/server'
import type { ExternalAccount, TokenData } from '@/types/database'

export class TokenRepository {
  /**
   * Get tokens for a user and provider
   */
  async getTokens(userId: string, provider: string): Promise<ExternalAccount | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('external_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw new Error(`Failed to get tokens: ${error.message}`)
    }

    return data as ExternalAccount
  }

  /**
   * Save or update tokens for a user and provider
   */
  async saveTokens(
    userId: string,
    provider: string,
    tokens: TokenData
  ): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('external_accounts')
      .upsert({
        user_id: userId,
        provider,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt?.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      })

    if (error) {
      throw new Error(`Failed to save tokens: ${error.message}`)
    }
  }

  /**
   * Update last synced timestamp
   */
  async updateLastSynced(userId: string, provider: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('external_accounts')
      .update({
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', provider)

    if (error) {
      throw new Error(`Failed to update last synced: ${error.message}`)
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(expiresAt?: Date | string | null): boolean {
    if (!expiresAt) return true
    
    const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
    // Consider token expired if it expires within 5 minutes
    return expiryDate.getTime() <= Date.now() + 5 * 60 * 1000
  }

  /**
   * Delete tokens for a user and provider
   */
  async deleteTokens(userId: string, provider: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('external_accounts')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider)

    if (error) {
      throw new Error(`Failed to delete tokens: ${error.message}`)
    }
  }
}

