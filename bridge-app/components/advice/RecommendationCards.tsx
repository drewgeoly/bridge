'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, MapPin, Clock, Sparkles } from 'lucide-react'

export interface Recommendation {
  type: string
  data?: any
}

interface RecommendationCardsProps {
  recommendations?: Recommendation[]
  onRecommendationClick?: (recommendation: Recommendation) => void
}

const RECOMMENDATION_CONFIG: Record<string, { label: string; icon: any; description: string }> = {
  draft_message: {
    label: 'Draft Message',
    icon: MessageSquare,
    description: 'Get a message draft',
  },
  suggest_places: {
    label: 'Suggest Places',
    icon: MapPin,
    description: 'Find great spots',
  },
  suggest_times: {
    label: 'Suggest Times',
    icon: Clock,
    description: 'Find the best time',
  },
  more_advice: {
    label: 'More Advice',
    icon: Sparkles,
    description: 'Get additional guidance',
  },
}

export function RecommendationCards({ recommendations = [], onRecommendationClick }: RecommendationCardsProps) {
  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold text-slate-800">Recommendations</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, index) => {
          const config = RECOMMENDATION_CONFIG[rec.type] || {
            label: rec.type,
            icon: Sparkles,
            description: 'Get help with this',
          }
          const Icon = config.icon

          return (
            <button
              key={index}
              onClick={() => onRecommendationClick?.(rec)}
              className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:bg-white/70 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                  <Icon className="w-6 h-6 text-sky-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 mb-1">{config.label}</h4>
                  <p className="text-sm text-slate-600">{config.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

