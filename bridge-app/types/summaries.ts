/**
 * Weekly summary types
 */

/**
 * Input for generating weekly summary
 */
export interface WeeklySummaryInput {
  startDate?: Date
  endDate?: Date
  includeNarrative?: boolean
}

/**
 * Relationship metrics for a specific relationship
 */
export interface RelationshipMetrics {
  relationshipId: string
  personId: string
  personName?: string
  personEmail?: string
  interactionCount: number
  totalTimeMinutes: number
  lastInteractionDate?: Date
  averageDurationMinutes: number
  meetingTypes: Record<string, number> // e.g., { "calendar": 5, "call": 2 }
  category?: 'friend' | 'family' | 'work' | 'school' | 'other'
}

/**
 * Aggregated interaction statistics
 */
export interface InteractionStats {
  totalMeetings: number
  totalTimeMinutes: number
  uniquePeopleCount: number
  averageMeetingDurationMinutes: number
  meetingsByDay: Record<string, number> // e.g., { "2024-01-15": 3, "2024-01-16": 2 }
  timeByDay: Record<string, number> // minutes per day
  categoryBreakdown: Record<string, number> // e.g., { "friend": 10, "family": 3 }
}

/**
 * Weekly insights (qualitative)
 */
export interface WeeklyInsights {
  topRelationships: RelationshipMetrics[] // Top 5 by time spent
  mostActiveDay: string // Date string
  relationshipHealth: {
    strong: number // Count of relationships with frequent interactions
    moderate: number
    weak: number
  }
  patterns: string[] // Array of pattern descriptions
  shortInsights?: string[] // Short, snappy insights
}

/**
 * Weekly summary result
 */
export interface WeeklySummaryResult {
  weekStart: Date
  weekEnd: Date
  stats: InteractionStats
  relationships: RelationshipMetrics[]
  insights: WeeklyInsights
  narrative?: string // LLM-generated narrative (if includeNarrative=true)
  generatedAt: Date
}

