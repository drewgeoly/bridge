'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EventDetailModal } from './EventDetailModal'
import { Clock, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'
import type { Touchpoint } from '@/types/database'

interface EventCardProps {
  event: Touchpoint
  contactName?: string
}

const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
  social: { border: 'border-l-blue-500', bg: 'bg-blue-50/50', text: 'text-blue-700' },
  work: { border: 'border-l-green-500', bg: 'bg-green-50/50', text: 'text-green-700' },
  personal: { border: 'border-l-purple-500', bg: 'bg-purple-50/50', text: 'text-purple-700' },
  family: { border: 'border-l-orange-500', bg: 'bg-orange-50/50', text: 'text-orange-700' },
  other: { border: 'border-l-slate-500', bg: 'bg-slate-50/50', text: 'text-slate-700' },
}

export function EventCard({ event, contactName }: EventCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a')
  }

  const formatDate = (date: Date) => {
    return format(date, 'MMM d')
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'All Day'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${mins}m`
    }
  }

  const getEndTime = () => {
    if (!event.occurred_at || !event.duration_minutes) return null
    const endTime = new Date(event.occurred_at)
    endTime.setMinutes(endTime.getMinutes() + event.duration_minutes)
    return endTime
  }

  const startTime = event.occurred_at ? new Date(event.occurred_at) : null
  const endTime = getEndTime()
  const location = event.data?.location as string | undefined
  const description = event.data?.description as string | undefined
  const category = (event as any).category as string | undefined
  const colors = category ? categoryColors[category] : null
  const people = (event.data?.people as Array<{ id?: string; name: string; email?: string }>) || []

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <Card
        className={`bg-white/70 backdrop-blur-sm rounded-lg p-3 border-l-4 ${
          colors?.border || 'border-l-slate-300'
        } ${colors?.bg || ''} border-r border-t border-b border-white/50 hover:bg-white/90 transition-all cursor-pointer shadow-sm`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1.5">
              <div className="flex-1 min-w-0">
                <div className={`font-medium mb-0.5 truncate ${colors?.text || 'text-slate-800'}`}>
                  {contactName && contactName !== 'Unknown' ? contactName : event.title || 'Untitled Event'}
                </div>
                {event.title && contactName && contactName !== 'Unknown' && (
                  <div className="text-slate-600 text-xs mb-1">{event.title}</div>
                )}
              </div>
              {category && (
                <Badge
                  variant="outline"
                  className={`${categoryColors[category]?.bg} ${categoryColors[category]?.text} border text-xs px-1.5 py-0`}
                >
                  {category}
                </Badge>
              )}
            </div>
            {startTime && (
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {endTime ? (
                    <>
                      {formatTime(startTime)} - {formatTime(endTime)}
                    </>
                  ) : (
                    formatTime(startTime)
                  )}
                </span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{location}</span>
              </div>
            )}
            {description && (
              <div className="text-slate-600 text-xs line-clamp-2 mt-1.5">
                {description}
              </div>
            )}
            {people.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex -space-x-2">
                  {people.slice(0, 3).map((person, index) => (
                    <Avatar key={index} className="w-6 h-6 border-2 border-white">
                      <AvatarFallback className="text-xs bg-sky-100 text-sky-700">
                        {getInitials(person.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {people.length > 3 && (
                  <span className="text-xs text-slate-500 ml-1">
                    +{people.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-start gap-1 flex-shrink-0">
            {startTime && (
              <div className="text-slate-500 text-xs whitespace-nowrap">
                {formatDate(startTime)}
              </div>
            )}
          </div>
        </div>
      </Card>

      <EventDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        event={event}
      />
    </>
  )
}

