import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mfsbeekiiwyyutnuidqc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mc2JlZWtpaXd5eXV0bnVpZHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODcyNzAsImV4cCI6MjA5OTI2MzI3MH0.ilXoeU5-bf4HiYok0JS4OUj48dUsuibfr7pLQaUz5MM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
