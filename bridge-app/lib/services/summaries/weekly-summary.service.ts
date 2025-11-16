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

    // Generate narrative if requested
    let narrative: string | undefined
    if (input.includeNarrative) {
      narrative = await this.generateNarrative(userId, stats, relationships, insights)
    }

    return {
      weekStart: startDate,
      weekEnd: endDate,
      stats,
      relationships,
      insights,
      narrative,
      generatedAt: new Date(),
    }
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
      const response = await this.agentService.getAdvice(userId, {
        agentName: 'summary',
        message: prompt,
        contextOptions: {
          includeRelationships: false, // We're providing our own context
          includeTouchpoints: false,
          includeConversations: false,
        },
      })

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

