'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { HomePage } from './HomePage'
import { InteractionLogger } from './InteractionLogger'
import { AdvicePage } from './AdvicePage'
import { SettingsPage } from './SettingsPage'
import { LoginPage } from './LoginPage'
import { ContactsPage } from './contacts/ContactsPage'
import { ContactDetailView } from './contacts/ContactDetailView'
import { apiGet, API_ENDPOINTS } from '@/lib/api/client'
import type { GetProfileResponse } from '@/lib/api/types'

type Page = 'home' | 'logger' | 'advice' | 'settings' | 'contacts'

export function AppRouter() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isCheckingNewUser, setIsCheckingNewUser] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setIsAuthenticated(false)
        return
      }
      
      setIsAuthenticated(true)
      setIsCheckingNewUser(true)

      // Check if user is new (no preferences set)
      try {
        const profile = await apiGet<GetProfileResponse>(API_ENDPOINTS.profile)
        const hasPreferences = profile?.preferences && 
          Object.keys(profile.preferences).length > 0 &&
          (profile.preferences.usageFrequency || profile.preferences.advicePreference)
        
        if (!hasPreferences) {
          // New user - send to settings
          setCurrentPage('settings')
        } else {
          // Existing user - send to home
          setCurrentPage('home')
        }
      } catch (error) {
        // If profile fetch fails, assume new user
        console.error('Error checking profile:', error)
        setCurrentPage('settings')
      } finally {
        setIsCheckingNewUser(false)
      }
    }

    checkAuth()
  }, [router])

  const handleNavigate = (page: Page) => {
    setCurrentPage(page)
    if (page !== 'contacts') {
      setSelectedContactId(null)
    }
  }

  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId)
  }

  const handleContactBack = () => {
    setSelectedContactId(null)
  }

  const handleLogin = () => {
    window.location.href = '/api/auth/login'
  }

  // Show loading while checking auth
  if (isAuthenticated === null || (isAuthenticated && isCheckingNewUser)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-amber-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
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
      {currentPage === 'contacts' && (
        selectedContactId ? (
          <ContactDetailView
            contactId={selectedContactId}
            onBack={handleContactBack}
            onNavigate={handleNavigate}
          />
        ) : (
          <ContactsPage
            onBack={() => handleNavigate('home')}
            onNavigate={handleNavigate}
            onContactSelect={handleContactSelect}
          />
        )
      )}
    </div>
  )
}

