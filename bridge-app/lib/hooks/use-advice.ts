/**
 * React hook for getting advice (streaming and non-streaming)
 */

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiPost, API_ENDPOINTS } from '@/lib/api/client'
import { streamAdvice } from '@/lib/api/streaming'
import type { AgentRequest } from '@/types/agents'

export interface AdviceResponse {
  success: boolean
  response: string
  insights: any[]
  conversationId: string
}

export interface UseAdviceOptions {
  agentName?: string
  contextOptions?: any
  stream?: boolean
}

export function useAdvice() {
  const [streamingResponse, setStreamingResponse] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)

  // Non-streaming mutation
  const nonStreamingMutation = useMutation({
    mutationFn: async (input: { message: string; options?: UseAdviceOptions }): Promise<AdviceResponse> => {
      return apiPost<AdviceResponse>(API_ENDPOINTS.advice, {
        message: input.message,
        agentName: input.options?.agentName || 'advice',
        contextOptions: input.options?.contextOptions,
        stream: false,
      })
    },
  })

  // Streaming function
  const streamAdviceResponse = useCallback(
    async (message: string, options?: UseAdviceOptions) => {
      setIsStreaming(true)
      setStreamingResponse('')

      try {
        const generator = streamAdvice(
          message,
          options?.agentName || 'advice',
          options?.contextOptions
        )

        let fullResponse = ''
        for await (const chunk of generator) {
          fullResponse += chunk
          setStreamingResponse(fullResponse)
        }

        return fullResponse
      } catch (error: any) {
        throw error
      } finally {
        setIsStreaming(false)
      }
    },
    []
  )

  return {
    // Non-streaming
    getAdvice: nonStreamingMutation.mutateAsync,
    adviceData: nonStreamingMutation.data,
    isPending: nonStreamingMutation.isPending,
    error: nonStreamingMutation.error,

    // Streaming
    streamAdvice: streamAdviceResponse,
    streamingResponse,
    isStreaming,
  }
}

