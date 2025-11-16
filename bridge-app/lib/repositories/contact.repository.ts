/**
 * Repository for managing contact imports and mappings
 */

import { createClient } from '@/lib/supabase/server'
import type { ContactImport, ContactMapping } from '@/types/contacts'

export interface CreateContactImportInput {
  userId: string
  source: string
  fileName?: string
  metadata?: Record<string, any>
}

export interface UpdateContactImportInput {
  importedCount?: number
  matchedCount?: number
  createdCount?: number
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
  completedAt?: Date
}

export interface CreateContactMappingInput {
  userId: string
  contactImportId: string
  personId: string
  contactEmail?: string
  contactName?: string
  matchType: string
  confidenceScore: number
}

export class ContactRepository {
  /**
   * Create a contact import record
   */
  async createContactImport(input: CreateContactImportInput): Promise<ContactImport> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contact_imports')
      .insert({
        user_id: input.userId,
        source: input.source,
        file_name: input.fileName,
        metadata: input.metadata || {},
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create contact import: ${error.message}`)
    }

    return data as ContactImport
  }

  /**
   * Update contact import record
   */
  async updateContactImport(
    id: string,
    userId: string,
    updates: UpdateContactImportInput
  ): Promise<ContactImport> {
    const supabase = await createClient()

    const updateData: any = {}
    if (updates.importedCount !== undefined) updateData.imported_count = updates.importedCount
    if (updates.matchedCount !== undefined) updateData.matched_count = updates.matchedCount
    if (updates.createdCount !== undefined) updateData.created_count = updates.createdCount
    if (updates.status) updateData.status = updates.status
    if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage
    if (updates.completedAt) updateData.completed_at = updates.completedAt.toISOString()

    const { data, error } = await supabase
      .from('contact_imports')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update contact import: ${error.message}`)
    }

    return data as ContactImport
  }

  /**
   * Get contact imports by user
   */
  async getContactImportsByUser(
    userId: string,
    limit: number = 10
  ): Promise<ContactImport[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contact_imports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get contact imports: ${error.message}`)
    }

    return (data || []) as ContactImport[]
  }

  /**
   * Get contact import by ID
   */
  async getContactImportById(id: string, userId: string): Promise<ContactImport | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contact_imports')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get contact import: ${error.message}`)
    }

    return data as ContactImport
  }

  /**
   * Create a contact mapping
   */
  async createContactMapping(input: CreateContactMappingInput): Promise<ContactMapping> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contact_mappings')
      .insert({
        user_id: input.userId,
        contact_import_id: input.contactImportId,
        person_id: input.personId,
        contact_email: input.contactEmail,
        contact_name: input.contactName,
        match_type: input.matchType,
        confidence_score: input.confidenceScore,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create contact mapping: ${error.message}`)
    }

    return data as ContactMapping
  }

  /**
   * Get mappings by import ID
   */
  async getMappingsByImport(importId: string): Promise<ContactMapping[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contact_mappings')
      .select('*')
      .eq('contact_import_id', importId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get contact mappings: ${error.message}`)
    }

    return (data || []) as ContactMapping[]
  }

  /**
   * Get mappings by person ID
   */
  async getMappingsByPerson(personId: string): Promise<ContactMapping[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contact_mappings')
      .select('*')
      .eq('person_id', personId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get contact mappings: ${error.message}`)
    }

    return (data || []) as ContactMapping[]
  }
}

