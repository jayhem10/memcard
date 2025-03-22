import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfktvasaabzakygkwxbb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxma3R2YXNhYWJ6YWt5Z2t3eGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MjAyNzEsImV4cCI6MjA1NzI5NjI3MX0.lSGmfBTJIdDM0QZFh0LmzTz6ryd-rUuODK6wHXIsmVY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
