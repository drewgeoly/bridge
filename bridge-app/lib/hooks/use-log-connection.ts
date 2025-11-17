/**
 * React hook for logging connections
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, API_ENDPOINTS } from '@/lib/api/client'
import type { LogConnectionInput, LogConnectionResult } from '@/types/connections'

export interface LogConnectionResponse {
  success: boolean
  touchpoint: any
  relationship: any
  person: any
}

export function useLogConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: LogConnectionInput): Promise<LogConnectionResponse> => {
      return apiPost<LogConnectionResponse>(API_ENDPOINTS.logConnection, {
        name: input.name,
        method: input.method,
        description: input.description,
        occurredAt: input.occurredAt ? input.occurredAt.toISOString() : null,
      })
    },
    onSuccess: () => {
      // Invalidate and refetch relationships and touchpoints
      queryClient.invalidateQueries({ queryKey: ['relationships'] })
      queryClient.invalidateQueries({ queryKey: ['touchpoints'] })
    },
  })
}

