/**
 * React hook for searching contacts
 */

import { useQuery } from '@tanstack/react-query'
import { useRelationships } from './use-relationships'
import { useMemo } from 'react'
import type { Contact } from '@/types/frontend'

export function useSearchContacts(searchQuery: string) {
  // Fetch relationships with search
  const { data, isLoading, error } = useRelationships({
    search: searchQuery,
    limit: 50,
  })

  // Transform relationships to contacts
  const contacts: Contact[] = useMemo(() => {
    if (!data?.relationships) return []
    
    return data.relationships.map((rel) => ({
      id: rel.person_id,
      name: rel.person?.name || 'Unknown',
      relationship: rel.metadata?.relationship as string | undefined,
    }))
  }, [data])

  return {
    contacts,
    isLoading,
    error,
  }
}

