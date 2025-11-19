/**
 * API Route: Update touchpoint
 * PUT /api/touchpoints/[id]
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
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
    const touchpointId = id

    // Parse request body
    const body = await request.json()
    const { category } = body

    // Validate category if provided
    if (category !== undefined && category !== null) {
      const validCategories = ['social', 'work', 'personal', 'family', 'other']
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Check if touchpoint exists and belongs to user
    const { data: existingTouchpoint, error: fetchError } = await supabase
      .from('touchpoints')
      .select('id, user_id, data')
      .eq('id', touchpointId)
      .single()

    if (fetchError || !existingTouchpoint) {
      return NextResponse.json(
        { error: 'Touchpoint not found' },
        { status: 404 }
      )
    }

    if (existingTouchpoint.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update touchpoint
    const updateData: { category?: string | null; data?: Record<string, any> } = {}
    if (category !== undefined) {
      updateData.category = category === null ? null : category
    }
    if (body.data !== undefined) {
      updateData.data = {
        ...existingTouchpoint.data,
        ...body.data,
      }
    }

    const { data: updatedTouchpoint, error: updateError } = await supabase
      .from('touchpoints')
      .update(updateData)
      .eq('id', touchpointId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update touchpoint: ${updateError.message}`)
    }

    // Transform dates
    const result = {
      ...updatedTouchpoint,
      occurred_at: updatedTouchpoint.occurred_at ? new Date(updatedTouchpoint.occurred_at) : null,
      created_at: new Date(updatedTouchpoint.created_at),
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating touchpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update touchpoint' },
      { status: 500 }
    )
  }
}

