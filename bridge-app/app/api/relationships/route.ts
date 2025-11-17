/**
 * API Route: Get relationships
 * GET /api/relationships
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GetRelationshipsResponse } from '@/lib/api/types'

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
    const search = searchParams.get('search') || ''

    // Build query
    let query = supabase
      .from('relationships')
      .select(`
        *,
        people (*)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('last_interaction', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    // For search, we need to fetch more results and filter client-side
    // since Supabase has limitations with filtering on joined tables
    const fetchLimit = search ? 1000 : limit // Fetch more if searching
    const fetchOffset = search ? 0 : offset

    // Apply pagination
    query = query.range(fetchOffset, fetchOffset + fetchLimit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch relationships: ${error.message}`)
    }

    // Transform data to include person details
    let relationships = (data || []).map((rel: any) => ({
      ...rel,
      person: rel.people || null,
    }))

    // Remove the nested people object
    let transformed = relationships.map(({ people, ...rest }: any) => rest)

    // Apply search filter if provided (filter after fetching due to join limitations)
    let totalCount = count || 0
    if (search) {
      const searchLower = search.toLowerCase()
      const filtered = transformed.filter((rel: any) => {
        const person = rel.person
        if (!person) return false
        const name = (person.name || '').toLowerCase()
        const email = (person.email || '').toLowerCase()
        return name.includes(searchLower) || email.includes(searchLower)
      })
      totalCount = filtered.length
      // Re-apply pagination after filtering
      transformed = filtered.slice(offset, offset + limit)
    }

    const response: GetRelationshipsResponse = {
      relationships: transformed,
      total: totalCount,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching relationships:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch relationships' },
      { status: 500 }
    )
  }
}

