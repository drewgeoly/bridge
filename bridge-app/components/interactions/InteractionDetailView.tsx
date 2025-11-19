'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NotesSection } from './NotesSection'
import { ArrowLeft, Calendar, MapPin, Clock, Users, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { Touchpoint } from '@/types/database'

interface InteractionDetailViewProps {
  touchpointId: string
  onBack?: () => void
}

interface Note {
  text: string
  question?: string
  createdAt: number
}

export function InteractionDetailView({ touchpointId, onBack }: InteractionDetailViewProps) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState<Note[]>([])

  // Fetch touchpoint details
  const { data: touchpoint, isLoading } = useQuery({
    queryKey: ['touchpoint', touchpointId],
    queryFn: async () => {
      const response = await fetch(`${API_ENDPOINTS.touchpoints}?limit=1000`)
      if (!response.ok) throw new Error('Failed to fetch touchpoint')
      const data = await response.json()
      return data.touchpoints.find((tp: Touchpoint) => tp.id === touchpointId)
    },
  })

  // Load notes from touchpoint data
  useEffect(() => {
    if (touchpoint?.data?.notes && Array.isArray(touchpoint.data.notes)) {
      setNotes(touchpoint.data.notes)
    }
  }, [touchpoint])

  const addNoteMutation = useMutation({
    mutationFn: async (note: { text: string; question?: string }) => {
      const updatedNotes = [
        ...notes,
        {
          ...note,
          createdAt: Date.now(),
        },
      ]

      const response = await fetch(`${API_ENDPOINTS.touchpoints}/${touchpointId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            ...touchpoint?.data,
            notes: updatedNotes,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add note')
      }

      return response.json()
    },
    onSuccess: (data) => {
      setNotes(data.data?.notes || [])
      queryClient.invalidateQueries({ queryKey: ['touchpoint', touchpointId] })
      queryClient.invalidateQueries({ queryKey: ['touchpoints'] })
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: async (index: number) => {
      const updatedNotes = notes.filter((_, i) => i !== index)

      const response = await fetch(`${API_ENDPOINTS.touchpoints}/${touchpointId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            ...touchpoint?.data,
            notes: updatedNotes,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete note')
      }

      return response.json()
    },
    onSuccess: (data) => {
      setNotes(data.data?.notes || [])
      queryClient.invalidateQueries({ queryKey: ['touchpoint', touchpointId] })
      queryClient.invalidateQueries({ queryKey: ['touchpoints'] })
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  if (!touchpoint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Interaction not found</p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    )
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
    if (!touchpoint.occurred_at || !touchpoint.duration_minutes) return null
    const endTime = new Date(touchpoint.occurred_at)
    endTime.setMinutes(endTime.getMinutes() + touchpoint.duration_minutes)
    return endTime
  }

  const startTime = touchpoint.occurred_at ? new Date(touchpoint.occurred_at) : null
  const endTime = getEndTime()
  const location = touchpoint.data?.location as string | undefined
  const description = touchpoint.data?.description as string | undefined
  const htmlLink = touchpoint.data?.htmlLink as string | undefined
  const attendees = touchpoint.data?.attendees as Array<{ email?: string; displayName?: string }> | undefined
  const people = touchpoint.data?.people as Array<{ name: string; email?: string }> | undefined

  return (
    <div>
      {/* Navigation - Only show if not in dialog (when onBack is provided, we're in a dialog) */}
      {!onBack && (
        <nav className="border-b border-white/30 bg-white/20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1
                className="text-3xl text-slate-800"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                }}
              >
                bridge
              </h1>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className={onBack ? 'px-0 py-0' : 'max-w-4xl mx-auto px-8 py-12'}>
        {/* Interaction Header */}
        <Card className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 mb-8">
          <h2 className="text-3xl text-slate-800 font-semibold mb-2">
            {touchpoint.title || 'Untitled Interaction'}
          </h2>
          {startTime && (
            <p className="text-slate-600 mb-6">{formatDate(startTime)}</p>
          )}

          <div className="space-y-4">
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
                  {touchpoint.duration_minutes && (
                    <div className="text-sm text-slate-600">
                      Duration: {formatDuration(touchpoint.duration_minutes)}
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
            {people && people.length > 0 && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-slate-800 font-medium mb-2">People</div>
                  <div className="space-y-1">
                    {people.map((person, index) => (
                      <div key={index} className="text-slate-700 text-sm">
                        {person.name}
                        {person.email && (
                          <span className="text-slate-500 ml-2">({person.email})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Attendees */}
            {attendees && attendees.length > 0 && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-slate-800 font-medium mb-2">Attendees</div>
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
        </Card>

        {/* Notes Section */}
        <Card className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50">
          <NotesSection
            notes={notes}
            onAddNote={async (note) => {
              await addNoteMutation.mutateAsync(note)
            }}
            onDeleteNote={async (index) => {
              await deleteNoteMutation.mutateAsync(index)
            }}
          />
        </Card>
      </div>
    </div>
  )
}

