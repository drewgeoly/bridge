# Testing Guide

This guide explains how to run and write tests for the Bridge application.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (auto-rerun on file changes)
```bash
npm run test:watch
```

### Run tests with UI (interactive test runner)
```bash
npm run test:ui
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

Tests are located alongside the code they test:
- `lib/services/**/__tests__/*.test.ts` - Service tests
- `lib/repositories/__tests__/*.test.ts` - Repository tests
- `lib/utils/__tests__/*.test.ts` - Utility tests

## Writing Tests

### Example: Testing a Service Method

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MyService } from '../my-service'

describe('MyService', () => {
  let service: MyService

  beforeEach(() => {
    service = new MyService()
  })

  describe('myMethod', () => {
    it('should do something correctly', () => {
      // Arrange: Set up test data
      const input = 'test-input'
      
      // Act: Call the method
      const result = service.myMethod(input)
      
      // Assert: Verify the result
      expect(result).toBe('expected-output')
    })
  })
})
```

### Example: Mocking Dependencies

```typescript
import { vi } from 'vitest'

// Mock a module
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock an instance method
const mockRepository = {
  getData: vi.fn().mockResolvedValue({ id: '123' }),
}
```

## Test Patterns

### Input/Output Testing

For each test, clearly document:
- **Input**: What data/parameters are being tested
- **Expected Output**: What should be returned
- **Side Effects**: What should change (database, external APIs, etc.)

Example:
```typescript
it('should create touchpoint with correct data', async () => {
  // Input: TouchpointInput
  const input = {
    userId: 'user-123',
    type: 'calendar',
    source: 'google_calendar',
    occurredAt: new Date(),
  }
  
  // Expected Output: Touchpoint with generated ID
  const result = await repository.createTouchpoint(input)
  
  expect(result.id).toBeDefined()
  expect(result.user_id).toBe(input.userId)
})
```

### Testing Error Cases

Always test error scenarios:
```typescript
it('should throw error when database fails', async () => {
  mockSupabase.insert.mockResolvedValue({
    error: { message: 'Database error' },
  })
  
  await expect(
    repository.createTouchpoint(input)
  ).rejects.toThrow('Failed to create touchpoint')
})
```

### Testing Async Operations

Use `async/await` for async tests:
```typescript
it('should fetch events asynchronously', async () => {
  const events = await service.fetchEvents(token, start, end)
  expect(Array.isArray(events)).toBe(true)
})
```

## Current Test Coverage

- ✅ `date.utils` - All utility functions tested
- ✅ `GoogleCalendarService` - Core methods tested
- ✅ `TouchpointRepository` - CRUD operations tested
- ⏳ More tests coming as features are added

## Best Practices

1. **Test one thing at a time** - Each test should verify a single behavior
2. **Use descriptive test names** - "should do X when Y" format
3. **Arrange-Act-Assert** - Structure tests clearly
4. **Mock external dependencies** - Don't make real API calls in tests
5. **Test edge cases** - Empty inputs, null values, error conditions
6. **Keep tests fast** - Unit tests should run in milliseconds

## Debugging Tests

If a test fails:
1. Read the error message carefully
2. Check what the actual value was vs expected
3. Use `console.log` to inspect values (remove before committing)
4. Run a single test: `npm test -- path/to/test.test.ts`

## Continuous Integration

Tests will run automatically on:
- Pull requests
- Before deployment
- On every commit (if you set up GitHub Actions)

