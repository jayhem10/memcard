-- Fix RLS policies for user_quiz_answers to allow service_role to insert
-- This is needed for the API route that uses supabaseAdmin

-- Allow service_role to bypass RLS for insert/update operations
CREATE POLICY "Service role can insert quiz answers"
ON public.user_quiz_answers FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update quiz answers"
ON public.user_quiz_answers FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Also ensure service_role has the necessary grants
GRANT SELECT, INSERT, UPDATE ON public.user_quiz_answers TO service_role;


