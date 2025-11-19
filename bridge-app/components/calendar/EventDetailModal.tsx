'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, MapPin, Clock, Users, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { EventLabelSelector, type EventCategory } from './EventLabelSelector'
import { PeopleSelector } from './PeopleSelector'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { Touchpoint } from '@/types/database'

interface EventDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Touchpoint | null
}

export function EventDetailModal({ open, onOpenChange, event }: EventDetailModalProps) {
  if (!event) return null

  const queryClient = useQueryClient()
  const [category, setCategory] = useState<EventCategory>((event as any).category || null)
  const [people, setPeople] = useState<Array<{ id?: string; name: string; email?: string }>>(
    (event.data?.people as Array<{ id?: string; name: string; email?: string }>) || []
  )

  // Sync state when event changes
  useEffect(() => {
    if (event) {
      setCategory((event as any).category || null)
      setPeople((event.data?.people as Array<{ id?: string; name: string; email?: string }>) || [])
    }
  }, [event])

  const updateCategoryMutation = useMutation({
    mutationFn: async (newCategory: EventCategory) => {
      const response = await fetch(`${API_ENDPOINTS.touchpoints}/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: newCategory }),
      })
      if (!response.ok) {
        throw new Error('Failed to update category')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['touchpoints'] })
    },
  })

  const updatePeopleMutation = useMutation({
    mutationFn: async (newPeople: Array<{ id?: string; name: string; email?: string }>) => {
      const response = await fetch(`${API_ENDPOINTS.touchpoints}/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            ...event.data,
            people: newPeople,
          },
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update people')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['touchpoints'] })
    },
  })

  const handleCategoryChange = (newCategory: EventCategory) => {
    setCategory(newCategory)
    updateCategoryMutation.mutate(newCategory)
  }

  const handlePeopleChange = (newPeople: Array<{ id?: string; name: string; email?: string }>) => {
    setPeople(newPeople)
    updatePeopleMutation.mutate(newPeople)
  }

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a')
  }

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy')
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
  const htmlLink = event.data?.htmlLink as string | undefined
  const attendees = event.data?.attendees as Array<{ email?: string; displayName?: string }> | undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 backdrop-blur-md border-white/50 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-slate-800">
            {event.title || 'Untitled Event'}
          </DialogTitle>
          <DialogDescription>
            {startTime && formatDate(startTime)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Category/Label Selector */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <EventLabelSelector
              value={category}
              onValueChange={handleCategoryChange}
              disabled={updateCategoryMutation.isPending}
            />
          </div>

          {/* Time Information */}
          {startTime && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-slate-800 font-medium">
                  {endTime ? (
                    <>
                      {formatTime(startTime)} - {formatTime(endTime)}
                    </>
                  ) : (
                    formatTime(startTime)
                  )}
                </div>
                {event.duration_minutes && (
                  <div className="text-sm text-slate-600">
                    Duration: {formatDuration(event.duration_minutes)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-slate-800">{location}</div>
              </div>
            </div>
          )}

          {/* People */}
          <div className="flex items-start gap-3">
            <PeopleSelector
              people={people}
              onPeopleChange={handlePeopleChange}
              disabled={updatePeopleMutation.isPending}
            />
          </div>

          {/* Attendees (from Google Calendar - read-only) */}
          {attendees && attendees.length > 0 && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-slate-800 font-medium mb-2">Calendar Attendees</div>
                <div className="space-y-1">
                  {attendees.map((attendee, index) => (
                    <div key={index} className="text-slate-700 text-sm">
                      {attendee.displayName || attendee.email || 'Unknown'}
                      {attendee.email && attendee.displayName && (
                        <span className="text-slate-500 ml-2">({attendee.email})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-slate-800 whitespace-pre-wrap">{description}</div>
              </div>
            </div>
          )}

          {/* Google Calendar Link */}
          {htmlLink && (
            <div className="pt-4 border-t border-slate-200">
              <a
                href={htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Calendar
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

