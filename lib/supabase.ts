import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/** คืน client เมื่อมี env ครบ — ไม่ throw ตอน build / ตอนไม่ได้ตั้งค่า Vercel */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  if (!cached) cached = createClient(url, key);
  return cached;
}
