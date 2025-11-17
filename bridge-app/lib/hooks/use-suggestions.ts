/**
 * React hook for getting personalized suggestions
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet, API_ENDPOINTS } from '@/lib/api/client'
import type { SuggestionsResponse } from '@/lib/api/types'

export function useSuggestions(limit: number = 3) {
  return useQuery({
    queryKey: ['suggestions', limit],
    queryFn: async () => {
      const url = `${API_ENDPOINTS.suggestions}?limit=${limit}`
      return apiGet<SuggestionsResponse>(url)
    },
  })
}

