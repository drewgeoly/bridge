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
    includeNarrative: showWeeklySummary,
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
      {/* Weekly Summary Section */}
      {showWeeklySummary && weeklySummary && (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/50">
          <h3
            className="text-2xl text-slate-800 mb-6"
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            Weekly Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/50">
              <CalendarIcon className="w-6 h-6 text-sky-600 mx-auto mb-2" />
              <div className="text-2xl text-slate-900 font-semibold">
                {weeklySummary.totalMeetings || 0}
              </div>
              <div className="text-sm text-slate-600">Meetings</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/50">
              <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl text-slate-900 font-semibold">
                {Math.round((weeklySummary.totalTimeMinutes || 0) / 60)}h
                {(weeklySummary.totalTimeMinutes || 0) % 60 > 0 && (
                  <span className="text-lg"> {Math.round((weeklySummary.totalTimeMinutes || 0) % 60)}m</span>
                )}
              </div>
              <div className="text-sm text-slate-600">Time Spent</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/50">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl text-slate-900 font-semibold">
                {weeklySummary.uniquePeople || 0}
              </div>
              <div className="text-sm text-slate-600">People</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/50">
              <MessageCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl text-slate-900 font-semibold">
                {Math.round(weeklySummary.averageDurationMinutes || 0)}m
              </div>
              <div className="text-sm text-slate-600">Avg Duration</div>
            </div>
          </div>

          {/* Weekly Narrative */}
          {weeklySummary.narrative && (
            <div className="mt-6 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/50">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {weeklySummary.narrative}
              </p>
            </div>
          )}

          {/* Relationship Metrics */}
          {weeklySummary.relationshipMetrics && weeklySummary.relationshipMetrics.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg text-slate-800 mb-3 font-semibold">Top Relationships</h4>
              <div className="space-y-2">
                {weeklySummary.relationshipMetrics.slice(0, 5).map((metric) => (
                  <div
                    key={metric.personId}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-white/50"
                  >
                    <div>
                      <div className="text-slate-900 font-medium">
                        {metric.personName || 'Unknown'}
                      </div>
                      <div className="text-sm text-slate-600">
                        {metric.meetingCount} meeting{metric.meetingCount !== 1 ? 's' : ''} •{' '}
                        {Math.round(metric.totalTimeMinutes / 60)}h{' '}
                        {metric.totalTimeMinutes % 60}m
                      </div>
                    </div>
                    {metric.lastInteraction && (
                      <div className="text-sm text-slate-500">
                        {format(new Date(metric.lastInteraction), 'MMM d')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-100">
          <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-slate-900 font-semibold">{relationships.length}</div>
          <div className="text-slate-600 text-sm">Contacts</div>
        </div>
        <div className="text-center p-4 rounded-lg bg-green-50 border border-green-100">
          <CalendarIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <div className="text-slate-900 font-semibold">{interactionsThisMonth}</div>
          <div className="text-slate-600 text-sm">This Month</div>
        </div>
        <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-100">
          <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <div className="text-slate-900 font-semibold">{touchpoints.length}</div>
          <div className="text-slate-600 text-sm">Total</div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentInteractions.length > 0 && (
        <div>
          <h3 className="text-slate-700 mb-3 font-semibold">Recent Connections</h3>
          <div className="space-y-2">
            {recentInteractions.map((interaction) => (
              <div
                key={interaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div>
                  <div className="text-slate-900 font-medium">{interaction.contactName}</div>
                  <div className="text-slate-600 text-sm">{interaction.method}</div>
                </div>
                <div className="text-slate-500 text-sm">
                  {format(interaction.date, 'MMM d')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentInteractions.length === 0 && (
        <div className="text-center p-8 text-slate-500">
          No interactions logged yet. Start by logging your first connection!
        </div>
      )}
    </div>
  )
}
