'use client'

import { useRelationships } from '@/lib/hooks/use-relationships'
import { useTouchpoints } from '@/lib/hooks/use-touchpoints'
import { useWeeklySummary } from '@/lib/hooks/use-weekly-summary'
import { Users, Calendar as CalendarIcon, TrendingUp, Clock, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'

interface SummaryViewProps {
  showWeeklySummary?: boolean
}

export function SummaryView({ showWeeklySummary = false }: SummaryViewProps) {
  const { data: relationshipsData, isLoading: relationshipsLoading } = useRelationships({ limit: 100 })
  const { data: touchpointsData, isLoading: touchpointsLoading } = useTouchpoints({ limit: 100 })
  
  // Calculate date range for weekly summary (past 7 days)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 7)
  
  const { data: weeklySummary, isLoading: weeklyLoading } = useWeeklySummary({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    includeNarrative: false, // No longer using narrative
  })

  const relationships = relationshipsData?.relationships || []
  const touchpoints = touchpointsData?.touchpoints || []
  const isLoading = relationshipsLoading || touchpointsLoading

  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()

  const interactionsThisMonth = touchpoints.filter((tp) => {
    const date = tp.occurred_at ? new Date(tp.occurred_at) : new Date(tp.created_at)
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear
  }).length

  const recentInteractions = touchpoints
    .map((tp) => ({
      id: tp.id,
      contactName: relationships.find((rel) => rel.person_id === tp.relationship_id)?.person?.name || 'Unknown',
      method: tp.title || tp.type,
      date: tp.occurred_at ? new Date(tp.occurred_at) : new Date(tp.created_at),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 3)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center p-8 text-slate-500">Loading summary...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Weekly Insights - Integrated into Summary */}
      {showWeeklySummary && weeklySummary && weeklySummary.shortInsights && weeklySummary.shortInsights.length > 0 && (
        <div>
          <h3 className="text-slate-700 mb-3 font-semibold">Weekly Insights</h3>
          <div className="space-y-2">
            {weeklySummary.shortInsights.map((insight, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-slate-50 border border-slate-100"
              >
                <p className="text-slate-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
