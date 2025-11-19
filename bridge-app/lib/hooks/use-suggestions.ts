/**
 * React hook for getting personalized suggestions with caching
 */

import { useQuery } from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import { apiGet, API_ENDPOINTS } from '@/lib/api/client'
import type { SuggestionsResponse } from '@/lib/api/types'

export function useSuggestions(limit: number = 3) {
  const [cachedSuggestions, setCachedSuggestions] = useState<any[]>([])
  
  // Fetch larger batch (15 suggestions) for caching
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['suggestions', 'batch'],
    queryFn: async () => {
      const url = `${API_ENDPOINTS.suggestions}?limit=15`
      return apiGet<SuggestionsResponse>(url)
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Update cache when data arrives
  useEffect(() => {
    if (data?.suggestions && cachedSuggestions.length === 0) {
      setCachedSuggestions(data.suggestions)
    }
  }, [data?.suggestions, cachedSuggestions.length])

  // Shuffle function that works on cached suggestions
  const shuffle = useCallback(() => {
    if (cachedSuggestions.length === 0) {
      refetch()
      return
    }
    
    // Shuffle locally without API call
    const shuffled = [...cachedSuggestions].sort(() => Math.random() - 0.5)
    setCachedSuggestions(shuffled)
  }, [cachedSuggestions, refetch])

  // Return limited suggestions from cache
  const suggestions = cachedSuggestions.slice(0, limit)

  return {
    suggestions,
    isLoading,
    refetch,
    shuffle,
    cachedCount: cachedSuggestions.length,
  }
}

