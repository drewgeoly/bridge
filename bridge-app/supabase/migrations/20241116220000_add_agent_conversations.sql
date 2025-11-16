-- Migration: Add agent conversations and insights tables
-- Date: 2024-11-16
-- Description: Adds tables for storing AI agent conversations and extracted insights

-- Create agent_conversations table
CREATE TABLE IF NOT EXISTS public.agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context_snapshot JSONB DEFAULT '{}',
    insights JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_insights table
CREATE TABLE IF NOT EXISTS public.agent_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    content TEXT NOT NULL,
    related_person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_id ON agent_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent_name ON agent_conversations(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_created_at ON agent_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_insights_user_id ON agent_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_insights_conversation_id ON agent_insights(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_insights_related_person_id ON agent_insights(related_person_id) WHERE related_person_id IS NOT NULL;

-- Enable RLS
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_conversations
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'agent_conversations' 
        AND policyname = 'Users can manage own conversations'
    ) THEN
        CREATE POLICY "Users can manage own conversations" ON agent_conversations
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS Policies for agent_insights
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'agent_insights' 
        AND policyname = 'Users can view own insights'
    ) THEN
        CREATE POLICY "Users can view own insights" ON agent_insights
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE agent_conversations IS 'Stores AI agent conversations with users';
COMMENT ON TABLE agent_insights IS 'Stores extracted insights from agent conversations';
COMMENT ON COLUMN agent_conversations.context_snapshot IS 'Snapshot of context data used for this conversation';
COMMENT ON COLUMN agent_conversations.insights IS 'Array of extracted insights from the response';
COMMENT ON COLUMN agent_conversations.metadata IS 'Additional metadata (model, tokens, etc.)';

