-- Migration: Add calendar sync fields and enhance touchpoints
-- Date: 2024-11-16
-- Description: Adds fields needed for Google Calendar integration

-- Verify external_accounts table exists (from initial schema)
-- If it doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.external_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Add last_synced_at if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'external_accounts' 
        AND column_name = 'last_synced_at'
    ) THEN
        ALTER TABLE public.external_accounts 
        ADD COLUMN last_synced_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add raw_event_data to touchpoints if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'touchpoints' 
        AND column_name = 'raw_event_data'
    ) THEN
        ALTER TABLE public.touchpoints 
        ADD COLUMN raw_event_data JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add external_id to touchpoints for deduplication (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'touchpoints' 
        AND column_name = 'external_id'
    ) THEN
        ALTER TABLE public.touchpoints 
        ADD COLUMN external_id TEXT;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_touchpoints_occurred_at ON touchpoints(occurred_at);
CREATE INDEX IF NOT EXISTS idx_touchpoints_external_id_source ON touchpoints(external_id, source) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_external_accounts_user_id ON external_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_external_accounts_provider ON external_accounts(provider);

-- Enable RLS on external_accounts if not already enabled
ALTER TABLE external_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policy for external_accounts (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'external_accounts' 
        AND policyname = 'Users can manage own external accounts'
    ) THEN
        CREATE POLICY "Users can manage own external accounts" ON external_accounts
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add comment explaining the migration
COMMENT ON COLUMN external_accounts.last_synced_at IS 'Timestamp of last successful calendar sync';
COMMENT ON COLUMN touchpoints.raw_event_data IS 'Full raw event data from Google Calendar API';
COMMENT ON COLUMN touchpoints.external_id IS 'External ID from source (e.g., Google Calendar event ID) for deduplication';

