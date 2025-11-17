/**
 * API Route: Get user profile
 * GET /api/profile
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GetProfileResponse } from '@/lib/api/types'

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

    // Fetch profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      // If profile doesn't exist, create a basic one
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            preferences: {},
          })
          .select()
          .single()

        if (createError) {
          throw new Error(`Failed to create profile: ${createError.message}`)
        }

        const response: GetProfileResponse = {
          ...newProfile,
          created_at: new Date(newProfile.created_at),
          updated_at: new Date(newProfile.updated_at),
        }

        return NextResponse.json(response)
      }

      throw new Error(`Failed to fetch profile: ${error.message}`)
    }

    const response: GetProfileResponse = {
      ...profile,
      created_at: new Date(profile.created_at),
      updated_at: new Date(profile.updated_at),
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

