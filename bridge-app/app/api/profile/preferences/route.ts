/**
 * API Route: Update user preferences
 * PUT /api/profile/preferences
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdatePreferencesRequest, UpdatePreferencesResponse } from '@/lib/api/types'

export async function PUT(request: Request) {
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
    let body: UpdatePreferencesRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Get current profile
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch profile: ${fetchError.message}`)
    }

    // Merge preferences
    const currentPreferences = currentProfile?.preferences || {}
    const updatedPreferences = {
      ...currentPreferences,
      ...body,
    }

    // Update or create profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || currentProfile?.email || '',
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update preferences: ${updateError.message}`)
    }

    const response: UpdatePreferencesResponse = {
      ...updatedProfile,
      created_at: new Date(updatedProfile.created_at),
      updated_at: new Date(updatedProfile.updated_at),
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

