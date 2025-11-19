'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Settings } from 'lucide-react'
import { useAdviceConversationStore, type AdviceStep } from '@/lib/stores/advice-conversation.store'
import { IntentSelectionStep } from './advice/IntentSelectionStep'
import { FriendSelectionStep } from './advice/FriendSelectionStep'
import { ActivitySelectionStep } from './advice/ActivitySelectionStep'
import { AdviceOutputStep } from './advice/AdviceOutputStep'
import { ConversationHistorySidebar } from './ConversationHistorySidebar'
import { LoadingOverlay } from './ui/LoadingOverlay'

interface AdvicePageProps {
  onBack?: () => void
  onNavigate?: (page: 'home' | 'logger' | 'advice' | 'settings') => void
}

export function AdvicePage({ onBack, onNavigate }: AdvicePageProps) {
  const router = useRouter()
  const { currentStep, setStep, reset, isStreaming } = useAdviceConversationStore()
  const [stepTransition, setStepTransition] = useState<'forward' | 'back' | null>(null)

  // Handle step navigation with transitions
  const handleNext = () => {
    setStepTransition('forward')
    setTimeout(() => setStepTransition(null), 300)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setStepTransition('back')
      const newStep = (currentStep - 1) as AdviceStep
      
      // If going back from advice step, clear the advice history
      if (currentStep === 4 || currentStep === 5) {
        const { reset } = useAdviceConversationStore.getState()
        // Only reset advice history, keep intent/friend/activity
        const { context, setStep: setStepState } = useAdviceConversationStore.getState()
        useAdviceConversationStore.setState({
          context: {
            ...context,
            adviceHistory: [],
            userTextHistory: [],
          },
        })
      }
      
      setStep(newStep)
      setTimeout(() => setStepTransition(null), 300)
    } else {
      // Go back to home
      if (onBack) {
        onBack()
      } else {
        router.push('/')
      }
    }
  }

  const handleNavigate = (page: 'home' | 'logger' | 'advice' | 'settings') => {
    if (onNavigate) {
      onNavigate(page)
    } else {
      router.push(`/${page === 'home' ? '' : page}`)
    }
  }

  const handleStartNew = () => {
    reset()
    setStep(1)
  }

  // Progress indicator
  const getProgressPercent = () => {
    switch (currentStep) {
      case 1:
        return 20
      case 2:
        return 40
      case 3:
        return 60
      case 4:
        return 80
      case 5:
        return 100
      default:
        return 0
    }
  }

  const getStepLabel = () => {
    switch (currentStep) {
      case 1:
        return 'Choose Intent'
      case 2:
        return 'Select Friend'
      case 3:
        return 'Choose Activity'
      case 4:
        return 'Get Advice'
      case 5:
        return 'Follow-up'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen relative">
      <LoadingOverlay show={isStreaming} message="Generating advice..." />

      {/* Conversation History Sidebar */}
      <ConversationHistorySidebar
        onConversationSelect={() => {
          // Conversation is loaded by the sidebar component
        }}
      />

      {/* Navigation */}
      <nav className="border-b border-white/30 bg-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => handleNavigate('home')}
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
              <button className="text-slate-700 hover:text-slate-900 transition-colors font-semibold">
                Get Advice
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentStep === 4 && (
              <Button
                onClick={handleStartNew}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-800"
              >
                New Conversation
              </Button>
            )}
          <button
              onClick={() => handleNavigate('settings')}
            className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/60 transition-all border border-white/50"
          >
            <Settings className="w-5 h-5 text-slate-700" />
          </button>
          </div>
        </div>
      </nav>

      {/* Progress Indicator */}
      {currentStep <= 3 && (
        <div className="max-w-4xl mx-auto px-8 pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Step {currentStep} of 3</span>
            <span className="text-sm text-slate-600">{getStepLabel()}</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
            <div
              className="bg-sky-400 h-full transition-all duration-300 ease-out"
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12 pb-32">
        <div
          className={`transition-all duration-300 ${
            stepTransition === 'forward'
              ? 'opacity-0 translate-x-4'
              : stepTransition === 'back'
              ? 'opacity-0 -translate-x-4'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {currentStep === 1 && <IntentSelectionStep onNext={handleNext} />}
          {currentStep === 2 && (
            <FriendSelectionStep onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 3 && (
            <ActivitySelectionStep onNext={handleNext} onBack={handleBack} />
          )}
          {(currentStep === 4 || currentStep === 5) && (
            <AdviceOutputStep onBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  )
}
