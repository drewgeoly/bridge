import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${requestUrl.origin}/api/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.redirect(
      new URL('/?error=Could not authenticate user', requestUrl.origin)
    )
  }

  if (data.url) {
    return NextResponse.redirect(data.url)
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin))
}