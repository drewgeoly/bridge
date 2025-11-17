import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = await createClient()

  // Use stable domain if available, otherwise use request origin
  const stableDomain = 'https://assignment-3-olive-eight.vercel.app'
  const redirectTo = process.env.NEXT_PUBLIC_APP_URL || stableDomain || requestUrl.origin

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${redirectTo}/api/auth/callback`,
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