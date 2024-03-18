"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { nanoid } from "nanoid"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking")

  // Check Supabase connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("Checking Supabase connection...")

        // Log environment variables (without exposing full key)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        console.log("Supabase URL:", supabaseUrl)
        console.log("Supabase Key available:", !!supabaseKey)

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Missing Supabase environment variables")
        }

        const supabase = createClient()
        const { error } = await supabase.from("sessions").select("id").limit(1)

        if (error) throw error

        setConnectionStatus("connected")
      } catch (err) {
        console.error("Supabase connection error:", err)
        setConnectionStatus("error")
        setError(`Database connection error: ${err.message}. Please check your environment variables.`)
      }
    }

    checkConnection()
  }, [])

  const createSession = async () => {
    if (!userName.trim()) {
      setError("Please enter your name")
      return
    }

    setIsCreating(true)
    setError("")

    try {
      const supabase = createClient()
      const newSessionId = nanoid(6).toUpperCase()
      const userId = nanoid()

      // Set expiration time to 1 hour from now
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1)

      const { error: sessionError } = await supabase.from("sessions").insert({
        id: newSessionId,
        story: "Sample User Story",
        revealed: false,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })

      if (sessionError) throw sessionError

      const { error: participantError } = await supabase.from("participants").insert({
        id: userId,
        session_id: newSessionId,
        name: userName,
        is_host: true,
      })

      if (participantError) throw participantError

      router.push(`/session/${newSessionId}?user=${encodeURIComponent(userName)}&userId=${userId}`)
    } catch (err) {
      console.error("Error creating session:", err)
      setError(`Failed to create session: ${err.message || "Unknown error"}`)
      setIsCreating(false)
    }
  }

  const joinSession = async () => {
    if (!sessionId.trim() || !userName.trim()) {
      setError("Please enter both session ID and your name")
      return
    }

    setIsJoining(true)
    setError("")

    try {
      const supabase = createClient()

      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select()
        .eq("id", sessionId.toUpperCase())
        .single()

      if (sessionError || !sessionData) {
        setError("Session not found")
        setIsJoining(false)
        return
      }

      // Check if session is expired
      if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
        setError("This session has expired")
        setIsJoining(false)
        return
      }

      const userId = nanoid()

      await supabase.from("participants").insert({
        id: userId,
        session_id: sessionId.toUpperCase(),
        name: userName,
        is_host: false,
      })

      router.push(`/session/${sessionId.toUpperCase()}?user=${encodeURIComponent(userName)}&userId=${userId}`)
    } catch (err) {
      console.error("Error joining session:", err)
      setError(`Failed to join session: ${err.message || "Unknown error"}`)
      setIsJoining(false)
    }
  }

  if (connectionStatus === "checking") {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Connecting to database...</p>
        </div>
      </div>
    )
  }

  if (connectionStatus === "error") {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Could not connect to the database. Please check your environment variables."}
          </AlertDescription>
          <div className="mt-4">
            <p className="text-sm mb-2">Make sure you have set the following environment variables:</p>
            <ul className="list-disc pl-5 text-sm">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
            <Button variant="outline" className="mt-4 w-full" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Story Point Estimator</CardTitle>
          <CardDescription className="text-center">
            Collaborate with your team to estimate story points in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={createSession} disabled={isCreating || isJoining || !userName.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create New Session"
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or join existing</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session">Session ID</Label>
              <Input
                id="session"
                placeholder="Enter session ID"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value.toUpperCase())}
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={joinSession}
              disabled={isCreating || isJoining || !sessionId.trim() || !userName.trim()}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Session"
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <p className="text-xs text-muted-foreground text-center">
            Create a session and share the link with your team members to start estimating
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

