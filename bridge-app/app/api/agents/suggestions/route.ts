/**
 * API Route: Get personalized suggestions
 * GET /api/agents/suggestions
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AgentService } from '@/lib/services/agents/agent.service'

export interface Suggestion {
  icon: string
  action: string
  contactName?: string
}

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
    const limit = parseInt(searchParams.get('limit') || '15', 10) // Default to 15 for caching

    // Check if user has any data before calling LLM
    const { ContextPreparationService } = await import('@/lib/services/agents/context-preparation.service')
    const contextService = new ContextPreparationService()
    
    let hasData = false
    try {
      const context = await contextService.prepareContext(user.id, {
        includeRelationships: true,
        includeTouchpoints: true,
        includePastConversations: false,
      })
      hasData = Boolean(
        (context.relationships && context.relationships.length > 0) ||
        (context.touchpoints && context.touchpoints.length > 0)
      )
    } catch (error) {
      // If context preparation fails, assume no data
      console.error('Error preparing context:', error)
      hasData = false
    }

    // If no data exists, return generic suggestions immediately
    if (!hasData) {
      const genericSuggestions: Suggestion[] = [
        { icon: 'message', action: 'Send a thoughtful text to someone', contactName: '' },
        { icon: 'calendar', action: 'Schedule a lunch date', contactName: '' },
        { icon: 'coffee', action: 'Grab coffee with a friend', contactName: '' },
      ]
      return NextResponse.json({
        suggestions: genericSuggestions.slice(0, limit),
      })
    }

    // Get personalized suggestions using the agent (only if we have data)
    const agentService = new AgentService()
    
    // Build a prompt for getting suggestions
    const message = `Generate ${limit} personalized, actionable suggestions for maintaining or improving relationships. Each suggestion should be specific and actionable. Return only the suggestions, one per line, in a simple format.`
    
    try {
      const result = await agentService.getAdvice(
        user.id,
        message,
        'advice',
        {
          includeRelationships: true,
          includeTouchpoints: true,
          includePastConversations: false,
        }
      )

      // Parse suggestions from the response
      // The LLM response might be structured, so we'll extract suggestions
      const suggestions: Suggestion[] = []
      const responseText = result.response
      
      // Try to parse suggestions from the response
      // This is a simple parser - in production, you might want more sophisticated parsing
      const lines = responseText.split('\n').filter(line => line.trim().length > 0)
      
      // Map common action types to icons
      const iconMap: Record<string, string> = {
        'message': 'message',
        'text': 'message',
        'call': 'phone',
        'phone': 'phone',
        'video': 'video',
        'coffee': 'coffee',
        'lunch': 'coffee',
        'dinner': 'coffee',
        'meet': 'calendar',
        'meeting': 'calendar',
        'schedule': 'calendar',
        'email': 'email',
        'walk': 'coffee',
        'activity': 'coffee',
      }

      for (let i = 0; i < Math.min(limit, lines.length); i++) {
        const line = lines[i].trim()
        // Remove numbering if present (e.g., "1. ", "- ", etc.)
        const cleanLine = line.replace(/^[\d\-•]\s*/, '').trim()
        
        if (cleanLine.length > 0) {
          // Determine icon based on content
          const lowerLine = cleanLine.toLowerCase()
          let icon = 'message' // default
          for (const [keyword, iconType] of Object.entries(iconMap)) {
            if (lowerLine.includes(keyword)) {
              icon = iconType
              break
            }
          }

          suggestions.push({
            icon,
            action: cleanLine,
            contactName: '', // Could be extracted if the suggestion mentions a specific person
          })
        }
      }

      // If we didn't get enough suggestions, fill with generic ones
      const genericSuggestions: Suggestion[] = [
        { icon: 'message', action: 'Send a thoughtful text to someone', contactName: '' },
        { icon: 'calendar', action: 'Schedule a lunch date', contactName: '' },
        { icon: 'coffee', action: 'Grab coffee with a friend', contactName: '' },
      ]

      while (suggestions.length < limit) {
        const generic = genericSuggestions[suggestions.length % genericSuggestions.length]
        suggestions.push({ ...generic })
      }

      return NextResponse.json({
        suggestions: suggestions.slice(0, limit),
      })
    } catch (error: any) {
      // If agent service fails, return generic suggestions
      console.error('Error getting suggestions from agent:', error)
      
      const genericSuggestions: Suggestion[] = [
        { icon: 'message', action: 'Send a thoughtful text to someone', contactName: '' },
        { icon: 'calendar', action: 'Schedule a lunch date', contactName: '' },
        { icon: 'coffee', action: 'Grab coffee with a friend', contactName: '' },
      ]

      return NextResponse.json({
        suggestions: genericSuggestions.slice(0, limit),
      })
    }
  } catch (error: any) {
    // Always return suggestions, never a 500 error
    console.error('Error getting suggestions:', error)
    
    // Parse limit from request if available, default to 3
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '3', 10)
    
    const genericSuggestions: Suggestion[] = [
      { icon: 'message', action: 'Send a thoughtful text to someone', contactName: '' },
      { icon: 'calendar', action: 'Schedule a lunch date', contactName: '' },
      { icon: 'coffee', action: 'Grab coffee with a friend', contactName: '' },
    ]

    return NextResponse.json({
      suggestions: genericSuggestions.slice(0, limit),
    })
  }
}

