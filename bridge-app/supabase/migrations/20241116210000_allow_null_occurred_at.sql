-- Migration: Allow null occurred_at for manual connection logs
-- Date: 2024-11-16
-- Description: Allows occurred_at to be null so users can log connections without timestamps and update later

-- Make occurred_at nullable (if it's currently NOT NULL)
DO $$ 
BEGIN
    -- Check if occurred_at has NOT NULL constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'touchpoints' 
        AND column_name = 'occurred_at'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.touchpoints 
        ALTER COLUMN occurred_at DROP NOT NULL;
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN touchpoints.occurred_at IS 'When the interaction occurred. Can be null for manual logs that user will update later.';

