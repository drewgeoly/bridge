/**
 * API Route: Log a connection
 * POST /api/connections/log
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ConnectionLoggerService } from '@/lib/services/connections/connection-logger.service'
import type { LogConnectionInput } from '@/types/connections'

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
    let body: LogConnectionInput
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      )
    }

    if (!body.method || typeof body.method !== 'string') {
      return NextResponse.json(
        { error: 'Method is required and must be a string' },
        { status: 400 }
      )
    }

    // Parse occurredAt if provided
    let occurredAt: Date | null | undefined = body.occurredAt
    if (body.occurredAt && typeof body.occurredAt === 'string') {
      occurredAt = new Date(body.occurredAt)
      if (isNaN(occurredAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format for occurredAt' },
          { status: 400 }
        )
      }
    }

    // Log the connection
    const connectionLogger = new ConnectionLoggerService()
    const result = await connectionLogger.logConnection(user.id, {
      name: body.name,
      method: body.method,
      description: body.description,
      occurredAt,
    })

    return NextResponse.json({
      success: true,
      touchpoint: result.touchpoint,
      relationship: result.relationship,
      person: result.person,
    })
  } catch (error: any) {
    console.error('Error logging connection:', error)

    // Handle validation errors
    if (error.message.includes('required') || error.message.includes('Name') || error.message.includes('Method')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to log connection' },
      { status: 500 }
    )
  }
}

