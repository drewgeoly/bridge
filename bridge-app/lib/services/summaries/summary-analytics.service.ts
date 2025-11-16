/**
 * Service for calculating weekly relationship metrics and analytics
 */

import { createClient } from '@/lib/supabase/server'
import { TouchpointRepository } from '@/lib/repositories/touchpoint.repository'
import { EventFilterService } from './event-filter.service'
import type { RelationshipMetrics, InteractionStats, WeeklyInsights } from '@/types/summaries'
import type { Touchpoint, Relationship } from '@/types/database'

export class SummaryAnalyticsService {
  private touchpointRepository: TouchpointRepository
  private eventFilter: EventFilterService

  constructor() {
    this.touchpointRepository = new TouchpointRepository()
    this.eventFilter = new EventFilterService()
  }

  /**
   * Calculate weekly metrics for all relationships
   */
  async calculateWeeklyMetrics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    stats: InteractionStats
    relationships: RelationshipMetrics[]
    insights: WeeklyInsights
  }> {
    // Fetch all touchpoints in date range
    const allTouchpoints = await this.touchpointRepository.findByDateRange(
      userId,
      startDate,
      endDate
    )

    // Filter meaningful events
    const meaningfulTouchpoints = allTouchpoints.filter((tp) =>
      this.eventFilter.isMeaningfulEvent(tp)
    )

    // Group touchpoints by relationship
    const touchpointsByRelationship = new Map<string, Touchpoint[]>()
    for (const tp of meaningfulTouchpoints) {
      if (tp.relationship_id) {
        const existing = touchpointsByRelationship.get(tp.relationship_id) || []
        existing.push(tp)
        touchpointsByRelationship.set(tp.relationship_id, existing)
      }
    }

    // Get relationship details
    const supabase = await createClient()
    const relationshipIds = Array.from(touchpointsByRelationship.keys())
    
    let relationships: Relationship[] = []
    if (relationshipIds.length > 0) {
      const { data, error } = await supabase
        .from('relationships')
        .select(`
          *,
          people!inner(*)
        `)
        .in('id', relationshipIds)
        .eq('user_id', userId)

      if (!error && data) {
        relationships = data as Relationship[]
      }
    }

    // Calculate per-relationship metrics
    const relationshipMetrics: RelationshipMetrics[] = []
    for (const relationship of relationships) {
      const touchpoints = touchpointsByRelationship.get(relationship.id) || []
      const metrics = this.getRelationshipMetrics(relationship, touchpoints)
      relationshipMetrics.push(metrics)
    }

    // Calculate aggregated stats
    const stats = this.calculateInteractionStats(meaningfulTouchpoints, relationshipMetrics)

    // Generate insights
    const insights = this.generateInsights(relationshipMetrics, meaningfulTouchpoints)

    return {
      stats,
      relationships: relationshipMetrics,
      insights,
    }
  }

  /**
   * Get metrics for a specific relationship
   */
  getRelationshipMetrics(
    relationship: Relationship,
    touchpoints: Touchpoint[]
  ): RelationshipMetrics {
    const person = (relationship as any).people

    const interactionCount = touchpoints.length
    const totalTimeMinutes = touchpoints.reduce(
      (sum, tp) => sum + (tp.duration_minutes || 0),
      0
    )
    const averageDurationMinutes =
      interactionCount > 0 ? totalTimeMinutes / interactionCount : 0

    // Get last interaction date
    const lastInteraction = touchpoints
      .map((tp) => tp.occurred_at)
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0]

    // Count meeting types
    const meetingTypes: Record<string, number> = {}
    for (const tp of touchpoints) {
      meetingTypes[tp.type] = (meetingTypes[tp.type] || 0) + 1
    }

    // Categorize relationship
    const category = this.eventFilter.categorizeRelationship(touchpoints)

    return {
      relationshipId: relationship.id,
      personId: relationship.person_id,
      personName: person?.name,
      personEmail: person?.email,
      interactionCount,
      totalTimeMinutes,
      lastInteractionDate: lastInteraction,
      averageDurationMinutes,
      meetingTypes,
      category,
    }
  }

  /**
   * Calculate aggregated interaction statistics
   */
  private calculateInteractionStats(
    touchpoints: Touchpoint[],
    relationshipMetrics: RelationshipMetrics[]
  ): InteractionStats {
    const totalMeetings = touchpoints.length
    const totalTimeMinutes = touchpoints.reduce(
      (sum, tp) => sum + (tp.duration_minutes || 0),
      0
    )
    const uniquePeopleCount = new Set(touchpoints.map((tp) => tp.relationship_id).filter(Boolean))
      .size
    const averageMeetingDurationMinutes =
      totalMeetings > 0 ? totalTimeMinutes / totalMeetings : 0

    // Meetings by day
    const meetingsByDay: Record<string, number> = {}
    const timeByDay: Record<string, number> = {}

    for (const tp of touchpoints) {
      if (tp.occurred_at) {
        const dateKey = tp.occurred_at.toISOString().split('T')[0]
        meetingsByDay[dateKey] = (meetingsByDay[dateKey] || 0) + 1
        timeByDay[dateKey] = (timeByDay[dateKey] || 0) + (tp.duration_minutes || 0)
      }
    }

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {}
    for (const metrics of relationshipMetrics) {
      if (metrics.category) {
        categoryBreakdown[metrics.category] =
          (categoryBreakdown[metrics.category] || 0) + metrics.interactionCount
      }
    }

    return {
      totalMeetings,
      totalTimeMinutes,
      uniquePeopleCount,
      averageMeetingDurationMinutes,
      meetingsByDay,
      timeByDay,
      categoryBreakdown,
    }
  }

  /**
   * Generate insights from metrics
   */
  private generateInsights(
    relationshipMetrics: RelationshipMetrics[],
    touchpoints: Touchpoint[]
  ): WeeklyInsights {
    // Top relationships by time spent
    const topRelationships = [...relationshipMetrics]
      .sort((a, b) => b.totalTimeMinutes - a.totalTimeMinutes)
      .slice(0, 5)

    // Most active day
    const meetingsByDay: Record<string, number> = {}
    for (const tp of touchpoints) {
      if (tp.occurred_at) {
        const dateKey = tp.occurred_at.toISOString().split('T')[0]
        meetingsByDay[dateKey] = (meetingsByDay[dateKey] || 0) + 1
      }
    }
    const mostActiveDay =
      Object.entries(meetingsByDay).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

    // Relationship health (based on interaction frequency)
    // Strong: 3+ interactions, Moderate: 1-2 interactions, Weak: 0 interactions
    const strong = relationshipMetrics.filter((m) => m.interactionCount >= 3).length
    const moderate = relationshipMetrics.filter(
      (m) => m.interactionCount >= 1 && m.interactionCount < 3
    ).length
    const weak = relationshipMetrics.filter((m) => m.interactionCount === 0).length

    // Patterns
    const patterns: string[] = []
    
    // Check for daily patterns
    const daysWithMeetings = Object.keys(meetingsByDay).length
    if (daysWithMeetings >= 5) {
      patterns.push('Consistent daily interactions')
    } else if (daysWithMeetings >= 3) {
      patterns.push('Regular weekly interactions')
    }

    // Check for relationship diversity
    if (relationshipMetrics.length >= 5) {
      patterns.push('Diverse social connections')
    }

    // Check for time distribution
    const avgTimePerDay = touchpoints.reduce((sum, tp) => sum + (tp.duration_minutes || 0), 0) / Math.max(daysWithMeetings, 1)
    if (avgTimePerDay >= 120) {
      patterns.push('Significant time invested in relationships')
    }

    return {
      topRelationships,
      mostActiveDay,
      relationshipHealth: {
        strong,
        moderate,
        weak,
      },
      patterns,
    }
  }
}

