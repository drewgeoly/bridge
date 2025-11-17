'use client'

import { useRelationships } from "@/lib/hooks/use-relationships"
import { useTouchpoints } from "@/lib/hooks/use-touchpoints"
import { useCalendarStatus } from "@/lib/hooks/use-calendar-status"
import { useProfile } from "@/lib/hooks/use-profile"
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
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

interface HomePageProps {
  onNavigate?: (
    page: "home" | "logger" | "advice" | "settings",
  ) => void
  onAddContact?: (contact: Contact) => void
}

export function HomePage({
  onNavigate,
  onAddContact,
}: HomePageProps) {
  const router = useRouter()
  
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
  }))

  const isLoading = relationshipsLoading || touchpointsLoading

  // Calculate week date range
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 7)

  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() - 7)

  const interactionsThisWeek = interactions.filter(
    (i) => i.date >= thisWeek,
  )

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const handleNavigate = (page: "home" | "logger" | "advice" | "settings") => {
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

                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/60"></div>
                  <div className="w-2 h-2 rounded-full bg-white/30"></div>
                  <div className="w-2 h-2 rounded-full bg-white/30"></div>
                </div>
              </div>
            </div>

            {/* Weekly Summary */}
            <div>
              <h3
                className="text-3xl text-slate-800 mb-6"
                style={{
                  fontFamily: "Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                Weekly Summary
              </h3>

              <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
                <SummaryView showWeeklySummary={true} />
              </div>
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
    </div>
  )
}
