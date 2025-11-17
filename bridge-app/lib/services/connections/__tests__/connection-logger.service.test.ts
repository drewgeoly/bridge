/**
 * Unit tests for ConnectionLoggerService
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConnectionLoggerService } from '../connection-logger.service'
import { RelationshipService } from '../../relationships/relationship.service'
import { TouchpointRepository } from '@/lib/repositories/touchpoint.repository'
import type { TouchpointInput } from '@/types/calendar'

// Mock dependencies
vi.mock('../../relationships/relationship.service')
vi.mock('@/lib/repositories/touchpoint.repository')

describe('ConnectionLoggerService', () => {
  let service: ConnectionLoggerService
  let mockRelationshipService: any
  let mockTouchpointRepository: any

  beforeEach(() => {
    // Create mock instances
    mockRelationshipService = {
      findOrCreatePersonByName: vi.fn(),
      ensureRelationship: vi.fn(),
    }

    mockTouchpointRepository = {
      createTouchpoint: vi.fn(),
    }

    // Create constructor classes that return mock instances
    class MockRelationshipService {
      constructor() {
        return mockRelationshipService
      }
    }

    class MockTouchpointRepository {
      constructor() {
        return mockTouchpointRepository
      }
    }

    // Replace service dependencies with constructor classes
    ;(RelationshipService as any).mockImplementation(MockRelationshipService)
    ;(TouchpointRepository as any).mockImplementation(MockTouchpointRepository)

    service = new ConnectionLoggerService()
  })

  describe('logConnection', () => {
    it('should log connection with all fields', async () => {
      const userId = 'user-123'
      const input = {
        name: 'John Doe',
        method: 'call',
        description: 'Great conversation',
        occurredAt: new Date('2024-01-15T10:00:00Z'),
      }

      const mockPerson = {
        id: 'person-1',
        name: 'John Doe',
        email: null,
      }

      const mockRelationship = {
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-1',
        interaction_count: 1,
      }

      const mockTouchpoint = {
        id: 'touchpoint-1',
        user_id: userId,
        relationship_id: 'rel-1',
        type: 'note',
        source: 'manual',
        title: 'Connection with John Doe',
        data: {
          method: 'call',
          description: 'Great conversation',
        },
      }

      mockRelationshipService.findOrCreatePersonByName.mockResolvedValue(mockPerson)
      mockRelationshipService.ensureRelationship.mockResolvedValue(mockRelationship)
      mockTouchpointRepository.createTouchpoint.mockResolvedValue(mockTouchpoint)

      const result = await service.logConnection(userId, input)

      expect(result.touchpoint).toEqual(mockTouchpoint)
      expect(result.relationship).toEqual(mockRelationship)
      expect(result.person).toEqual(mockPerson)
      expect(mockRelationshipService.findOrCreatePersonByName).toHaveBeenCalledWith('John Doe')
      expect(mockRelationshipService.ensureRelationship).toHaveBeenCalledWith(userId, 'person-1')
      expect(mockTouchpointRepository.createTouchpoint).toHaveBeenCalled()
    })

    it('should log connection with common methods', async () => {
      const userId = 'user-123'
      const methods = ['text', 'call', 'facetime', 'other']

      for (const method of methods) {
        const input = {
          name: 'Test Person',
          method,
        }

        mockRelationshipService.findOrCreatePersonByName.mockResolvedValue({
          id: 'person-1',
          name: 'Test Person',
        })

        mockRelationshipService.ensureRelationship.mockResolvedValue({
          id: 'rel-1',
          user_id: userId,
          person_id: 'person-1',
        })

        mockTouchpointRepository.createTouchpoint.mockResolvedValue({
          id: 'touchpoint-1',
          data: { method },
        })

        const result = await service.logConnection(userId, input)

        expect(result.touchpoint.data?.method).toBe(method)
      }
    })

    it('should log connection with custom method', async () => {
      const userId = 'user-123'
      const input = {
        name: 'Jane Smith',
        method: 'in-person',
        description: 'Met at coffee shop',
      }

      mockRelationshipService.findOrCreatePersonByName.mockResolvedValue({
        id: 'person-1',
        name: 'Jane Smith',
      })

      mockRelationshipService.ensureRelationship.mockResolvedValue({
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-1',
      })

      mockTouchpointRepository.createTouchpoint.mockResolvedValue({
        id: 'touchpoint-1',
        data: { method: 'in-person' },
      })

      const result = await service.logConnection(userId, input)

      expect(result.touchpoint.data?.method).toBe('in-person')
    })

    it('should handle connection without description', async () => {
      const userId = 'user-123'
      const input = {
        name: 'Bob Wilson',
        method: 'text',
      }

      mockRelationshipService.findOrCreatePersonByName.mockResolvedValue({
        id: 'person-1',
        name: 'Bob Wilson',
      })

      mockRelationshipService.ensureRelationship.mockResolvedValue({
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-1',
      })

      mockTouchpointRepository.createTouchpoint.mockResolvedValue({
        id: 'touchpoint-1',
        data: { method: 'text' },
      })

      const result = await service.logConnection(userId, input)

      expect(result.touchpoint.data?.description).toBeUndefined()
    })

    it('should handle connection without occurredAt (stores null)', async () => {
      const userId = 'user-123'
      const input = {
        name: 'Alice Brown',
        method: 'call',
      }

      mockRelationshipService.findOrCreatePersonByName.mockResolvedValue({
        id: 'person-1',
        name: 'Alice Brown',
      })

      mockRelationshipService.ensureRelationship.mockResolvedValue({
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-1',
      })

      mockTouchpointRepository.createTouchpoint.mockImplementation((touchpointInput: TouchpointInput) => {
        // Verify occurredAt is null
        expect(touchpointInput.occurredAt).toBeNull()

        return Promise.resolve({
          id: 'touchpoint-1',
          occurred_at: null,
          data: { method: 'call' },
        })
      })

      await service.logConnection(userId, input)
    })

    it('should handle connection with null occurredAt', async () => {
      const userId = 'user-123'
      const input = {
        name: 'Charlie Davis',
        method: 'text',
        occurredAt: null,
      }

      mockRelationshipService.findOrCreatePersonByName.mockResolvedValue({
        id: 'person-1',
        name: 'Charlie Davis',
      })

      mockRelationshipService.ensureRelationship.mockResolvedValue({
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-1',
      })

      mockTouchpointRepository.createTouchpoint.mockImplementation((touchpointInput: TouchpointInput) => {
        // Verify occurredAt is null
        expect(touchpointInput.occurredAt).toBeNull()

        return Promise.resolve({
          id: 'touchpoint-1',
          occurred_at: null,
          data: { method: 'text' },
        })
      })

      await service.logConnection(userId, input)
    })

    it('should trim name and method', async () => {
      const userId = 'user-123'
      const input = {
        name: '  John Doe  ',
        method: '  call  ',
        description: '  description  ',
      }

      mockRelationshipService.findOrCreatePersonByName.mockResolvedValue({
        id: 'person-1',
        name: 'John Doe',
      })

      mockRelationshipService.ensureRelationship.mockResolvedValue({
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-1',
      })

      mockTouchpointRepository.createTouchpoint.mockResolvedValue({
        id: 'touchpoint-1',
      })

      await service.logConnection(userId, input)

      expect(mockRelationshipService.findOrCreatePersonByName).toHaveBeenCalledWith('John Doe')
      const callArgs = mockTouchpointRepository.createTouchpoint.mock.calls[0][0]
      expect(callArgs.data.method).toBe('call')
      expect(callArgs.data.description).toBe('description')
    })

    it('should throw error if name is missing', async () => {
      const userId = 'user-123'
      const input = {
        method: 'call',
      } as any

      await expect(service.logConnection(userId, input)).rejects.toThrow('Name is required')
    })

    it('should throw error if name is empty string', async () => {
      const userId = 'user-123'
      const input = {
        name: '',
        method: 'call',
      }

      await expect(service.logConnection(userId, input)).rejects.toThrow('Name is required')
    })

    it('should throw error if name is only whitespace', async () => {
      const userId = 'user-123'
      const input = {
        name: '   ',
        method: 'call',
      }

      await expect(service.logConnection(userId, input)).rejects.toThrow('Name is required')
    })

    it('should throw error if method is missing', async () => {
      const userId = 'user-123'
      const input = {
        name: 'John Doe',
      } as any

      await expect(service.logConnection(userId, input)).rejects.toThrow('Method is required')
    })

    it('should throw error if method is empty string', async () => {
      const userId = 'user-123'
      const input = {
        name: 'John Doe',
        method: '',
      }

      await expect(service.logConnection(userId, input)).rejects.toThrow('Method is required')
    })

    it('should throw error if method is only whitespace', async () => {
      const userId = 'user-123'
      const input = {
        name: 'John Doe',
        method: '   ',
      }

      await expect(service.logConnection(userId, input)).rejects.toThrow('Method is required')
    })

    it('should create new person if not found by name', async () => {
      const userId = 'user-123'
      const input = {
        name: 'New Person',
        method: 'text',
      }

      const newPerson = {
        id: 'person-1',
        name: 'New Person',
      }

      mockRelationshipService.findOrCreatePersonByName.mockResolvedValue(newPerson)
      mockRelationshipService.ensureRelationship.mockResolvedValue({
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-1',
      })
      mockTouchpointRepository.createTouchpoint.mockResolvedValue({
        id: 'touchpoint-1',
      })

      const result = await service.logConnection(userId, input)

      expect(result.person).toEqual(newPerson)
      expect(mockRelationshipService.findOrCreatePersonByName).toHaveBeenCalledWith('New Person')
    })

    it('should use existing person if found by name', async () => {
      const userId = 'user-123'
      const input = {
        name: 'Existing Person',
        method: 'call',
      }

      const existingPerson = {
        id: 'person-1',
        name: 'Existing Person',
      }

      mockRelationshipService.findOrCreatePersonByName.mockResolvedValue(existingPerson)
      mockRelationshipService.ensureRelationship.mockResolvedValue({
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-1',
      })
      mockTouchpointRepository.createTouchpoint.mockResolvedValue({
        id: 'touchpoint-1',
      })

      const result = await service.logConnection(userId, input)

      expect(result.person).toEqual(existingPerson)
    })

    it('should ensure relationship is created or updated', async () => {
      const userId = 'user-123'
      const input = {
        name: 'Test Person',
        method: 'text',
      }

      mockRelationshipService.findOrCreatePersonByName.mockResolvedValue({
        id: 'person-1',
        name: 'Test Person',
      })

      mockRelationshipService.ensureRelationship.mockResolvedValue({
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-1',
        interaction_count: 1,
      })

      mockTouchpointRepository.createTouchpoint.mockResolvedValue({
        id: 'touchpoint-1',
        relationship_id: 'rel-1',
      })

      const result = await service.logConnection(userId, input)

      expect(result.relationship.id).toBe('rel-1')
      expect(mockRelationshipService.ensureRelationship).toHaveBeenCalledWith(userId, 'person-1')
    })

    it('should create touchpoint with correct data structure', async () => {
      const userId = 'user-123'
      const input = {
        name: 'John Doe',
        method: 'facetime',
        description: 'Video call about project',
        occurredAt: new Date('2024-01-15T14:00:00Z'),
      }

      mockRelationshipService.findOrCreatePersonByName.mockResolvedValue({
        id: 'person-1',
        name: 'John Doe',
      })

      mockRelationshipService.ensureRelationship.mockResolvedValue({
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-1',
      })

      mockTouchpointRepository.createTouchpoint.mockResolvedValue({
        id: 'touchpoint-1',
        type: 'note',
        source: 'manual',
        title: 'Connection with John Doe',
        data: {
          method: 'facetime',
          description: 'Video call about project',
        },
      })

      await service.logConnection(userId, input)

      const callArgs = mockTouchpointRepository.createTouchpoint.mock.calls[0][0]
      expect(callArgs.userId).toBe(userId)
      expect(callArgs.relationshipId).toBe('rel-1')
      expect(callArgs.type).toBe('note')
      expect(callArgs.source).toBe('manual')
      expect(callArgs.title).toBe('Connection with John Doe')
      expect(callArgs.data.method).toBe('facetime')
      expect(callArgs.data.description).toBe('Video call about project')
      expect(callArgs.occurredAt).toEqual(new Date('2024-01-15T14:00:00Z'))
    })

    it('should propagate errors from relationship service', async () => {
      const userId = 'user-123'
      const input = {
        name: 'Test Person',
        method: 'call',
      }

      mockRelationshipService.findOrCreatePersonByName.mockRejectedValue(
        new Error('Database error')
      )

      await expect(service.logConnection(userId, input)).rejects.toThrow('Database error')
    })

    it('should propagate errors from touchpoint repository', async () => {
      const userId = 'user-123'
      const input = {
        name: 'Test Person',
        method: 'call',
      }

      mockRelationshipService.findOrCreatePersonByName.mockResolvedValue({
        id: 'person-1',
        name: 'Test Person',
      })

      mockRelationshipService.ensureRelationship.mockResolvedValue({
        id: 'rel-1',
        user_id: userId,
        person_id: 'person-1',
      })

      mockTouchpointRepository.createTouchpoint.mockRejectedValue(
        new Error('Failed to create touchpoint')
      )

      await expect(service.logConnection(userId, input)).rejects.toThrow('Failed to create touchpoint')
    })
  })
})

