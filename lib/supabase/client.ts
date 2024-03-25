import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Cache the client to avoid creating multiple instances
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export const createClient = () => {
  // Return cached client if it exists
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Log environment variable availability for debugging
  console.log("Supabase URL:", supabaseUrl)
  console.log("Supabase Key available:", !!supabaseKey)

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  // Create and cache the client with default options
  supabaseClient = createSupabaseClient(supabaseUrl, supabaseKey)

  return supabaseClient
}

