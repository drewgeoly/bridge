'use client'

import { useState, useEffect, useRef } from "react"
import { useSuggestions } from "@/lib/hooks/use-suggestions"
import { useAdvice } from "@/lib/hooks/use-advice"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import {
  MessageCircle,
  Calendar,
  Video,
  Phone,
  Mail,
  Coffee,
  Shuffle,
  Settings,
  ArrowUp,
  AlertCircle,
} from "lucide-react"

interface AdvicePageProps {
  onBack?: () => void
  onNavigate?: (page: "home" | "logger" | "advice" | "settings") => void
}

export function AdvicePage({
  onBack,
  onNavigate,
}: AdvicePageProps) {
  const router = useRouter()
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions
  const { data: suggestionsData, isLoading: suggestionsLoading, refetch: refetchSuggestions } = useSuggestions(3)
  const suggestions = suggestionsData?.suggestions || []

  // Advice hook
  const { streamAdvice, streamingResponse, isStreaming } = useAdvice()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingResponse])

  const actionTypes = [
    {
      type: "message" as const,
      template: "Send a thoughtful text to someone",
      icon: "message" as const,
    },
    {
      type: "calendar" as const,
      template: "Schedule a lunch date",
      icon: "calendar" as const,
    },
    {
      type: "video" as const,
      template: "Set up a video call",
      icon: "video" as const,
    },
    {
      type: "phone" as const,
      template: "Make a phone call to catch up",
      icon: "phone" as const,
    },
    {
      type: "email" as const,
      template: "Write a meaningful email",
      icon: "email" as const,
    },
    {
      type: "coffee" as const,
      template: "Grab coffee with a friend",
      icon: "coffee" as const,
    },
  ]

  const generateSuggestions = () => {
    // Refetch suggestions to get new ones
    refetchSuggestions()
  }

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "message":
        return <MessageCircle className="w-16 h-16" />
      case "calendar":
        return <Calendar className="w-16 h-16" />
      case "video":
        return <Video className="w-16 h-16" />
      case "phone":
        return <Phone className="w-16 h-16" />
      case "email":
        return <Mail className="w-16 h-16" />
      case "coffee":
        return <Coffee className="w-16 h-16" />
      default:
        return <MessageCircle className="w-16 h-16" />
    }
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isStreaming) return

    const userMessage = chatInput.trim()
    setChatInput("")
    setError(null)

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      // Stream the response - the hook will update streamingResponse as it streams
      const fullResponse = await streamAdvice(userMessage)
      
      // Add assistant response when streaming completes
      if (fullResponse) {
        setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }])
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get advice'
      setError(errorMessage)
      
      // Check if it's a rate limit error
      if (errorMessage.includes('Rate limit')) {
        setError('Rate limit exceeded. Please try again later.')
      }
      
      // Remove user message if request failed
      setMessages(prev => prev.slice(0, -1))
    }
  }

  const handleSuggestionClick = async (suggestion: { icon: string; action: string; contactName?: string }) => {
    const message = `Help me with: ${suggestion.action}`
    setError(null)

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: message }])

    try {
      // Stream the response
      const fullResponse = await streamAdvice(message)
      
      // Add assistant response when streaming completes
      if (fullResponse) {
        setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }])
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get advice'
      setError(errorMessage)
      
      // Check if it's a rate limit error
      if (errorMessage.includes('Rate limit')) {
        setError('Rate limit exceeded. Please try again later.')
      }
      
      // Remove user message if request failed
      setMessages(prev => prev.slice(0, -1))
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push('/')
    }
  }

  const handleNavigate = (page: "home" | "logger" | "advice" | "settings") => {
    if (onNavigate) {
      onNavigate(page)
    } else {
      router.push(`/${page === 'home' ? '' : page}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-amber-100">
      {/* Navigation */}
      <nav className="border-b border-white/30 bg-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={handleBack}
              className="text-3xl text-slate-800 hover:text-slate-900 transition-colors"
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
              }}
            >
              bridge
            </button>
            <div className="flex gap-6">
              <button
                onClick={() => handleNavigate("logger")}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                Log Connection
              </button>
              <button className="text-slate-700 hover:text-slate-900 transition-colors">
                Get Advice
              </button>
            </div>
          </div>
          <button
            onClick={() => handleNavigate("settings")}
            className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/60 transition-all border border-white/50"
          >
            <Settings className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12 pb-32">
        <div className="text-center mb-12">
          <h2
            className="text-6xl text-slate-800 mb-12"
            style={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
            }}
          >
            Get some advice on...
          </h2>

          {/* Suggestion Cards */}
          {suggestionsLoading ? (
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-12 shadow-lg border border-white/50 mb-8">
              <p className="text-slate-600">Loading suggestions...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isStreaming}
                    className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 hover:bg-white/70 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-sky-400 mb-6 flex justify-center group-hover:scale-110 transition-transform">
                      {getIcon(suggestion.icon)}
                    </div>
                    <p className="text-sky-400 group-hover:text-sky-500 transition-colors">
                      {suggestion.action}
                    </p>
                  </button>
                ))}
              </div>
              <button
                onClick={generateSuggestions}
                disabled={suggestionsLoading || isStreaming}
                className="text-sky-400 hover:text-sky-500 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                shuffle suggestions
                <Shuffle className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-12 shadow-lg border border-white/50 mb-8">
              <p className="text-slate-600">
                Add some contacts to get personalized suggestions!
              </p>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="mb-8 space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
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
            {/* Streaming response - show only if streaming and not yet in messages */}
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

        {/* Error Message */}
        {error && (
          <div className="mb-8 flex items-center gap-2 p-4 bg-red-50 backdrop-blur-sm border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Chat Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/20 backdrop-blur-md border-t border-white/30 p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleChatSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask for advice or suggestions..."
              disabled={isStreaming}
              className="flex-1 bg-white/60 backdrop-blur-sm border border-white/50 rounded-full px-6 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isStreaming}
              className="w-10 h-10 rounded-full bg-sky-400 hover:bg-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
