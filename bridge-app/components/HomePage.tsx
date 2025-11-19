'use client'

import { useState } from 'react'
import { useRelationships } from "@/lib/hooks/use-relationships"
import { useTouchpoints } from "@/lib/hooks/use-touchpoints"
import { useCalendarStatus } from "@/lib/hooks/use-calendar-status"
import { useProfile } from "@/lib/hooks/use-profile"
import { useWeeklySummary } from "@/lib/hooks/use-weekly-summary"
import { apiGet } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import type { CalendarStatusResponse } from "@/lib/api/types"
import { Contact, Interaction } from "@/types/frontend"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import {
  MessageCircle,
  Calendar,
  Camera,
  Users,
  UserPlus,
  Sparkles,
  PenLine,
  Settings,
  Link,
} from "lucide-react"
import { AddContactDialog } from "./AddContactDialog"
import { SummaryView } from "./SummaryView"
import { EventCard } from "./calendar/EventCard"
import { InteractionDetailView } from "./interactions/InteractionDetailView"
import { Dialog, DialogContent } from "./ui/dialog"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import type { Touchpoint } from "@/types/database"
import { format } from "date-fns"

interface HomePageProps {
  onNavigate?: (
    page: "home" | "logger" | "advice" | "settings" | "contacts",
  ) => void
  onAddContact?: (contact: Contact) => void
}

export function HomePage({
  onNavigate,
  onAddContact,
}: HomePageProps) {
  const router = useRouter()
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null)
  
  // Fetch data
  const { data: profile } = useProfile()
  const { data: relationshipsData, isLoading: relationshipsLoading } = useRelationships({ limit: 100 })
  const { data: touchpointsData, isLoading: touchpointsLoading } = useTouchpoints({ limit: 100 })
  const { data: calendarStatus } = useQuery({
    queryKey: ['calendar-status'],
    queryFn: async () => {
      return apiGet<CalendarStatusResponse>(API_ENDPOINTS.calendarStatus)
    },
  })

  // Calculate date range for weekly summary (past 7 days)
  const weeklyEndDate = new Date()
  const weeklyStartDate = new Date()
  weeklyStartDate.setDate(weeklyEndDate.getDate() - 7)
  
  const { data: weeklySummary } = useWeeklySummary({
    startDate: weeklyStartDate.toISOString(),
    endDate: weeklyEndDate.toISOString(),
    includeNarrative: false,
  })

  // Extract user name for greeting
  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'there'

  // Transform data to match component expectations
  const contacts: Contact[] = (relationshipsData?.relationships || []).map((rel) => ({
    id: rel.person_id,
    name: rel.person?.name || 'Unknown',
    relationship: rel.metadata?.relationship as string | undefined,
  }))

  const interactions: Interaction[] = (touchpointsData?.touchpoints || []).map((tp) => ({
    id: tp.id,
    contactId: tp.relationship_id || '',
    contactName: contacts.find(c => c.id === tp.relationship_id)?.name || 'Unknown',
    method: tp.title || tp.type,
    description: tp.data?.description as string | undefined,
    date: tp.occurred_at ? new Date(tp.occurred_at) : new Date(tp.created_at),
    source: tp.source,
  }))

  // Filter calendar events for today only
  const today = new Date()
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  // Get touchpoint data for today's calendar events
  const calendarTouchpointsToday: Touchpoint[] = (touchpointsData?.touchpoints || [])
    .filter(tp => {
      if (tp.source !== 'google_calendar') return false
      const eventDate = tp.occurred_at ? new Date(tp.occurred_at) : new Date(tp.created_at)
      return eventDate >= todayStart && eventDate <= todayEnd
    })
    .sort((a, b) => {
      const aDate = a.occurred_at ? new Date(a.occurred_at).getTime() : new Date(a.created_at).getTime()
      const bDate = b.occurred_at ? new Date(b.occurred_at).getTime() : new Date(b.created_at).getTime()
      return aDate - bDate // Sort chronologically for today
    })

  const isCalendarConnected = calendarStatus?.connected || false

  const isLoading = relationshipsLoading || touchpointsLoading

  // Calculate week date range
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 7)

  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() - 7)

  const interactionsThisWeek = interactions.filter(
    (i) => i.date >= thisWeek,
  )

  // Get recent interactions for the Recent Connections section
  const recentInteractions = (touchpointsData?.touchpoints || [])
    .map((tp) => ({
      id: tp.id,
      title: tp.title || tp.type || 'Untitled Event',
      contactName: contacts.find(c => c.id === tp.relationship_id)?.name || 'Unknown',
      date: tp.occurred_at ? new Date(tp.occurred_at) : new Date(tp.created_at),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const handleNavigate = (page: "home" | "logger" | "advice" | "settings" | "contacts") => {
    if (onNavigate) {
      onNavigate(page)
    } else {
      router.push(`/${page === 'home' ? '' : page}`)
    }
  }

  const handleCalendarConnect = () => {
    window.location.href = API_ENDPOINTS.calendarConnect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-white/30 bg-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1
              className="text-3xl text-slate-800"
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
              }}
            >
              bridge
            </h1>
            <div className="flex gap-6">
              <button
                onClick={() => handleNavigate("logger")}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                Log Connection
              </button>
              <button
                onClick={() => handleNavigate("advice")}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                Get Advice
              </button>
              <button
                onClick={() => handleNavigate("contacts")}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                Contacts
              </button>
            </div>
          </div>
          <button
            onClick={() => handleNavigate("settings")}
            className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/60 transition-all border border-white/50"
          >
            <Settings className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <h2
            className="text-6xl text-slate-800 mb-4"
            style={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
            }}
          >
            Hi {userName}!
          </h2>
          <p className="text-xl text-slate-600">
            Week of {formatDate(weekStart)} -{" "}
            {formatDate(today)}
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary Stats */}
            <div>
              <h3
                className="text-3xl text-slate-800 mb-6"
                style={{
                  fontFamily: "Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                Summary
              </h3>

              <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-sky-400" />
                    <div className="text-4xl text-slate-800 mb-2">
                      {interactionsThisWeek.length}
                    </div>
                    <div className="text-slate-600">
                      connections
                    </div>
                    <div className="text-slate-500">
                      this week
                    </div>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-sky-400" />
                    <div className="text-4xl text-slate-800 mb-2">
                      {contacts.length}
                    </div>
                    <div className="text-slate-600">
                      close friends
                    </div>
                    <div className="text-slate-500">
                      in your circle
                    </div>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <Camera className="w-12 h-12 mx-auto mb-4 text-sky-400" />
                    <div className="text-4xl text-slate-800 mb-2">
                      {interactions.length}
                    </div>
                    <div className="text-slate-600">total</div>
                    <div className="text-slate-500">
                      interactions
                    </div>
                  </div>
                </div>

                {/* Weekly Insights */}
                {weeklySummary && weeklySummary.shortInsights && weeklySummary.shortInsights.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-white/30">
                    <h4 className="text-lg text-slate-800 mb-4 font-semibold">Weekly Insights</h4>
                    <div className="space-y-3">
                      {weeklySummary.shortInsights.map((insight, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/50"
                        >
                          <p className="text-slate-700">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Daily Digest and Recent Connections - Side by Side */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Daily Digest */}
              <div>
                <h3
                  className="text-3xl text-slate-800 mb-6"
                  style={{
                    fontFamily: "Georgia, serif",
                    fontStyle: "italic",
                  }}
                >
                  Daily Digest
                </h3>

                {isCalendarConnected ? (
                  calendarTouchpointsToday.length > 0 ? (
                    <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
                      <div className="flex items-center gap-3 mb-6">
                        <Calendar className="w-6 h-6 text-sky-400" />
                        <h4 className="text-xl text-slate-800 font-semibold">Today's Events</h4>
                      </div>
                      <div className="space-y-4">
                        {calendarTouchpointsToday.map((touchpoint) => {
                          const contactName = contacts.find(c => c.id === touchpoint.relationship_id)?.name
                          return (
                            <EventCard
                              key={touchpoint.id}
                              event={touchpoint}
                              contactName={contactName}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-6 h-6 text-sky-400" />
                        <h4 className="text-xl text-slate-800 font-semibold">Today's Events</h4>
                      </div>
                      <p className="text-slate-600 mt-4">Your calendar is empty</p>
                    </div>
                  )
                ) : (
                  <button 
                    onClick={handleCalendarConnect}
                    className="w-full bg-white/40 backdrop-blur-md rounded-3xl p-12 shadow-lg border border-white/50 hover:bg-white/50 transition-all group"
                  >
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-sky-400 group-hover:scale-110 transition-transform" />
                    <div className="text-slate-700 text-xl mb-2">
                      Link your calendar
                    </div>
                    <div className="text-slate-500">
                      Connect your calendar to sync events
                    </div>
                  </button>
                )}
              </div>

              {/* Recent Connections */}
              <div>
                <h3
                  className="text-3xl text-slate-800 mb-6"
                  style={{
                    fontFamily: "Georgia, serif",
                    fontStyle: "italic",
                  }}
                >
                  Recent Connections
                </h3>

                {recentInteractions.length > 0 ? (
                  <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
                    <div className="space-y-3">
                      {recentInteractions.map((interaction) => (
                        <button
                          key={interaction.id}
                          onClick={() => setSelectedInteractionId(interaction.id)}
                          className="w-full flex items-center justify-between p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white/80 transition-all text-left"
                        >
                          <div className="flex-1">
                            <div className="text-slate-900 font-medium">{interaction.title}</div>
                            {interaction.contactName !== 'Unknown' && (
                              <div className="text-slate-600 text-sm">{interaction.contactName}</div>
                            )}
                          </div>
                          <div className="text-slate-500 text-sm ml-4">
                            {format(interaction.date, 'MMM d')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
                    <p className="text-slate-600">No recent connections</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary with Weekly Insights integrated */}
            <div>
              <SummaryView showWeeklySummary={true} />
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-8">
            <div>
              <h3
                className="text-3xl text-slate-800 mb-6"
                style={{
                  fontFamily: "Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                Quick Actions
              </h3>

              <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-white/50 space-y-4">
                <button
                  onClick={() => handleNavigate("logger")}
                  className="w-full bg-white/60 backdrop-blur-sm rounded-2xl p-5 flex items-center gap-4 hover:bg-white/80 transition-all text-left"
                >
                  <PenLine className="w-6 h-6 text-slate-700 flex-shrink-0" />
                  <span className="text-slate-700">
                    Log a connection
                  </span>
                </button>

                <button
                  onClick={() => handleNavigate("advice")}
                  className="w-full bg-white/60 backdrop-blur-sm rounded-2xl p-5 flex items-center gap-4 hover:bg-white/80 transition-all text-left"
                >
                  <Sparkles className="w-6 h-6 text-slate-700 flex-shrink-0" />
                  <span className="text-slate-700">
                    Get advice
                  </span>
                </button>

                <div className="w-full bg-white/60 backdrop-blur-sm rounded-2xl p-5 flex items-center gap-4">
                  <UserPlus className="w-6 h-6 text-slate-700 flex-shrink-0" />
                  <div className="flex-1">
                    <AddContactDialog
                      onAddContact={onAddContact || (() => {})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interaction Detail Dialog */}
      <Dialog open={selectedInteractionId !== null} onOpenChange={(open) => !open && setSelectedInteractionId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md data-[state=open]:zoom-in-[0.98] data-[state=closed]:zoom-out-[0.98]">
          {selectedInteractionId && (
            <div className="p-0">
              <InteractionDetailView
                touchpointId={selectedInteractionId}
                onBack={() => setSelectedInteractionId(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
