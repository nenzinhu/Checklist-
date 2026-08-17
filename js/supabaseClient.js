import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://krobkdattcbxrbhlidlb.supabase.co";
const SUPABASE_KEY = "sb_publishable_5CWUKKQtmwkLgbih-wKH7g_-UKA4uOQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});
