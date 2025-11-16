# Quick Start Guide

## 1. Supabase CLI Setup (Terminal Migrations)

### Install Supabase CLI

**macOS (Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Or download:**
- Visit: https://github.com/supabase/cli/releases
- Download binary for your OS
- Add to PATH

**Verify:**
```bash
supabase --version
```

### Link Your Project

```bash
cd bridge-app
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref: Supabase Dashboard → Settings → General → Reference ID

### Apply Migrations

```bash
# Apply all pending migrations
supabase db push

# Check status
supabase migration list

# Create new migration
supabase migration new your_migration_name
```

**First time setup:**
1. Run `supabase db push` to apply `20241116200000_add_calendar_fields.sql`
2. Verify in Supabase Dashboard → Table Editor

## 2. Running Tests

### Install Dependencies (if not already done)
```bash
npm install
```

### Run Tests
```bash
# Run all tests once
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Interactive UI
npm run test:ui

# With coverage
npm run test:coverage
```

### Test Files Location
- `lib/services/**/__tests__/*.test.ts`
- `lib/repositories/__tests__/*.test.ts`
- `lib/utils/__tests__/*.test.ts`

## 3. Environment Variables

Create `.env.local`:
```env
# Supabase (already set up)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Google Calendar OAuth (new - needed for Phase 1)
GOOGLE_CALENDAR_CLIENT_ID=your_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/calendar/callback
```

## 4. Common Commands

```bash
# Development
npm run dev              # Start Next.js dev server

# Database
supabase db push         # Apply migrations
supabase migration list  # Check migration status

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode

# Build
npm run build            # Production build
```

## 5. Workflow Example

**Adding a new feature:**
1. Create migration: `supabase migration new add_feature`
2. Write SQL in the new file
3. Apply: `supabase db push`
4. Write code
5. Write tests
6. Run tests: `npm test`
7. Commit everything

**Testing changes:**
1. Make code changes
2. Run `npm run test:watch` in another terminal
3. Tests auto-rerun on save
4. Fix any failures
5. Commit when all green

## Troubleshooting

**Supabase CLI not found:**
- Make sure it's installed and in your PATH
- Try `which supabase` to check location

**Migration errors:**
- Check SQL syntax
- Verify you're linked to correct project
- Check Supabase Dashboard for error details

**Test failures:**
- Check that mocks are set up correctly
- Verify environment variables in `vitest.setup.ts`
- Run single test: `npm test -- path/to/test.test.ts`

