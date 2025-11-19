'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdviceConversationStore } from '@/lib/stores/advice-conversation.store'
import { useAdvice } from '@/lib/hooks/use-advice'
import { RecommendationCards, type Recommendation } from './RecommendationCards'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { ArrowUp, ArrowLeft, RefreshCw } from 'lucide-react'

interface AdviceOutputStepProps {
  onBack: () => void
  onMoreAdvice?: () => void
}

export function AdviceOutputStep({ onBack, onMoreAdvice }: AdviceOutputStepProps) {
  const {
    context,
    isStreaming,
    streamingResponse,
    setStreaming,
    setStreamingResponse,
    addUserText,
    addAdvice,
    setStep,
  } = useAdviceConversationStore()
  
  const { streamAdvice } = useAdvice()
  const [chatInput, setChatInput] = useState('')
  const [currentAdvice, setCurrentAdvice] = useState<string>('')
  const [currentRecommendations, setCurrentRecommendations] = useState<Recommendation[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Map intent/activity IDs to human-readable labels
  const getIntentLabel = (intent?: string) => {
    if (!intent) return ''
    const intentMap: Record<string, string> = {
      'make_plans': 'make plans',
      'get_advice': 'get advice',
      'talk_through_issue': 'talk through an issue',
    }
    return intentMap[intent] || intent.replace(/_/g, ' ')
  }

  const getActivityLabel = (activity?: string) => {
    if (!activity) return ''
    const activityMap: Record<string, string> = {
      'get_food': 'get food together',
      'grab_coffee': 'grab coffee',
      'watch_movie': 'watch a movie',
      'play_games': 'play games',
      'listen_music': 'listen to music',
      'hang_out': 'hang out',
    }
    return activityMap[activity] || activity.replace(/_/g, ' ')
  }

  // Build context message from conversation state
  const buildContextMessage = () => {
    const parts: string[] = []
    
    if (context.intent) {
      const intentLabel = getIntentLabel(context.intent)
      if (intentLabel === 'make plans') {
        // For "make plans", structure it naturally
        if (context.friend && context.activity) {
          return `I want to ${getActivityLabel(context.activity)} with ${context.friend.name}`
        } else if (context.friend) {
          return `I want to make plans with ${context.friend.name}`
        } else {
          return 'I want to make plans'
        }
      } else {
        parts.push(`I need help to ${intentLabel}`)
      }
    }
    
    if (context.friend && context.intent !== 'make_plans') {
      parts.push(`regarding ${context.friend.name}`)
    }
    
    if (context.activity && context.intent !== 'make_plans') {
      parts.push(`about ${getActivityLabel(context.activity)}`)
    }
    
    return parts.join(' ') || 'I need some advice'
  }

  // Reset state when context changes (e.g., going back and changing selections)
  useEffect(() => {
    // Clear current advice when context changes significantly
    setCurrentAdvice('')
    setCurrentRecommendations([])
  }, [context.intent, context.friend?.name, context.activity])

  // Generate initial advice when component mounts or when context is ready
  useEffect(() => {
    if (context.adviceHistory.length === 0 && !isStreaming && !currentAdvice) {
      const contextMessage = buildContextMessage()
      if (contextMessage.trim() && context.friend) {
        // Small delay to ensure state is cleared first
        setTimeout(() => {
          generateAdvice(contextMessage)
        }, 100)
      }
    }
  }, [context.intent, context.friend?.name, context.activity])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [context.userTextHistory, context.adviceHistory, streamingResponse])

  const generateAdvice = async (message: string) => {
    if (!message.trim() || isStreaming) return

    setStreaming(true)
    setStreamingResponse('')
    addUserText(message)

    try {
      // Build context options from conversation state
      const contextOptions = {
        includeRelationships: true,
        includeTouchpoints: true,
        includePastConversations: false,
        relationshipId: context.friend?.id,
        intent: context.intent,
        friend: context.friend,
        activity: context.activity,
        userTextHistory: context.userTextHistory,
      }
      
      const fullResponse = await streamAdvice(message, {
        agentName: 'advice',
        contextOptions,
      })
      
      // Parse structured response (try to extract JSON if present)
      let advice = fullResponse
      let recommendations: Recommendation[] = []
      
      try {
        // Try to find JSON in the response
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.advice) {
            advice = parsed.advice
          }
          if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
            recommendations = parsed.recommendations
          }
          // Remove JSON from the advice text if it was included
          advice = advice.replace(jsonMatch[0], '').trim()
        }
      } catch {
        // If parsing fails, use full response as advice
        // Remove any JSON-like structures that might have been included
        advice = fullResponse.replace(/\{[\s\S]*\}/g, '').trim()
      }
      
      // Final cleanup - remove any remaining JSON artifacts
      advice = advice.replace(/```json[\s\S]*?```/g, '').trim()
      advice = advice.replace(/```[\s\S]*?```/g, '').trim()

      // Clean up the advice - remove any system prompt leakage
      // Remove common system prompt phrases
      const systemPromptPhrases = [
        'Since this appears to be',
        'Based on the context provided',
        'Given that this is',
        'It seems like',
        'According to the information',
      ]
      
      for (const phrase of systemPromptPhrases) {
        const regex = new RegExp(`.*?${phrase}.*?\\n`, 'gi')
        advice = advice.replace(regex, '')
      }
      
      // Remove any remaining system-like language at the start
      advice = advice.trim()
      if (advice.startsWith('Since ') || advice.startsWith('Given ') || advice.startsWith('Based on ')) {
        // Find the first sentence that doesn't start with these phrases
        const sentences = advice.split(/[.!?]\s+/)
        const firstRealSentence = sentences.find(s => 
          !s.startsWith('Since ') && 
          !s.startsWith('Given ') && 
          !s.startsWith('Based on ') &&
          s.length > 20
        )
        if (firstRealSentence) {
          advice = firstRealSentence + (advice.includes('.') ? '.' : '')
        }
      }

      setCurrentAdvice(advice)
      setCurrentRecommendations(recommendations)
      addAdvice(advice, recommendations)
    } catch (error: any) {
      console.error('Error generating advice:', error)
      setCurrentAdvice('Sorry, I encountered an error. Please try again.')
    } finally {
      setStreaming(false)
      setStreamingResponse('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isStreaming) return

    const message = chatInput.trim()
    setChatInput('')
    await generateAdvice(message)
  }

  const handleMoreAdvice = () => {
    if (onMoreAdvice) {
      onMoreAdvice()
    } else {
      // Generate follow-up advice
      generateAdvice('Can you provide more advice or suggestions?')
    }
  }

  const handleRecommendationClick = (recommendation: Recommendation) => {
    // Handle different recommendation types
    switch (recommendation.type) {
      case 'draft_message':
        generateAdvice('Can you draft a message for me?')
        break
      case 'suggest_places':
        generateAdvice('Can you suggest some places?')
        break
      case 'suggest_times':
        generateAdvice('What are some good times?')
        break
      case 'more_advice':
        handleMoreAdvice()
        break
      default:
        generateAdvice(`Tell me more about ${recommendation.type}`)
    }
  }

  const allMessages = [
    ...context.userTextHistory.map((text) => ({ role: 'user' as const, content: text })),
    ...context.adviceHistory.map((advice) => ({ role: 'assistant' as const, content: advice.advice })),
  ]

  return (
    <div className="space-y-6">
      <LoadingOverlay show={isStreaming && !streamingResponse} />

      {/* Context Summary */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Your Advice</h2>
            {context.friend && (
              <p className="text-slate-600">
                {(() => {
                  const intentLabel = getIntentLabel(context.intent)
                  const activityLabel = getActivityLabel(context.activity)
                  if (intentLabel === 'make plans' && activityLabel) {
                    return `${activityLabel} with ${context.friend.name}`
                  } else if (intentLabel === 'make plans') {
                    return `Making plans with ${context.friend.name}`
                  } else if (intentLabel && activityLabel) {
                    return `${intentLabel} about ${activityLabel} with ${context.friend.name}`
                  } else if (intentLabel) {
                    return `${intentLabel} regarding ${context.friend.name}`
                  } else {
                    return `Advice for ${context.friend.name}`
                  }
                })()}
              </p>
            )}
          </div>
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      {allMessages.length > 0 && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {allMessages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-sky-400 text-white'
                    : 'bg-white/60 backdrop-blur-sm text-slate-700'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {/* Streaming response */}
          {isStreaming && streamingResponse && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl p-4 bg-white/60 backdrop-blur-sm text-slate-700">
                <p className="whitespace-pre-wrap">{streamingResponse}</p>
                <span className="inline-block w-2 h-4 bg-slate-400 animate-pulse ml-1" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Recommendations */}
      {currentRecommendations.length > 0 && (
        <RecommendationCards
          recommendations={currentRecommendations}
          onRecommendationClick={handleRecommendationClick}
        />
      )}

      {/* More Advice Button */}
      {currentAdvice && (
        <div className="flex justify-center">
          <Button
            onClick={handleMoreAdvice}
            variant="outline"
            className="bg-white/50 backdrop-blur-sm border-white/50 hover:bg-white/70"
            disabled={isStreaming}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            More Advice
          </Button>
        </div>
      )}

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <Input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask a follow-up question..."
          disabled={isStreaming}
          className="flex-1 bg-white/60 backdrop-blur-sm border-white/50 rounded-full px-6 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={!chatInput.trim() || isStreaming}
          className="rounded-full bg-sky-400 hover:bg-sky-500 disabled:bg-slate-300"
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}

