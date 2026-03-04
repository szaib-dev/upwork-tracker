import { createClient } from "@supabase/supabase-js";

// Make sure to add these to your .env.local file!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);