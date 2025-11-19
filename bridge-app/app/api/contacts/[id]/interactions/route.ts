/**
 * API Route: Get interactions for a contact (by person ID)
 * GET /api/contacts/[id]/interactions
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const personId = id

    // Get relationship for this person
    const { data: relationship } = await supabase
      .from('relationships')
      .select('id')
      .eq('user_id', user.id)
      .eq('person_id', personId)
      .eq('status', 'active')
      .single()

    if (!relationship) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get touchpoints for this relationship
    const { data: touchpoints, error, count } = await supabase
      .from('touchpoints')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('relationship_id', relationship.id)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch interactions: ${error.message}`)
    }

    // Transform dates
    const transformed = (touchpoints || []).map((tp: any) => ({
      ...tp,
      occurred_at: tp.occurred_at ? new Date(tp.occurred_at) : null,
      created_at: new Date(tp.created_at),
    }))

    return NextResponse.json({
      touchpoints: transformed,
      total: count || 0,
    })
  } catch (error: any) {
    console.error('Error fetching contact interactions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch interactions' },
      { status: 500 }
    )
  }
}

