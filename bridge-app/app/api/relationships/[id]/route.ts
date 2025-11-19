/**
 * API Route: Update relationship
 * PUT /api/relationships/[id]
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
    const relationshipId = id
    const body = await request.json()

    // Check if relationship exists and belongs to user
    const { data: existingRelationship, error: fetchError } = await supabase
      .from('relationships')
      .select('id, user_id, metadata')
      .eq('id', relationshipId)
      .single()

    if (fetchError || !existingRelationship) {
      return NextResponse.json(
        { error: 'Relationship not found' },
        { status: 404 }
      )
    }

    if (existingRelationship.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update relationship
    const updateData: { metadata?: Record<string, any> } = {}
    if (body.metadata !== undefined) {
      updateData.metadata = {
        ...existingRelationship.metadata,
        ...body.metadata,
      }
    }

    const { data: updatedRelationship, error: updateError } = await supabase
      .from('relationships')
      .update(updateData)
      .eq('id', relationshipId)
      .select(`
        *,
        people (*)
      `)
      .single()

    if (updateError) {
      throw new Error(`Failed to update relationship: ${updateError.message}`)
    }

    // Transform response
    const result = {
      ...updatedRelationship,
      person: updatedRelationship.people || null,
    }
    const { people, ...relationship } = result

    return NextResponse.json(relationship)
  } catch (error: any) {
    console.error('Error updating relationship:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update relationship' },
      { status: 500 }
    )
  }
}

