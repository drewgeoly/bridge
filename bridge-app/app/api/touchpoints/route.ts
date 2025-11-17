/**
 * API Route: Get touchpoints
 * GET /api/touchpoints
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GetTouchpointsResponse } from '@/lib/api/types'

export async function GET(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const relationshipId = searchParams.get('relationshipId')

    // Build query
    let query = supabase
      .from('touchpoints')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    // Apply filters
    if (startDate) {
      query = query.gte('occurred_at', startDate)
    }
    if (endDate) {
      query = query.lte('occurred_at', endDate)
    }
    if (relationshipId) {
      query = query.eq('relationship_id', relationshipId)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch touchpoints: ${error.message}`)
    }

    // Transform dates
    const touchpoints = (data || []).map((tp: any) => ({
      ...tp,
      occurred_at: tp.occurred_at ? new Date(tp.occurred_at) : null,
      created_at: new Date(tp.created_at),
    }))

    const response: GetTouchpointsResponse = {
      touchpoints,
      total: count || 0,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching touchpoints:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch touchpoints' },
      { status: 500 }
    )
  }
}

