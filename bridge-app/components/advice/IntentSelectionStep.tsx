'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdviceConversationStore } from '@/lib/stores/advice-conversation.store'
import { MessageCircle, Calendar, Heart, ArrowRight } from 'lucide-react'

interface IntentSelectionStepProps {
  onNext: () => void
}

const INTENT_CARDS = [
  {
    id: 'make_plans',
    label: 'Make plans',
    icon: Calendar,
    description: 'Plan something with a friend',
  },
  {
    id: 'get_advice',
    label: 'Get advice',
    icon: Heart,
    description: 'Get relationship guidance',
  },
  {
    id: 'talk_through_issue',
    label: 'Talk through an issue',
    icon: MessageCircle,
    description: 'Work through a problem together',
  },
]

export function IntentSelectionStep({ onNext }: IntentSelectionStepProps) {
  const { setIntent, setStep } = useAdviceConversationStore()
  const [customIntent, setCustomIntent] = useState('')
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null)

  const handleIntentSelect = (intentId: string) => {
    setSelectedIntent(intentId)
    setIntent(intentId)
    // Auto-advance after a brief delay for better UX
    setTimeout(() => {
      setStep(2)
      onNext()
    }, 300)
  }

  const handleCustomIntent = () => {
    if (customIntent.trim()) {
      setIntent(customIntent.trim())
      setStep(2)
      onNext()
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl text-slate-800 mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          What do you need help with?
        </h2>
        <p className="text-slate-600">Choose an option or describe what you're looking for</p>
      </div>

      {/* Intent Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {INTENT_CARDS.map((intent) => {
          const Icon = intent.icon
          const isSelected = selectedIntent === intent.id
          
          return (
            <button
              key={intent.id}
              onClick={() => handleIntentSelect(intent.id)}
              className={`bg-white/50 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 transition-all group ${
                isSelected
                  ? 'border-sky-400 bg-white/70'
                  : 'border-white/50 hover:bg-white/70 hover:border-white/70'
              }`}
            >
              <div className={`text-sky-400 mb-6 flex justify-center group-hover:scale-110 transition-transform ${
                isSelected ? 'scale-110' : ''
              }`}>
                <Icon className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">{intent.label}</h3>
              <p className="text-slate-600 text-sm">{intent.description}</p>
            </button>
          )
        })}
      </div>

      {/* Custom Intent Input */}
      <div className="space-y-4">
        <div className="relative">
          <Input
            type="text"
            value={customIntent}
            onChange={(e) => setCustomIntent(e.target.value)}
            placeholder="Or describe what you need help with..."
            className="bg-white/60 backdrop-blur-sm border-white/50 rounded-full px-6 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customIntent.trim()) {
                handleCustomIntent()
              }
            }}
          />
          {customIntent.trim() && (
            <Button
              onClick={handleCustomIntent}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-sky-400 hover:bg-sky-500"
              size="sm"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

