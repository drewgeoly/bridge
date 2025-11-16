/**
 * API route for getting contact import history
 * GET /api/contacts/imports
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ContactRepository } from '@/lib/repositories/contact.repository'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const contactRepository = new ContactRepository()
    const imports = await contactRepository.getContactImportsByUser(user.id, limit)

    return NextResponse.json(imports, { status: 200 })
  } catch (error: any) {
    console.error('Error getting contact imports:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get contact imports' },
      { status: 500 }
    )
  }
}

