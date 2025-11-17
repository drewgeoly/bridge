import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Use stable domain if available, otherwise use request origin
  const stableDomain = 'https://assignment-3-olive-eight.vercel.app'
  const redirectTo = process.env.NEXT_PUBLIC_APP_URL || stableDomain || requestUrl.origin

  return NextResponse.redirect(new URL('/', redirectTo))
}