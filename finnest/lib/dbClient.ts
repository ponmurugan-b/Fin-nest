import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iclqoisbfheickytvpgp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljbHFvaXNiZmhlaWNreXR2cGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNjI4MjMsImV4cCI6MjA4MDczODgyM30.k0BvyBV0BpYGMoXybqAzuU1qULW0KY-kn7RcWVK9wQ8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
