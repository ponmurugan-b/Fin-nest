import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iksslxcwpdbshfhcpxrg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrc3NseGN3cGRic2hmaGNweHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjMzNTksImV4cCI6MjA4MDU5OTM1OX0.LJCpwjIBJeTV2Nb9AY46F74TtInovkYsE8KQhjKHHWY';

export const supabase = createClient(supabaseUrl, supabaseKey);