/**
 * API Route: Get/Update contact (relationship) by person ID
 * GET /api/contacts/[id]
 * PUT /api/contacts/[id]
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
    const { data: relationship, error } = await supabase
      .from('relationships')
      .select(`
        *,
        people (*)
      `)
      .eq('user_id', user.id)
      .eq('person_id', personId)
      .eq('status', 'active')
      .single()

    if (error || !relationship) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Transform to match expected format
    const result = {
      ...relationship,
      person: relationship.people || null,
    }
    const { people, ...contact } = result

    return NextResponse.json(contact)
  } catch (error: any) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

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
    const personId = id
    const body = await request.json()

    // Get existing relationship
    const { data: existingRelationship, error: fetchError } = await supabase
      .from('relationships')
      .select('id, user_id, metadata')
      .eq('user_id', user.id)
      .eq('person_id', personId)
      .single()

    if (fetchError || !existingRelationship) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Update relationship metadata
    const updateData: { metadata?: Record<string, any> } = {}
    if (body.relationship !== undefined || body.metadata) {
      updateData.metadata = {
        ...existingRelationship.metadata,
        ...(body.metadata || {}),
        ...(body.relationship !== undefined ? { relationship: body.relationship } : {}),
      }
    }

    const { data: updatedRelationship, error: updateError } = await supabase
      .from('relationships')
      .update(updateData)
      .eq('id', existingRelationship.id)
      .select(`
        *,
        people (*)
      `)
      .single()

    if (updateError) {
      throw new Error(`Failed to update contact: ${updateError.message}`)
    }

    // Transform response
    const result = {
      ...updatedRelationship,
      person: updatedRelationship.people || null,
    }
    const { people, ...contact } = result

    return NextResponse.json(contact)
  } catch (error: any) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update contact' },
      { status: 500 }
    )
  }
}

