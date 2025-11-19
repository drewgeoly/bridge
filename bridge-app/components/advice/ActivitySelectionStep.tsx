'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdviceConversationStore } from '@/lib/stores/advice-conversation.store'
import { ArrowRight, Utensils, Coffee, Film, Gamepad2, Music, Heart } from 'lucide-react'

interface ActivitySelectionStepProps {
  onNext: () => void
  onBack: () => void
}

const ACTIVITY_CARDS = [
  { id: 'get_food', label: 'Get food', icon: Utensils },
  { id: 'grab_coffee', label: 'Grab coffee', icon: Coffee },
  { id: 'watch_movie', label: 'Watch a movie', icon: Film },
  { id: 'play_games', label: 'Play games', icon: Gamepad2 },
  { id: 'listen_music', label: 'Listen to music', icon: Music },
  { id: 'hang_out', label: 'Just hang out', icon: Heart },
]

export function ActivitySelectionStep({ onNext, onBack }: ActivitySelectionStepProps) {
  const { setActivity, setStep, context } = useAdviceConversationStore()
  const [customActivity, setCustomActivity] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)

  const handleActivitySelect = (activityId: string) => {
    setSelectedActivity(activityId)
    setActivity(activityId)
    setTimeout(() => {
      setStep(4)
      onNext()
    }, 300)
  }

  const handleCustomActivity = () => {
    if (customActivity.trim()) {
      setActivity(customActivity.trim())
      setStep(4)
      onNext()
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl text-slate-800 mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          What do you want to do?
        </h2>
        {context.friend && (
          <p className="text-slate-600">Planning something with {context.friend.name}?</p>
        )}
      </div>

      {/* Activity Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {ACTIVITY_CARDS.map((activity) => {
          const Icon = activity.icon
          const isSelected = selectedActivity === activity.id
          
          return (
            <button
              key={activity.id}
              onClick={() => handleActivitySelect(activity.id)}
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
              <h3 className="text-xl font-semibold text-slate-800">{activity.label}</h3>
            </button>
          )
        })}
      </div>

      {/* Custom Activity Input */}
      <div className="space-y-4">
        <div className="relative">
          <Input
            type="text"
            value={customActivity}
            onChange={(e) => setCustomActivity(e.target.value)}
            placeholder="Or describe what you want to do..."
            className="bg-white/60 backdrop-blur-sm border-white/50 rounded-full px-6 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customActivity.trim()) {
                handleCustomActivity()
              }
            }}
          />
          {customActivity.trim() && (
            <Button
              onClick={handleCustomActivity}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-sky-400 hover:bg-sky-500"
              size="sm"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-start pt-4">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-slate-600 hover:text-slate-800"
        >
          ← Back
        </Button>
      </div>
    </div>
  )
}

