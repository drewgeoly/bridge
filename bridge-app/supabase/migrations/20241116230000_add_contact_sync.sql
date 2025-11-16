-- Migration: Add contact sync and mapping tables
-- Date: 2024-11-16
-- Description: Adds tables for contact imports, mappings, and enhances people table with contact fields

-- Create contact_imports table
CREATE TABLE IF NOT EXISTS public.contact_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    file_name TEXT,
    imported_count INTEGER DEFAULT 0,
    matched_count INTEGER DEFAULT 0,
    created_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create contact_mappings table
CREATE TABLE IF NOT EXISTS public.contact_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    contact_import_id UUID NOT NULL REFERENCES contact_imports(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    contact_email TEXT,
    contact_name TEXT,
    match_type TEXT NOT NULL,
    confidence_score NUMERIC(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhance people table with contact fields
DO $$ 
BEGIN
    -- Add phone_numbers if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'people' 
        AND column_name = 'phone_numbers'
    ) THEN
        ALTER TABLE public.people 
        ADD COLUMN phone_numbers JSONB DEFAULT '[]';
    END IF;

    -- Add contact_source if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'people' 
        AND column_name = 'contact_source'
    ) THEN
        ALTER TABLE public.people 
        ADD COLUMN contact_source TEXT;
    END IF;

    -- Add last_contact_sync if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'people' 
        AND column_name = 'last_contact_sync'
    ) THEN
        ALTER TABLE public.people 
        ADD COLUMN last_contact_sync TIMESTAMPTZ;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_imports_user_id ON contact_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_imports_status ON contact_imports(status);
CREATE INDEX IF NOT EXISTS idx_contact_imports_created_at ON contact_imports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_mappings_person_id ON contact_mappings(person_id);
CREATE INDEX IF NOT EXISTS idx_contact_mappings_contact_import_id ON contact_mappings(contact_import_id);
CREATE INDEX IF NOT EXISTS idx_contact_mappings_user_id ON contact_mappings(user_id);

-- Enable RLS
ALTER TABLE contact_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_imports
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'contact_imports' 
        AND policyname = 'Users can manage own contact imports'
    ) THEN
        CREATE POLICY "Users can manage own contact imports" ON contact_imports
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS Policies for contact_mappings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'contact_mappings' 
        AND policyname = 'Users can view own contact mappings'
    ) THEN
        CREATE POLICY "Users can view own contact mappings" ON contact_mappings
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE contact_imports IS 'Tracks contact import operations';
COMMENT ON TABLE contact_mappings IS 'Maps imported contacts to people records';
COMMENT ON COLUMN contact_imports.status IS 'Import status: pending, processing, completed, failed';
COMMENT ON COLUMN contact_mappings.match_type IS 'How the match was made: email_exact, email_fuzzy, name_exact, name_fuzzy, phone, manual';
COMMENT ON COLUMN contact_mappings.confidence_score IS 'Confidence score for the match (0-1)';
COMMENT ON COLUMN people.phone_numbers IS 'Array of phone numbers from contacts';
COMMENT ON COLUMN people.contact_source IS 'Source of contact data (e.g., vcf_upload, icloud_api)';
COMMENT ON COLUMN people.last_contact_sync IS 'Last time contact data was synced';

