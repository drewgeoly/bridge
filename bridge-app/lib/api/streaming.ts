/**
 * Streaming API client utilities for Server-Sent Events (SSE)
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Get authentication token from Supabase
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch (error) {
    return null
  }
}

/**
 * Parse Server-Sent Events stream
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<string, void, unknown> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6) // Remove 'data: ' prefix
          if (data === '[DONE]') {
            return
          }
          try {
            // Parse JSON if it's JSON, otherwise return as string
            const parsed = JSON.parse(data)
            yield typeof parsed === 'string' ? parsed : data
          } catch {
            // If not JSON, yield as-is
            yield data
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Create a streaming request to an SSE endpoint
 */
export async function createStreamingRequest(
  endpoint: string,
  body?: any
): Promise<Response> {
  const token = await getAuthToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${endpoint}`

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorData
    try {
      errorData = JSON.parse(errorText)
    } catch {
      errorData = { error: errorText }
    }
    throw new Error(errorData.error || `Request failed with status ${response.status}`)
  }

  if (!response.body) {
    throw new Error('Response body is not readable')
  }

  return response
}

/**
 * Stream advice response from the API
 */
export async function* streamAdvice(
  message: string,
  agentName?: string,
  contextOptions?: any
): AsyncGenerator<string, void, unknown> {
  const response = await createStreamingRequest('/api/agents/advice', {
    message,
    agentName: agentName || 'advice',
    contextOptions,
    stream: true,
  })

  yield* parseSSEStream(response)
}

