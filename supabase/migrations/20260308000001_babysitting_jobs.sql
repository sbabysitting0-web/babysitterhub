-- Babysitting Jobs table
-- Run in: https://supabase.com/dashboard/project/utqlshqdbefcgoaigmnz/editor/sql

CREATE TABLE IF NOT EXISTS public.babysitting_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  city text,
  address text,
  location_lat double precision,
  location_lng double precision,
  hourly_rate numeric,
  job_type text DEFAULT 'regular',        -- regular, occasional, overnight, emergency
  children_count int DEFAULT 1,
  children_ages text[],                     -- e.g. {'0-1','3-6'}
  status text DEFAULT 'open',              -- open, assigned, closed
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.babysitting_jobs ENABLE ROW LEVEL SECURITY;

-- Anyone can view open jobs
CREATE POLICY "Anyone can view open jobs" ON public.babysitting_jobs
  FOR SELECT USING (true);

-- Parents can insert their own jobs
CREATE POLICY "Parents can insert own jobs" ON public.babysitting_jobs
  FOR INSERT TO authenticated WITH CHECK (parent_id = auth.uid());

-- Parents can update their own jobs
CREATE POLICY "Parents can update own jobs" ON public.babysitting_jobs
  FOR UPDATE TO authenticated USING (parent_id = auth.uid()) WITH CHECK (parent_id = auth.uid());

-- Parents can delete their own jobs
CREATE POLICY "Parents can delete own jobs" ON public.babysitting_jobs
  FOR DELETE TO authenticated USING (parent_id = auth.uid());
