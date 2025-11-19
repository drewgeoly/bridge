-- Migration: Add event labels/categories to touchpoints
-- Date: 2024-11-17
-- Description: Adds category column to touchpoints table for event labeling (social, work, personal, etc.)

-- Add category column to touchpoints if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'touchpoints' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.touchpoints 
        ADD COLUMN category TEXT;
        
        -- Add check constraint for valid categories
        ALTER TABLE public.touchpoints
        ADD CONSTRAINT touchpoints_category_check 
        CHECK (category IS NULL OR category IN ('social', 'work', 'personal', 'family', 'other'));
        
        -- Create index for filtering by category
        CREATE INDEX IF NOT EXISTS idx_touchpoints_category ON touchpoints(category) WHERE category IS NOT NULL;
    END IF;
END $$;

-- Add comment explaining the column
COMMENT ON COLUMN touchpoints.category IS 'Event category/label: social, work, personal, family, or other';

