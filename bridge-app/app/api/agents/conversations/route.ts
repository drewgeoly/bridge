/**
 * API Route: Get user's conversation history
 * GET /api/agents/conversations
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AgentConversationRepository } from '@/lib/repositories/agent-conversation.repository'

export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const agentName = searchParams.get('agentName') || 'advice'

    // Get conversations
    const repository = new AgentConversationRepository()
    const conversations = await repository.getConversationsByUser(user.id, limit, agentName)

    // Transform conversations to include metadata
    const transformedConversations = conversations.map((conv) => {
      const context = conv.context_snapshot || {}
      const conversationMetadata = context.conversationMetadata || {}
      
      return {
        id: conv.id,
        message: conv.message,
        response: conv.response,
        intent: conversationMetadata.intent || context.intent,
        friend: conversationMetadata.friend || context.friend,
        activity: conversationMetadata.activity || context.activity,
        createdAt: conv.created_at,
        metadata: conv.metadata,
      }
    })

    return NextResponse.json({
      conversations: transformedConversations,
      total: transformedConversations.length,
    })
  } catch (error: any) {
    console.error('Error getting conversations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get conversations' },
      { status: 500 }
    )
  }
}

