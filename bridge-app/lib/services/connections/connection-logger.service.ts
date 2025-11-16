/**
 * Service for logging manual connections
 */

import { RelationshipService } from '../relationships/relationship.service'
import { TouchpointRepository } from '@/lib/repositories/touchpoint.repository'
import type { LogConnectionInput, LogConnectionResult } from '@/types/connections'

export class ConnectionLoggerService {
  private relationshipService: RelationshipService
  private touchpointRepository: TouchpointRepository

  constructor() {
    this.relationshipService = new RelationshipService()
    this.touchpointRepository = new TouchpointRepository()
  }

  /**
   * Validate connection input
   */
  private validateInput(input: LogConnectionInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Name is required')
    }

    if (!input.method || input.method.trim().length === 0) {
      throw new Error('Method is required')
    }
  }

  /**
   * Log a connection
   */
  async logConnection(
    userId: string,
    input: LogConnectionInput
  ): Promise<LogConnectionResult> {
    // Validate input
    this.validateInput(input)

    // Find or create person by name (case-insensitive)
    const person = await this.relationshipService.findOrCreatePersonByName(
      input.name.trim()
    )

    // Ensure relationship exists
    const relationship = await this.relationshipService.ensureRelationship(
      userId,
      person.id
    )

    // Create touchpoint
    // Handle occurredAt: if null/undefined, store as null (user can update later)
    const occurredAt = input.occurredAt !== null && input.occurredAt !== undefined
      ? input.occurredAt
      : null

    const touchpoint = await this.touchpointRepository.createTouchpoint({
      userId,
      relationshipId: relationship.id,
      type: 'note',
      source: 'manual',
      occurredAt,
      title: `Connection with ${input.name}`,
      data: {
        method: input.method.trim(),
        description: input.description?.trim(),
      },
    })

    return {
      touchpoint,
      relationship,
      person,
    }
  }
}

