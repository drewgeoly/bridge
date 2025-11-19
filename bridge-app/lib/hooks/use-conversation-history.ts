/**
 * React hook for fetching conversation history
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet, API_ENDPOINTS } from '@/lib/api/client'

export interface ConversationHistoryItem {
  id: string
  message: string
  response: string
  intent?: string
  friend?: { id?: string; name: string }
  activity?: string
  createdAt: Date
  metadata?: Record<string, any>
}

export interface ConversationHistoryResponse {
  conversations: ConversationHistoryItem[]
  total: number
}

export function useConversationHistory(agentName: string = 'advice', limit: number = 20) {
  return useQuery({
    queryKey: ['conversation-history', agentName, limit],
    queryFn: async () => {
      const url = `/api/agents/conversations?agentName=${agentName}&limit=${limit}`
      return apiGet<ConversationHistoryResponse>(url)
    },
  })
}

