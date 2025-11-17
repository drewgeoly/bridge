/**
 * React hook for updating user preferences
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPut, API_ENDPOINTS } from '@/lib/api/client'
import type { UpdatePreferencesRequest, UpdatePreferencesResponse } from '@/lib/api/types'

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preferences: UpdatePreferencesRequest): Promise<UpdatePreferencesResponse> => {
      return apiPut<UpdatePreferencesResponse>(API_ENDPOINTS.profilePreferences, preferences)
    },
    onSuccess: () => {
      // Invalidate profile query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

