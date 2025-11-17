/**
 * React hook for fetching weekly summary
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet, API_ENDPOINTS } from '@/lib/api/client'
import type { WeeklySummaryResponse } from '@/lib/api/types'

export interface UseWeeklySummaryParams {
  startDate?: string
  endDate?: string
  includeNarrative?: boolean
}

export function useWeeklySummary(params?: UseWeeklySummaryParams) {
  return useQuery({
    queryKey: ['weekly-summary', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.startDate) searchParams.set('startDate', params.startDate)
      if (params?.endDate) searchParams.set('endDate', params.endDate)
      if (params?.includeNarrative !== undefined) {
        searchParams.set('includeNarrative', params.includeNarrative.toString())
      }
      
      const url = `${API_ENDPOINTS.weeklySummary}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      return apiGet<WeeklySummaryResponse>(url)
    },
  })
}

