import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sdvxekymbfyrznhuvvtj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdnhla3ltYmZ5cnpuaHV2dnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjEyNTIsImV4cCI6MjA4NTIzNzI1Mn0.caFk5KsAd5-VC6mwmRuk3lYyTqQDI5vgWIGclU-d4mc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
