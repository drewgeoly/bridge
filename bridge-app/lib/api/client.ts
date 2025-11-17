/**
 * API Client - Base fetch wrapper with authentication
 */

import { createClient } from '@/lib/supabase/client'
import { API_ENDPOINTS } from './endpoints'

// Re-export for convenience
export { API_ENDPOINTS }

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Get authentication token from Supabase
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch (error) {
    // If we're on the server or session is not available, return null
    return null
  }
}

/**
 * Base fetch function with authentication and error handling
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status
      )
    }
    return response as unknown as T
  }

  const data = await response.json()

  if (!response.ok) {
    const errorMessage = (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') 
      ? data.error 
      : `Request failed with status ${response.status}`
    throw new ApiError(errorMessage, response.status, data)
  }

  return data as T
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'GET' })
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string,
  body?: any
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * PUT request helper
 */
export async function apiPut<T>(
  endpoint: string,
  body?: any
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'DELETE' })
}

