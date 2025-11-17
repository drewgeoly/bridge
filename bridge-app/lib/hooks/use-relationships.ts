/**
 * React hook for fetching relationships
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet, API_ENDPOINTS } from '@/lib/api/client'
import type { GetRelationshipsResponse, GetRelationshipsParams } from '@/lib/api/types'

export function useRelationships(params?: GetRelationshipsParams) {
  return useQuery({
    queryKey: ['relationships', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.offset) searchParams.set('offset', params.offset.toString())
      if (params?.search) searchParams.set('search', params.search)
      
      const url = `${API_ENDPOINTS.relationships}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      return apiGet<GetRelationshipsResponse>(url)
    },
  })
}

