/**
 * API route for getting a specific contact import
 * GET /api/contacts/import/:id
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ContactRepository } from '@/lib/repositories/contact.repository'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const importId = id

    const contactRepository = new ContactRepository()
    const importRecord = await contactRepository.getContactImportById(importId, user.id)

    if (!importRecord) {
      return NextResponse.json({ error: 'Import not found' }, { status: 404 })
    }

    // Get mappings for this import
    const mappings = await contactRepository.getMappingsByImport(importId)

    return NextResponse.json(
      {
        ...importRecord,
        mappings,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error getting contact import:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get contact import' },
      { status: 500 }
    )
  }
}

