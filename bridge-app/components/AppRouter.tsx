'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { HomePage } from './HomePage'
import { InteractionLogger } from './InteractionLogger'
import { AdvicePage } from './AdvicePage'
import { SettingsPage } from './SettingsPage'

type Page = 'home' | 'logger' | 'advice' | 'settings'

export function AppRouter() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Redirect to login if not authenticated
        router.push('/api/auth/login')
        return
      }
      
      setIsAuthenticated(true)
    }

    checkAuth()
  }, [router])

  const handleNavigate = (page: Page) => {
    setCurrentPage(page)
  }

  // Show nothing while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-amber-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  // Don't render if not authenticated (redirect is happening)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-amber-100">
      {currentPage === 'home' && (
        <HomePage onNavigate={handleNavigate} />
      )}
      {currentPage === 'logger' && (
        <InteractionLogger
          onBack={() => handleNavigate('home')}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'advice' && (
        <AdvicePage
          onBack={() => handleNavigate('home')}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'settings' && (
        <SettingsPage
          onBack={() => handleNavigate('home')}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  )
}

