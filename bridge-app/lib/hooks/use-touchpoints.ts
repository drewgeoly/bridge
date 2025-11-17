/**
 * React hook for fetching touchpoints
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet, API_ENDPOINTS } from '@/lib/api/client'
import type { GetTouchpointsResponse, GetTouchpointsParams } from '@/lib/api/types'

export function useTouchpoints(params?: GetTouchpointsParams) {
  return useQuery({
    queryKey: ['touchpoints', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.offset) searchParams.set('offset', params.offset.toString())
      if (params?.startDate) searchParams.set('startDate', params.startDate)
      if (params?.endDate) searchParams.set('endDate', params.endDate)
      if (params?.relationshipId) searchParams.set('relationshipId', params.relationshipId)
      
      const url = `${API_ENDPOINTS.touchpoints}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      return apiGet<GetTouchpointsResponse>(url)
    },
  })
}

