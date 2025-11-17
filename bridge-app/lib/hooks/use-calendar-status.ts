/**
 * React hook for fetching calendar connection status
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet, API_ENDPOINTS } from '@/lib/api/client'
import type { CalendarStatusResponse } from '@/lib/api/types'

export function useCalendarStatus() {
  return useQuery({
    queryKey: ['calendar-status'],
    queryFn: async () => {
      return apiGet<CalendarStatusResponse>(API_ENDPOINTS.calendarStatus)
    },
  })
}

