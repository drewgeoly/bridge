-- Migration: Add interaction notes support
-- Date: 2024-11-17
-- Description: Extends touchpoints.data JSONB to support notes/questions, or creates interaction_notes table

-- Option 1: Extend touchpoints.data JSONB field (simpler, no new table needed)
-- Notes will be stored in touchpoints.data.notes as an array of note objects
-- This approach is simpler and doesn't require a new table

-- Add comment explaining notes structure
COMMENT ON COLUMN touchpoints.data IS 'JSONB field containing event/interaction data. Can include notes array: [{"text": "note text", "question": "question text", "createdAt": "timestamp"}]';

-- Note: We're using the existing data JSONB field, so no schema changes needed
-- The notes will be stored as: data.notes = [{text: string, question?: string, createdAt: timestamp}]

