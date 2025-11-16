/**
 * API route for importing contacts
 * POST /api/contacts/import
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ContactSyncService } from '@/lib/services/contacts/contact-sync.service'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Check file type
    if (!file.name.endsWith('.vcf') && !file.type.includes('vcard')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a .vcf file' },
        { status: 400 }
      )
    }

    // Convert File to Buffer for processing
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Import contacts
    const syncService = new ContactSyncService()
    const result = await syncService.syncContacts(user.id, {
      source: 'vcf_upload',
      file: buffer,
      fileName: file.name,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Error importing contacts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import contacts' },
      { status: 500 }
    )
  }
}

