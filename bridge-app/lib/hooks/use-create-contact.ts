/**
 * React hook for creating contacts
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, API_ENDPOINTS } from '@/lib/api/client'

export interface CreateContactRequest {
  name: string
  relationship?: string
}

export interface CreateContactResponse {
  success: boolean
  person: any
  relationship: any
}

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateContactRequest): Promise<CreateContactResponse> => {
      return apiPost<CreateContactResponse>(API_ENDPOINTS.contacts, {
        name: input.name,
        relationship: input.relationship,
      })
    },
    onSuccess: () => {
      // Invalidate and refetch relationships
      queryClient.invalidateQueries({ queryKey: ['relationships'] })
    },
  })
}

