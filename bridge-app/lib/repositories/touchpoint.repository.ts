/**
 * Repository for managing touchpoints
 */

import { createClient } from '@/lib/supabase/server'
import type { Touchpoint, TouchpointInput } from '@/types/database'

export class TouchpointRepository {
  /**
   * Create a new touchpoint
   */
  async createTouchpoint(input: TouchpointInput): Promise<Touchpoint> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('touchpoints')
      .insert({
        user_id: input.userId,
        relationship_id: input.relationshipId,
        type: input.type,
        source: input.source,
        occurred_at: input.occurredAt ? input.occurredAt.toISOString() : null,
        duration_minutes: input.durationMinutes,
        title: input.title,
        data: input.data || {},
        external_id: input.externalId,
        raw_event_data: input.rawEventData || {},
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create touchpoint: ${error.message}`)
    }

    return data as Touchpoint
  }

  /**
   * Find touchpoint by external ID and source (for deduplication)
   */
  async findByExternalId(
    externalId: string,
    source: string,
    userId: string
  ): Promise<Touchpoint | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('touchpoints')
      .select('*')
      .eq('external_id', externalId)
      .eq('source', source)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw new Error(`Failed to find touchpoint: ${error.message}`)
    }

    return data as Touchpoint
  }

  /**
   * Find touchpoints by date range
   */
  async findByDateRange(
    userId: string,
    start: Date,
    end: Date
  ): Promise<Touchpoint[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('touchpoints')
      .select('*')
      .eq('user_id', userId)
      .gte('occurred_at', start.toISOString())
      .lte('occurred_at', end.toISOString())
      .order('occurred_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find touchpoints: ${error.message}`)
    }

    return (data || []) as Touchpoint[]
  }

  /**
   * Find touchpoints by relationship ID
   */
  async findByRelationshipId(
    relationshipId: string,
    userId: string
  ): Promise<Touchpoint[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('touchpoints')
      .select('*')
      .eq('relationship_id', relationshipId)
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find touchpoints: ${error.message}`)
    }

    return (data || []) as Touchpoint[]
  }

  /**
   * Update touchpoint
   */
  async updateTouchpoint(
    id: string,
    updates: Partial<TouchpointInput>
  ): Promise<Touchpoint> {
    const supabase = await createClient()

    const updateData: Record<string, any> = {}
    if (updates.relationshipId !== undefined) updateData.relationship_id = updates.relationshipId
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.data !== undefined) updateData.data = updates.data
    if (updates.durationMinutes !== undefined) updateData.duration_minutes = updates.durationMinutes
    if (updates.occurredAt !== undefined) updateData.occurred_at = updates.occurredAt ? updates.occurredAt.toISOString() : null
    if (updates.rawEventData !== undefined) updateData.raw_event_data = updates.rawEventData

    const { data, error } = await supabase
      .from('touchpoints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update touchpoint: ${error.message}`)
    }

    return data as Touchpoint
  }

  /**
   * Delete touchpoint
   */
  async deleteTouchpoint(id: string, userId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('touchpoints')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete touchpoint: ${error.message}`)
    }
  }
}

