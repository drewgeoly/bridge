# Database Migrations

This directory contains SQL migration files for the Bridge database schema.

## Two Ways to Apply Migrations

### Option 1: Supabase CLI (Recommended for Terminal)

The Supabase CLI allows you to apply migrations directly from the terminal.

#### Installation

**macOS (using Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Or download directly:**
- Visit: https://github.com/supabase/cli/releases
- Download the binary for your OS
- Add to your PATH

**Verify installation:**
```bash
supabase --version
```

#### Setup

1. **Link to your Supabase project:**
   ```bash
   cd bridge-app
   supabase link --project-ref your-project-ref
   ```
   - Find your project ref in Supabase Dashboard → Settings → General → Reference ID

2. **Or use environment variables:**
   ```bash
   export SUPABASE_URL=https://your-project.supabase.co
   export SUPABASE_DB_PASSWORD=your-database-password
   ```

#### Apply Migrations

**Apply all pending migrations:**
```bash
supabase db push
```

**Apply a specific migration:**
```bash
supabase migration up 20241116200000_add_calendar_fields
```

**Check migration status:**
```bash
supabase migration list
```

**Create a new migration:**
```bash
supabase migration new your_migration_name
```
This creates a new file in `supabase/migrations/` with timestamp.

#### Workflow

1. Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Write your SQL changes
3. Test locally (optional): `supabase start` (runs local Supabase)
4. Apply to remote: `supabase db push`
5. Commit the migration file to git

### Option 2: Supabase Dashboard (Manual)

1. Copy SQL from migration file
2. Go to Supabase Dashboard → SQL Editor
3. Paste and run
4. Verify in Table Editor

## Current Migrations

- `20241116200000_add_calendar_fields.sql` - Adds calendar sync fields, raw_event_data to touchpoints, and necessary indexes

## Best Practices

- Each migration should be additive (add new things, don't remove)
- Use `IF NOT EXISTS` or `DO $$ BEGIN ... END $$` blocks to make migrations idempotent
- Never include destructive changes (DROP TABLE, etc.) in Phase 1
- Test migrations on a development database first if possible
- Keep migrations focused on a single feature/change
- Document any manual steps required after running the migration

## Troubleshooting

**"Migration already applied" error:**
- Check `supabase_migrations.schema_migrations` table in your database
- If migration is listed but failed, you may need to manually fix the database state

**Connection errors:**
- Verify your project ref is correct
- Check that your database password is set correctly
- Ensure you have network access to Supabase
