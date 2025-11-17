/**
 * API Route: Get advice from an agent
 * POST /api/agents/advice
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AgentService } from '@/lib/services/agents/agent.service'
import type { AgentRequest } from '@/types/agents'

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    let body: AgentRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    if (body.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    const agentService = new AgentService()
    const stream = body.stream !== false // Default to true for MVP

    if (stream) {
      // Return streaming response
      const responseStream = await agentService.getAdviceStream(
        user.id,
        body.message,
        body.agentName || 'advice',
        body.contextOptions
      )

      // Convert to Server-Sent Events format
      const encoder = new TextEncoder()
      const sseStream = new ReadableStream({
        async start(controller) {
          const reader = responseStream.getReader()
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
                break
              }

              // Format as SSE - value is already a string
              const escaped = JSON.stringify(value)
              controller.enqueue(encoder.encode(`data: ${escaped}\n\n`))
            }
          } catch (error) {
            controller.error(error)
          } finally {
            reader.releaseLock()
          }
        },
      })

      return new Response(sseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    } else {
      // Return non-streaming response
      const result = await agentService.getAdvice(
        user.id,
        body.message,
        body.agentName || 'advice',
        body.contextOptions
      )

      return NextResponse.json({
        success: true,
        response: result.response,
        insights: result.insights,
        conversationId: result.conversationId,
      })
    }
  } catch (error: any) {
    console.error('Error getting advice:', error)

    // Handle missing API key (Gemini)
    if (error.message?.includes('GEMINI_API_KEY') || error.message?.includes('environment variable is required')) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable is required. Please set it in Vercel environment variables and redeploy.' },
        { status: 500 }
      )
    }

    // Handle rate limiting
    if (error.message?.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      )
    }

    // Handle validation errors
    if (error.message?.includes('required') || error.message?.includes('invalid')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to get advice' },
      { status: 500 }
    )
  }
}

