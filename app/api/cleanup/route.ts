import { createClient } from "@/lib/supabase/client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Get current time
    const now = new Date().toISOString()

    // Find expired sessions
    const { data: expiredSessions, error: findError } = await supabase
      .from("sessions")
      .select("id")
      .lt("expires_at", now)

    if (findError) {
      throw findError
    }

    if (!expiredSessions || expiredSessions.length === 0) {
      return NextResponse.json({ message: "No expired sessions found" })
    }

    const expiredSessionIds = expiredSessions.map((session) => session.id)

    // Delete expired sessions (cascade will delete related participants and votes)
    const { error: deleteError } = await supabase.from("sessions").delete().in("id", expiredSessionIds)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      message: `Successfully deleted ${expiredSessionIds.length} expired sessions`,
      deletedSessions: expiredSessionIds,
    })
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error)
    return NextResponse.json({ error: `Failed to clean up expired sessions: ${error.message}` }, { status: 500 })
  }
}

