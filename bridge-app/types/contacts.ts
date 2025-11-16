/**
 * Contact-related types
 */

/**
 * Contact data structure
 */
export interface Contact {
  name?: string
  firstName?: string
  lastName?: string
  emails: string[]
  phones: string[]
  notes?: string
  organization?: string
  rawData?: Record<string, any>
}

/**
 * Contact import input
 */
export interface ContactImportInput {
  source: 'vcf_upload' | 'api'
  file?: File | Buffer
  contacts?: Contact[]
  fileName?: string
}

/**
 * Contact import result
 */
export interface ContactImportResult {
  importId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  importedCount: number
  matchedCount: number
  createdCount: number
  mappings: ContactMapping[]
  errorMessage?: string
}

/**
 * Contact mapping
 */
export interface ContactMapping {
  id: string
  user_id: string
  contact_import_id: string
  person_id: string
  contact_email?: string
  contact_name?: string
  match_type: 'email_exact' | 'email_fuzzy' | 'name_exact' | 'name_fuzzy' | 'phone' | 'manual'
  confidence_score: number
  created_at: Date
}

/**
 * Contact import record
 */
export interface ContactImport {
  id: string
  user_id: string
  source: string
  file_name?: string
  imported_count: number
  matched_count: number
  created_count: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  metadata: Record<string, any>
  created_at: Date
  completed_at?: Date
}

/**
 * Deduplication match result
 */
export interface DeduplicationMatch {
  person: {
    id: string
    email?: string
    name?: string
  }
  matchType: 'email_exact' | 'email_fuzzy' | 'name_exact' | 'name_fuzzy' | 'phone' | 'none'
  confidence: number
  matchedFields: string[]
}

