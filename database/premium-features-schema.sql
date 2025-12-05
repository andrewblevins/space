-- Premium Features Database Schema
-- Run this in Supabase SQL Editor to add premium feature support

-- Expert Knowledge Advisors
-- Add expert_knowledge column to advisors (if advisors table exists)
-- Note: This assumes advisors are stored in a table. If stored in localStorage,
-- you may need to create an advisors table first.

CREATE TABLE IF NOT EXISTS public.advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  expert_knowledge TEXT, -- Phase 1: Text-based knowledge
  has_expert_knowledge BOOLEAN DEFAULT false,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If advisors table already exists, just add columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'advisors' AND column_name = 'expert_knowledge') THEN
    ALTER TABLE public.advisors ADD COLUMN expert_knowledge TEXT;
    ALTER TABLE public.advisors ADD COLUMN has_expert_knowledge BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Advisor Knowledge Files (Phase 2)
CREATE TABLE IF NOT EXISTS public.advisor_knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID REFERENCES public.advisors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for advisor_knowledge_files
CREATE INDEX IF NOT EXISTS idx_knowledge_files_advisor_id ON public.advisor_knowledge_files(advisor_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_user_id ON public.advisor_knowledge_files(user_id);

-- RLS policies for advisors
ALTER TABLE public.advisors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own advisors" ON public.advisors
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for advisor_knowledge_files
ALTER TABLE public.advisor_knowledge_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own knowledge files" ON public.advisor_knowledge_files
  FOR ALL USING (auth.uid() = user_id);

-- Analytics Tables

-- Conversation Analytics
CREATE TABLE IF NOT EXISTS public.conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_count INTEGER DEFAULT 0,
  advisor_count INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for conversation_analytics
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_user_id ON public.conversation_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_conversation_id ON public.conversation_analytics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_created_at ON public.conversation_analytics(created_at);

-- Advisor Analytics
CREATE TABLE IF NOT EXISTS public.advisor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  advisor_id TEXT NOT NULL, -- Advisor name/ID
  advisor_name TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for advisor_analytics
CREATE INDEX IF NOT EXISTS idx_advisor_analytics_user_id ON public.advisor_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_analytics_advisor_id ON public.advisor_analytics(advisor_id);

-- Insights (Phase 2)
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  insight_text TEXT,
  confidence_score FLOAT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for insights
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON public.insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_conversation_id ON public.insights(conversation_id);
CREATE INDEX IF NOT EXISTS idx_insights_detected_at ON public.insights(detected_at);

-- User Metrics (Phase 3)
CREATE TABLE IF NOT EXISTS public.user_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  insight_count INTEGER DEFAULT 0,
  perspective_diversity_score FLOAT,
  conversation_depth_score FLOAT,
  sophistication_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for user_metrics
CREATE INDEX IF NOT EXISTS idx_user_metrics_user_id ON public.user_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_metrics_date ON public.user_metrics(date);

-- RLS policies for analytics tables
ALTER TABLE public.conversation_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversation analytics" ON public.conversation_analytics
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.advisor_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own advisor analytics" ON public.advisor_analytics
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own insights" ON public.insights
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own metrics" ON public.user_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- Function to update advisor analytics when advisor is used
CREATE OR REPLACE FUNCTION update_advisor_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called when an advisor is used in a conversation
  -- Implementation depends on how advisor usage is tracked
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation analytics
CREATE OR REPLACE FUNCTION update_conversation_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation analytics when messages are added
  INSERT INTO public.conversation_analytics (
    user_id,
    conversation_id,
    message_count
  )
  SELECT 
    c.user_id,
    NEW.conversation_id,
    COUNT(*)::INTEGER
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE m.conversation_id = NEW.conversation_id
  GROUP BY c.user_id, m.conversation_id
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation analytics (simplified - may need adjustment)
-- Note: This is a basic implementation. You may want to use a more efficient approach.

