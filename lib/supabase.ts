import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Participant = {
  id: string
  session_id: string
  name: string
  vote: string | null
  created_at?: string
}

export type Session = {
  id: string
  story: string
  revealed: boolean
  created_at?: string
  updated_at?: string
}

