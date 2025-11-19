/**
 * Service for generating weekly relationship summaries
 */

import { SummaryAnalyticsService } from './summary-analytics.service'
import { AgentService } from '../agents/agent.service'
import type { WeeklySummaryInput, WeeklySummaryResult } from '@/types/summaries'

export class WeeklySummaryService {
  private analyticsService: SummaryAnalyticsService
  private agentService: AgentService

  constructor() {
    this.analyticsService = new SummaryAnalyticsService()
    this.agentService = new AgentService()
  }

  /**
   * Generate weekly summary
   */
  async generateWeeklySummary(
    userId: string,
    input: WeeklySummaryInput = {}
  ): Promise<WeeklySummaryResult> {
    // Calculate date range (default: past 7 days)
    const endDate = input.endDate || new Date()
    const startDate = input.startDate || new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Calculate metrics
    const { stats, relationships, insights } = await this.analyticsService.calculateWeeklyMetrics(
      userId,
      startDate,
      endDate
    )

    // Generate short insights instead of long narrative
    const shortInsights = this.generateShortInsights(stats, relationships, insights)

    return {
      weekStart: startDate,
      weekEnd: endDate,
      stats,
      relationships,
      insights: {
        ...insights,
        shortInsights, // Add short insights to insights object
      },
      narrative: undefined, // No longer using narrative
      generatedAt: new Date(),
    }
  }

  /**
   * Generate short, snappy insights
   */
  private generateShortInsights(
    stats: any,
    relationships: any[],
    insights: any
  ): string[] {
    const insightsList: string[] = []

    // Interaction count insights
    if (stats.totalMeetings > 0) {
      const friendInteractions = relationships.filter(r => r.category === 'friend').reduce((sum, r) => sum + r.interactionCount, 0)
      if (friendInteractions > 0) {
        insightsList.push(`You had ${friendInteractions} interaction${friendInteractions !== 1 ? 's' : ''} with friends this week`)
      }

      // Meal-related insights
      const mealKeywords = ['lunch', 'dinner', 'breakfast', 'brunch', 'coffee', 'food', 'meal', 'eat']
      const mealInteractions = relationships.filter(r => {
        const hasMealKeyword = r.meetingTypes && Object.keys(r.meetingTypes).some(type => 
          mealKeywords.some(keyword => type.toLowerCase().includes(keyword))
        )
        return hasMealKeyword && r.interactionCount > 0
      })
      
      if (mealInteractions.length > 0) {
        const totalMeals = mealInteractions.reduce((sum, r) => {
          const mealCount = Object.entries(r.meetingTypes || {}).reduce((s, [type, count]) => {
            return mealKeywords.some(kw => type.toLowerCase().includes(kw)) ? s + (count as number) : s
          }, 0)
          return sum + mealCount
        }, 0)
        if (totalMeals > 0) {
          insightsList.push(`You ate ${totalMeals} meal${totalMeals !== 1 ? 's' : ''} with friends this week`)
        }
      }

      // Time spent insights
      const hoursSpent = Math.round(stats.totalTimeMinutes / 60)
      if (hoursSpent > 0) {
        insightsList.push(`You spent ${hoursSpent} hour${hoursSpent !== 1 ? 's' : ''} this week connecting with people`)
      }

      // Specific activity insights
      const topRelationship = relationships.sort((a, b) => b.totalTimeMinutes - a.totalTimeMinutes)[0]
      if (topRelationship && topRelationship.interactionCount > 0) {
        const personName = topRelationship.personName || 'a friend'
        // Try to find a specific activity
        const activities = Object.entries(topRelationship.meetingTypes || {})
          .filter(([type]) => !['calendar', 'call', 'message'].includes(type.toLowerCase()))
          .map(([type]) => type)
        
        if (activities.length > 0) {
          const activity = activities[0].replace(/_/g, ' ')
          insightsList.push(`You ${activity} with ${personName} this week`)
        } else if (topRelationship.interactionCount > 1) {
          insightsList.push(`You connected ${topRelationship.interactionCount} times with ${personName} this week`)
        }
      }

      // People count
      if (stats.uniquePeopleCount > 0) {
        insightsList.push(`You connected with ${stats.uniquePeopleCount} ${stats.uniquePeopleCount === 1 ? 'person' : 'people'} this week`)
      }
    }

    return insightsList.slice(0, 5) // Limit to 5 insights
  }

  /**
   * Generate LLM narrative summary
   */
  private async generateNarrative(
    userId: string,
    stats: any,
    relationships: any[],
    insights: any
  ): Promise<string> {
    // Prepare context for LLM
    const context = {
      stats: {
        totalMeetings: stats.totalMeetings,
        totalTimeMinutes: stats.totalTimeMinutes,
        uniquePeopleCount: stats.uniquePeopleCount,
        averageMeetingDurationMinutes: Math.round(stats.averageMeetingDurationMinutes),
        categoryBreakdown: stats.categoryBreakdown,
      },
      topRelationships: insights.topRelationships.map((r: any) => ({
        name: r.personName || 'Unknown',
        interactionCount: r.interactionCount,
        totalTimeMinutes: r.totalTimeMinutes,
        category: r.category,
      })),
      relationshipHealth: insights.relationshipHealth,
      patterns: insights.patterns,
      mostActiveDay: insights.mostActiveDay,
    }

    // Build prompt for summary agent
    const prompt = this.buildSummaryPrompt(context)

    try {
      // Use AgentService with 'summary' agent type
      const response = await this.agentService.getAdvice(
        userId,
        prompt,
        'summary',
        {
          includeRelationships: false, // We're providing our own context
          includeTouchpoints: false,
          includePastConversations: false,
        }
      )

      return response.response
    } catch (error: any) {
      console.error('Failed to generate narrative:', error)
      // Return a fallback summary if LLM fails
      return this.generateFallbackNarrative(context)
    }
  }

  /**
   * Build prompt for summary agent
   */
  private buildSummaryPrompt(context: any): string {
    return `Generate a warm, insightful weekly relationship summary based on the following data:

**Quantitative Summary:**
- Total meaningful meetings: ${context.stats.totalMeetings}
- Total time spent: ${Math.round(context.stats.totalTimeMinutes / 60)} hours
- Unique people interacted with: ${context.stats.uniquePeopleCount}
- Average meeting duration: ${context.stats.averageMeetingDurationMinutes} minutes

**Top Relationships:**
${context.topRelationships.map((r: any, i: number) => 
  `${i + 1}. ${r.name}: ${r.interactionCount} interactions, ${Math.round(r.totalTimeMinutes / 60)} hours (${r.category})`
).join('\n')}

**Relationship Health:**
- Strong connections: ${context.relationshipHealth.strong}
- Moderate connections: ${context.relationshipHealth.moderate}
- Weak connections: ${context.relationshipHealth.weak}

**Patterns Observed:**
${context.patterns.length > 0 ? context.patterns.map((p: string) => `- ${p}`).join('\n') : '- No specific patterns detected'}

**Most Active Day:** ${context.mostActiveDay || 'N/A'}

Please provide a thoughtful, encouraging summary that:
1. Highlights positive relationship patterns
2. Notes any areas for improvement
3. Celebrates the time invested in meaningful connections
4. Provides gentle suggestions for maintaining relationships

Keep the tone warm, supportive, and non-judgmental.`
  }

  /**
   * Generate fallback narrative if LLM fails
   */
  private generateFallbackNarrative(context: any): string {
    const hours = Math.round(context.stats.totalTimeMinutes / 60)
    const people = context.stats.uniquePeopleCount
    
    let narrative = `This week, you had ${context.stats.totalMeetings} meaningful interactions with ${people} ${people === 1 ? 'person' : 'people'}, spending approximately ${hours} ${hours === 1 ? 'hour' : 'hours'} together.`

    if (context.topRelationships.length > 0) {
      narrative += ` Your most active connections were ${context.topRelationships.slice(0, 3).map((r: any) => r.name).join(', ')}.`
    }

    if (context.relationshipHealth.strong > 0) {
      narrative += ` You maintained ${context.relationshipHealth.strong} strong ${context.relationshipHealth.strong === 1 ? 'connection' : 'connections'} this week.`
    }

    if (context.patterns.length > 0) {
      narrative += ` ${context.patterns[0]}.`
    }

    return narrative
  }
}

