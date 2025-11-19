'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useConversationHistory } from '@/lib/hooks/use-conversation-history'
import { useAdviceConversationStore } from '@/lib/stores/advice-conversation.store'
import { ChevronLeft, ChevronRight, MessageSquare, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ConversationHistorySidebarProps {
  onConversationSelect?: (conversationId: string) => void
}

export function ConversationHistorySidebar({ onConversationSelect }: ConversationHistorySidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data, isLoading } = useConversationHistory('advice', 20)
  const { loadConversation } = useAdviceConversationStore()

  const conversations = data?.conversations || []

  const handleConversationClick = (conversation: any) => {
    // Restore conversation context
    const context = {
      intent: conversation.intent,
      friend: conversation.friend,
      activity: conversation.activity,
      userTextHistory: [conversation.message],
      adviceHistory: [
        {
          advice: conversation.response,
          recommendations: [],
          timestamp: new Date(conversation.createdAt).getTime(),
        },
      ],
    }
    
    loadConversation(conversation.id, context)
    onConversationSelect?.(conversation.id)
  }

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 rounded-r-full rounded-l-none bg-white/80 backdrop-blur-sm border-r border-t border-b border-white/50 shadow-lg ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform`}
        size="sm"
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-white/90 backdrop-blur-md border-r border-white/50 shadow-xl z-30 transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/50">
            <h2 className="text-xl font-semibold text-slate-800">Conversation History</h2>
            <p className="text-sm text-slate-600 mt-1">
              {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
            </p>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-6 text-center">
                <p className="text-slate-600">Loading...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-slate-600">No conversations yet</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation)}
                    className="w-full text-left bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white/70 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-800 truncate">
                            {conversation.friend?.name || conversation.intent || 'Advice'}
                          </p>
                        </div>
                        {conversation.activity && (
                          <p className="text-sm text-slate-600 truncate mb-2">
                            {conversation.activity}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {conversation.message}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </>
  )
}

