/**
 * React hook for fetching user profile
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet, API_ENDPOINTS } from '@/lib/api/client'
import type { GetProfileResponse } from '@/lib/api/types'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      return apiGet<GetProfileResponse>(API_ENDPOINTS.profile)
    },
  })
}

