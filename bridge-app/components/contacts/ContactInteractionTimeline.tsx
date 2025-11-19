'use client'

import { useState } from 'react'
import { useTouchpoints } from '@/lib/hooks/use-touchpoints'
import { Card } from '@/components/ui/card'
import { InteractionDetailView } from '@/components/interactions/InteractionDetailView'
import { Calendar, MessageCircle, Mail, FileText, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface ContactInteractionTimelineProps {
  relationshipId: string
}

const typeIcons: Record<string, React.ReactNode> = {
  calendar: <Calendar className="w-4 h-4" />,
  message: <MessageCircle className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  note: <FileText className="w-4 h-4" />,
}

export function ContactInteractionTimeline({ relationshipId }: ContactInteractionTimelineProps) {
  const [selectedTouchpointId, setSelectedTouchpointId] = useState<string | null>(null)
  const { data: touchpointsData, isLoading } = useTouchpoints({
    relationshipId,
    limit: 50,
  })

  const touchpoints = touchpointsData?.touchpoints || []

  if (isLoading) {
    return <div className="text-sm text-slate-600 py-4">Loading interactions...</div>
  }

  if (touchpoints.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No interactions yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {touchpoints.map((touchpoint) => {
          const date = touchpoint.occurred_at
            ? new Date(touchpoint.occurred_at)
            : new Date(touchpoint.created_at)
          
          return (
            <Card
              key={touchpoint.id}
              className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/50 hover:bg-white/80 transition-all cursor-pointer"
              onClick={() => setSelectedTouchpointId(touchpoint.id)}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 text-sky-600">
                  {typeIcons[touchpoint.type] || <FileText className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="text-slate-800 font-medium text-sm">
                      {touchpoint.title || touchpoint.type}
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {format(date, 'MMM d, yyyy')}
                    </div>
                  </div>
                  {touchpoint.data?.description && (
                    <div className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {touchpoint.data.description as string}
                    </div>
                  )}
                  {touchpoint.duration_minutes && (
                    <div className="text-xs text-slate-500 mt-1">
                      Duration: {Math.floor(touchpoint.duration_minutes / 60)}h {touchpoint.duration_minutes % 60}m
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {selectedTouchpointId && (
        <InteractionDetailView
          touchpointId={selectedTouchpointId}
          onBack={() => setSelectedTouchpointId(null)}
        />
      )}
    </>
  )
}

