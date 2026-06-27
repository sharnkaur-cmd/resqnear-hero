// ResQNear — runtime configuration
// NOTE: Supabase URL + anon key are publishable (RLS-protected) and safe in client code.
// The Gemini key lives server-side as LOVABLE_API_KEY (Lovable AI Gateway) — never expose.

export const SUPABASE_URL = "https://ecrldbkhimdqlzyhwmsu.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcmxkYmtoaW1kcWx6eWh3bXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NDU3NzQsImV4cCI6MjA5ODEyMTc3NH0.hIaOxfMBHOLMK-6leFp_9WDtJnPR9l7l7L18sV7mXLY";

export const APP_NAME = "ResQNear";
export const APP_TAGLINE = "Your nearest hero. In seconds.";
export const EMERGENCY_NUMBER_IN = "112"; // India unified emergency — never 911
