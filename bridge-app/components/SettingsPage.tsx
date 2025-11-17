'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCalendarStatus } from '@/lib/hooks/use-calendar-status'
import { useProfile } from '@/lib/hooks/use-profile'
import { useUpdatePreferences } from '@/lib/hooks/use-update-preferences'
import { Settings, Calendar, Check, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

interface SettingsPageProps {
  onBack?: () => void
  onNavigate?: (
    page: 'home' | 'logger' | 'advice' | 'settings',
  ) => void
}

export function SettingsPage({
  onBack,
  onNavigate,
}: SettingsPageProps) {
  const router = useRouter()
  const { data: calendarStatus, isLoading: calendarLoading } = useCalendarStatus()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const updatePreferences = useUpdatePreferences()

  const [usageFrequency, setUsageFrequency] = useState<string>('')
  const [advicePreference, setAdvicePreference] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load preferences from profile
  useEffect(() => {
    if (profile?.preferences) {
      const prefs = profile.preferences as any
      if (prefs.usageFrequency) setUsageFrequency(prefs.usageFrequency)
      if (prefs.advicePreference) setAdvicePreference(prefs.advicePreference)
    }
  }, [profile])

  const isCalendarSynced = calendarStatus?.connected || false

  const handleCalendarConnect = () => {
    // Redirect to calendar connect endpoint
    window.location.href = API_ENDPOINTS.calendarConnect
  }

  const handleSavePreferences = async () => {
    setError(null)
    setSuccess(false)

    try {
      await updatePreferences.mutateAsync({
        usageFrequency: usageFrequency || undefined,
        advicePreference: advicePreference || undefined,
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        if (onBack) {
          onBack()
        } else {
          router.push('/')
        }
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences')
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push('/')
    }
  }

  const handleNavigate = (page: 'home' | 'logger' | 'advice' | 'settings') => {
    if (onNavigate) {
      onNavigate(page)
    } else {
      router.push(`/${page === 'home' ? '' : page}`)
    }
  }

  const isLoading = calendarLoading || profileLoading

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-700">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-white/30 bg-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={handleBack}
              className="text-3xl text-slate-800 hover:text-slate-900 transition-colors"
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              bridge
            </button>
            <div className="flex gap-6">
              <button
                onClick={() => handleNavigate('logger')}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                Log Connection
              </button>
              <button
                onClick={() => handleNavigate('advice')}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                Get Advice
              </button>
            </div>
          </div>
          <button
            onClick={() => handleNavigate('settings')}
            className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/60 transition-all border border-white/50"
          >
            <Settings className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="mb-16">
          <h2
            className="text-6xl text-slate-800 mb-4"
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            Set Up
          </h2>
          <p className="text-xl text-slate-600">
            Customize your Bridge experience
          </p>
        </div>

        <div className="space-y-8">
          {/* Google Calendar Integration */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-slate-700" />
                </div>
                <div>
                  <h3
                    className="text-2xl text-slate-800 mb-2"
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                    }}
                  >
                    Google Calendar
                  </h3>
                  <p className="text-slate-600">
                    Sync your connections to see them in your calendar
                  </p>
                  {calendarStatus?.lastSyncedAt && (
                    <p className="text-sm text-slate-500 mt-1">
                      Last synced: {new Date(calendarStatus.lastSyncedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {isCalendarSynced && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span>Synced</span>
                </div>
              )}
            </div>
            <button
              onClick={handleCalendarConnect}
              disabled={isCalendarSynced}
              className={`w-full py-4 rounded-2xl ${
                isCalendarSynced
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'bg-white/60 backdrop-blur-sm text-slate-700 hover:bg-white/80'
              } transition-all`}
            >
              {isCalendarSynced
                ? 'Calendar Connected'
                : 'Connect Google Calendar'}
            </button>
          </div>

          {/* Usage Frequency */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
            <h3
              className="text-2xl text-slate-800 mb-4"
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              How often do you plan to use Bridge?
            </h3>
            <p className="text-slate-600 mb-6">
              This helps us tailor reminders and suggestions
            </p>
            <div className="space-y-3">
              {[
                {
                  value: 'daily',
                  label:
                    'Daily - I want to stay on top of my connections',
                },
                {
                  value: 'few-times-week',
                  label:
                    'A few times a week - Regular check-ins',
                },
                {
                  value: 'weekly',
                  label:
                    'Weekly - Once a week is enough for me',
                },
                {
                  value: 'occasionally',
                  label: 'Occasionally - When I remember',
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setUsageFrequency(option.value)}
                  className={`w-full p-5 rounded-2xl text-left transition-all ${
                    usageFrequency === option.value
                      ? 'bg-sky-100 border-2 border-sky-300'
                      : 'bg-white/60 backdrop-blur-sm hover:bg-white/80 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">
                      {option.label}
                    </span>
                    {usageFrequency === option.value && (
                      <Check className="w-5 h-5 text-sky-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Advice Preference */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
            <h3
              className="text-2xl text-slate-800 mb-4"
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              What kind of advice would you like to receive?
            </h3>
            <p className="text-slate-600 mb-6">
              We'll customize suggestions based on your preferences
            </p>
            <div className="space-y-3">
              {[
                {
                  value: 'practical',
                  label:
                    'Practical suggestions - Simple, actionable ideas',
                },
                {
                  value: 'thoughtful',
                  label:
                    'Thoughtful prompts - Deeper connection ideas',
                },
                {
                  value: 'spontaneous',
                  label:
                    'Spontaneous activities - Fun, creative suggestions',
                },
                {
                  value: 'scheduled',
                  label:
                    'Scheduled reminders - Help me plan ahead',
                },
                {
                  value: 'all',
                  label: 'Mix of everything - Surprise me!',
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAdvicePreference(option.value)}
                  className={`w-full p-5 rounded-2xl text-left transition-all ${
                    advicePreference === option.value
                      ? 'bg-sky-100 border-2 border-sky-300'
                      : 'bg-white/60 backdrop-blur-sm hover:bg-white/80 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">
                      {option.label}
                    </span>
                    {advicePreference === option.value && (
                      <Check className="w-5 h-5 text-sky-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 backdrop-blur-sm border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 backdrop-blur-sm border border-green-200 rounded-lg text-green-700">
              <Check className="w-5 h-5" />
              <span>Preferences saved successfully!</span>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSavePreferences}
              disabled={updatePreferences.isPending}
              className="px-12 py-4 rounded-2xl bg-sky-400 text-white hover:bg-sky-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
