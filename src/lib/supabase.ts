import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type HeroRow = {
  name: string;
  phone: string;
  skill: string;
  locality: string;
  pincode: string;
  available: boolean;
};

export type EmergencyRow = {
  type: string;
  lat: number | null;
  lon: number | null;
  hero_name: string;
  severity?: string;
  severity_score?: number;
};

export async function saveHero(row: HeroRow) {
  return supabase.from("heroes").insert(row);
}

export async function saveEmergency(row: EmergencyRow) {
  return supabase.from("emergencies").insert(row);
}
