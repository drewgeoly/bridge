# Testing Partitions for Phase 1

This document outlines the input/output partitions we've created for test cases and identifies missing partitions.

## Current Test Coverage

### 1. GoogleCalendarService

#### `getAuthUrl(state?: string)`
**Input Partitions:**
- ✅ With state parameter
- ✅ Without state parameter (undefined)

**Output Partitions:**
- ✅ Valid OAuth URL containing 'accounts.google.com'
- ✅ URL contains 'oauth'
- ✅ Scope array includes 'calendar.readonly'
- ✅ access_type is 'offline'
- ✅ prompt is 'consent'

**Missing Partitions:**
- ❌ Empty string state
- ❌ Very long state string
- ❌ Special characters in state

---

#### `exchangeCodeForTokens(code: string)`
**Input Partitions:**
- ✅ Valid authorization code
- ✅ Invalid code (no access token in response)

**Output Partitions:**
- ✅ Success: Returns tokens object with accessToken, refreshToken, expiresAt
- ✅ Error: Throws "No access token received from Google"

**Missing Partitions:**
- ❌ Empty string code
- ❌ Expired authorization code
- ❌ Code with refresh token missing (should still work)
- ❌ Code with no expiry_date (expiresAt should be undefined)
- ❌ Network error / API failure
- ❌ Invalid code format

---

#### `getValidAccessToken(userId: string)`
**Input Partitions:**
- ✅ Valid, non-expired token exists
- ✅ No token found (null)

**Output Partitions:**
- ✅ Returns existing valid token
- ✅ Error: "No access token found"

**Missing Partitions:**
- ❌ Expired token (should trigger refresh)
- ❌ Token expiring soon (< 5 minutes)
- ❌ Token refresh failure
- ❌ Invalid userId format
- ❌ Empty userId string

---

#### `refreshAccessToken(userId: string)`
**Input Partitions:**
- ❌ **NO TESTS** - This method is not tested at all!

**Missing Partitions:**
- ❌ Valid refresh token exists
- ❌ No refresh token available
- ❌ Refresh token expired/invalid
- ❌ Google API returns error
- ❌ Network failure during refresh

---

#### `fetchEvents(accessToken, timeMin, timeMax)`
**Input Partitions:**
- ❌ **NO TESTS** - This method is not tested at all!

**Missing Partitions:**
- ❌ Valid token, valid date range
- ❌ Invalid/expired token (401 error)
- ❌ Network error
- ❌ Empty events list
- ❌ Large number of events (pagination)
- ❌ Invalid date range (timeMin > timeMax)
- ❌ Very large date range
- ❌ Date range in past
- ❌ Date range in future

---

#### `transformEventToTouchpointData(event)`
**Input Partitions:**
- ✅ Normal event with dateTime
- ✅ All-day event (date only)
- ✅ Event with no start time

**Output Partitions:**
- ✅ Returns touchpoint data with title, occurredAt, durationMinutes, data
- ✅ Error: "Event has no start time"

**Missing Partitions:**
- ❌ Event with no summary (should use "Untitled Event")
- ❌ Event with no end time (durationMinutes should be undefined)
- ❌ Event with end time before start time (negative duration)
- ❌ Event with no description
- ❌ Event with no location
- ❌ Event with no attendees
- ❌ Event with multiple attendees
- ❌ Event with organizer but no attendees
- ❌ Event with invalid date format
- ❌ Event with timezone information
- ❌ Event with recurring event data

---

### 2. TouchpointRepository

#### `createTouchpoint(input)`
**Input Partitions:**
- ✅ Valid input with all fields
- ✅ Database error

**Output Partitions:**
- ✅ Returns created touchpoint
- ✅ Error: "Failed to create touchpoint"

**Missing Partitions:**
- ❌ Missing required fields (userId, type, source, occurredAt)
- ❌ Invalid userId format
- ❌ Invalid type value
- ❌ Invalid date format
- ❌ Very long title/description
- ❌ Special characters in data
- ❌ Duplicate external_id (should this be allowed?)

---

#### `findByExternalId(externalId, source, userId)`
**Input Partitions:**
- ✅ Existing external ID
- ✅ Non-existent external ID

**Output Partitions:**
- ✅ Returns touchpoint
- ✅ Returns null

**Missing Partitions:**
- ❌ Empty string externalId
- ❌ Empty string source
- ❌ Invalid userId
- ❌ Multiple touchpoints with same externalId (shouldn't happen, but test edge case)

---

#### `findByDateRange(userId, start, end)`
**Input Partitions:**
- ✅ Valid range with results
- ✅ Valid range without results (empty array)

**Output Partitions:**
- ✅ Returns array of touchpoints
- ✅ Returns empty array
- ✅ Results ordered by occurred_at descending

**Missing Partitions:**
- ❌ Invalid date range (start > end)
- ❌ Same start and end date
- ❌ Very large date range
- ❌ Dates in future
- ❌ Invalid userId
- ❌ Null/undefined dates

---

#### `findByRelationshipId(relationshipId, userId)`
**Input Partitions:**
- ❌ **NO TESTS** - This method is not tested!

**Missing Partitions:**
- ❌ Valid relationshipId with touchpoints
- ❌ Valid relationshipId with no touchpoints
- ❌ Invalid relationshipId
- ❌ Invalid userId

---

#### `updateTouchpoint(id, updates)`
**Input Partitions:**
- ❌ **NO TESTS** - This method is not tested!

**Missing Partitions:**
- ❌ Valid update
- ❌ Invalid ID
- ❌ Partial updates
- ❌ Database error

---

#### `deleteTouchpoint(id, userId)`
**Input Partitions:**
- ❌ **NO TESTS** - This method is not tested!

**Missing Partitions:**
- ❌ Valid deletion
- ❌ Invalid ID
- ❌ Unauthorized (wrong userId)
- ❌ Database error

---

### 3. RelationshipService

#### `extractPeopleFromEvent(event)`
**Input Partitions:**
- ❌ **NO TESTS** - This method is not tested!

**Missing Partitions:**
- ❌ Event with organizer only
- ❌ Event with attendees only
- ❌ Event with organizer and attendees
- ❌ Event with no organizer or attendees
- ❌ Event with resource/room attendees (should be filtered)
- ❌ Event with duplicate emails
- ❌ Event with attendees without emails
- ❌ Event with organizer email matching attendee email (should dedupe)

---

#### `findOrCreatePerson(email, name)`
**Input Partitions:**
- ❌ **NO TESTS** - This method is not tested!

**Missing Partitions:**
- ❌ New person (doesn't exist)
- ❌ Existing person by email
- ❌ Existing person, update name
- ❌ Existing person, same name (no update)
- ❌ Empty email
- ❌ Invalid email format
- ❌ Email with different case (should match)
- ❌ Very long name
- ❌ Special characters in name

---

#### `ensureRelationship(userId, personId)`
**Input Partitions:**
- ❌ **NO TESTS** - This method is not tested!

**Missing Partitions:**
- ❌ New relationship
- ❌ Existing relationship (should update last_interaction, increment count)
- ❌ Invalid userId
- ❌ Invalid personId
- ❌ Database error

---

### 4. CalendarSyncService

#### `syncUserCalendar(userId, daysBack)`
**Input Partitions:**
- ❌ **NO TESTS** - This method is not tested!

**Missing Partitions:**
- ❌ Successful sync with events
- ❌ Successful sync with no events
- ❌ Sync with some events already existing (deduplication)
- ❌ Sync with events that have attendees (creates relationships)
- ❌ Sync with events that have no attendees
- ❌ Sync with events that fail to process (partial success)
- ❌ Token refresh needed during sync
- ❌ Token refresh fails
- ❌ Google API returns error
- ❌ Network failure
- ❌ Invalid userId
- ❌ Custom daysBack value
- ❌ Very large daysBack value
- ❌ Zero or negative daysBack

**Output Partitions:**
- ❌ Success result with counts
- ❌ Failure result with error message
- ❌ Partial success (some events processed, some failed)

---

### 5. TokenRepository

#### `getTokens(userId, provider)`
**Input Partitions:**
- ❌ **NO TESTS** - This method is not tested!

**Missing Partitions:**
- ❌ Tokens exist
- ❌ Tokens don't exist (null)
- ❌ Invalid userId
- ❌ Invalid provider
- ❌ Database error

---

#### `saveTokens(userId, provider, tokens)`
**Input Partitions:**
- ❌ **NO TESTS** - This method is not tested!

**Missing Partitions:**
- ❌ New tokens (insert)
- ❌ Update existing tokens (upsert)
- ❌ Missing accessToken
- ❌ Missing refreshToken (should still work)
- ❌ Invalid expiresAt
- ❌ Database error

---

#### `isTokenExpired(expiresAt)`
**Input Partitions:**
- ❌ **NO TESTS** - This method is not tested!

**Missing Partitions:**
- ❌ Token not expired (future date)
- ❌ Token expired (past date)
- ❌ Token expiring soon (< 5 minutes)
- ❌ Null/undefined expiresAt (should return true)
- ❌ Invalid date format

---

### 6. Date Utils

#### `getSyncDateRange(daysBack)`
**Input Partitions:**
- ✅ Default (90 days)
- ✅ Custom days (30)

**Output Partitions:**
- ✅ Returns startDate and endDate
- ✅ Date range is approximately correct

**Missing Partitions:**
- ❌ Zero days
- ❌ Negative days (should handle gracefully or error)
- ❌ Very large number of days
- ❌ Fractional days

---

#### `formatDateForGoogleAPI(date)`
**Input Partitions:**
- ✅ Valid date

**Output Partitions:**
- ✅ Returns ISO string format

**Missing Partitions:**
- ❌ Invalid date object
- ❌ Null/undefined date

---

#### `parseGoogleAPIDate(dateString)`
**Input Partitions:**
- ✅ Valid date string
- ✅ Undefined input
- ✅ Empty string

**Output Partitions:**
- ✅ Returns Date object
- ✅ Returns null

**Missing Partitions:**
- ❌ Invalid date string format
- ❌ Null input
- ❌ Date string with timezone

---

#### `calculateDurationMinutes(start, end)`
**Input Partitions:**
- ✅ Normal duration
- ✅ Same start and end time

**Output Partitions:**
- ✅ Returns correct minutes
- ✅ Returns 0 for same time

**Missing Partitions:**
- ❌ End before start (negative duration)
- ❌ Very long duration
- ❌ Invalid dates
- ❌ Null/undefined dates

---

#### `isDateInRange(date, start, end)`
**Input Partitions:**
- ✅ Date within range
- ✅ Date before range
- ✅ Date after range
- ✅ Date at boundaries

**Output Partitions:**
- ✅ Returns true/false correctly

**Missing Partitions:**
- ❌ Invalid date objects
- ❌ Null/undefined dates
- ❌ start > end (invalid range)

---

### 7. API Endpoints

#### `/api/calendar/connect` (POST)
**Input Partitions:**
- ❌ **NO TESTS** - No API endpoint tests!

**Missing Partitions:**
- ❌ Authenticated user
- ❌ Unauthenticated user (401)
- ❌ Missing user session

---

#### `/api/calendar/callback` (GET)
**Input Partitions:**
- ❌ **NO TESTS**

**Missing Partitions:**
- ❌ Valid authorization code
- ❌ Missing code parameter
- ❌ Invalid code
- ❌ OAuth error parameter
- ❌ Unauthenticated user
- ❌ Token save failure

---

#### `/api/calendar/sync` (POST)
**Input Partitions:**
- ❌ **NO TESTS**

**Missing Partitions:**
- ❌ Authenticated user, default daysBack
- ❌ Authenticated user, custom daysBack
- ❌ Unauthenticated user
- ❌ No calendar connected
- ❌ Sync failure
- ❌ Invalid daysBack value

---

#### `/api/calendar/status` (GET)
**Input Partitions:**
- ❌ **NO TESTS**

**Missing Partitions:**
- ❌ Calendar connected, token valid
- ❌ Calendar connected, token expired
- ❌ Calendar not connected
- ❌ Unauthenticated user

---

## Summary of Missing Partitions

### Critical Missing Tests (High Priority)
1. **CalendarSyncService** - No tests at all (core functionality)
2. **RelationshipService** - No tests at all (core functionality)
3. **TokenRepository** - No tests at all (critical for OAuth)
4. **API Endpoints** - No integration tests
5. **Token refresh scenarios** - `refreshAccessToken` and expired token handling
6. **Error handling** - Network failures, API errors, database errors

### Important Missing Partitions (Medium Priority)
1. **Edge cases** - Empty inputs, invalid formats, boundary conditions
2. **Deduplication logic** - Multiple events, duplicate people
3. **Event processing** - Events with no attendees, multiple attendees
4. **Date handling** - Invalid dates, timezones, edge cases

### Nice-to-Have Partitions (Low Priority)
1. **Performance** - Large datasets, pagination
2. **Special characters** - Unicode, special chars in names/emails
3. **Concurrency** - Multiple syncs, race conditions

## Recommendations

1. **Immediate**: Add tests for CalendarSyncService, RelationshipService, and TokenRepository
2. **Next**: Add API endpoint integration tests
3. **Then**: Fill in missing edge cases and error scenarios
4. **Finally**: Add performance and stress tests

