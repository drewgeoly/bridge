/**
 * Vitest setup file - runs before all tests
 */

import { vi } from 'vitest'

// Mock Next.js modules that aren't available in test environment
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.GOOGLE_CALENDAR_CLIENT_ID = 'test-client-id'
process.env.GOOGLE_CALENDAR_CLIENT_SECRET = 'test-client-secret'
process.env.GOOGLE_CALENDAR_REDIRECT_URI = 'http://localhost:3000/api/calendar/callback'

