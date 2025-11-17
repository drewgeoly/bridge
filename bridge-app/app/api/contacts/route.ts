/**
 * API Route: Create contact directly
 * POST /api/contacts
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RelationshipService } from '@/lib/services/relationships/relationship.service'

export async function POST(request: Request) {
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

    // Parse request body
    let body: { name: string; relationship?: string }
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Create person and relationship
    const relationshipService = new RelationshipService()
    
    // Find or create person by name
    const person = await relationshipService.findOrCreatePersonByName(body.name.trim())
    
    // Ensure relationship exists
    const relationship = await relationshipService.ensureRelationship(user.id, person.id)
    
    // Update relationship metadata if relationship type is provided
    if (body.relationship && body.relationship.trim().length > 0) {
      const { error: updateError } = await supabase
        .from('relationships')
        .update({
          metadata: {
            ...(relationship.metadata || {}),
            relationship: body.relationship.trim(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', relationship.id)

      if (updateError) {
        console.error('Error updating relationship metadata:', updateError)
        // Don't fail the request if metadata update fails
      } else {
        // Fetch updated relationship
        const { data: updated } = await supabase
          .from('relationships')
          .select('*')
          .eq('id', relationship.id)
          .single()
        
        if (updated) {
          return NextResponse.json({
            success: true,
            person: {
              ...person,
              created_at: new Date(person.created_at),
            },
            relationship: {
              ...updated,
              created_at: new Date(updated.created_at),
              updated_at: new Date(updated.updated_at),
            },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      person: {
        ...person,
        created_at: new Date(person.created_at),
      },
      relationship: {
        ...relationship,
        created_at: new Date(relationship.created_at),
        updated_at: new Date(relationship.updated_at),
      },
    })
  } catch (error: any) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create contact' },
      { status: 500 }
    )
  }
}

