"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Clock } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { nanoid } from "nanoid"
import { SessionTimer } from "@/components/session-timer"

export default function JoinPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")
  const [sessionData, setSessionData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true)
        console.log(`Checking session ${params.id} (Attempt ${retryCount + 1})`)

        const supabase = createClient()

        const { data, error } = await supabase
          .from("sessions")
          .select(`
            id,
            story,
            created_at,
            expires_at,
            participants:participants(id, name)
          `)
          .eq("id", params.id)
          .single()

        if (error) throw error

        // Check if session is expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setError("This session has expired")
          setIsLoading(false)
          return
        }

        // Calculate time remaining
        if (data.expires_at) {
          const expiresAt = new Date(data.expires_at).getTime()
          const now = new Date().getTime()
          setTimeRemaining(Math.max(0, expiresAt - now))
        }

        setSessionData(data)
        setIsLoading(false)
        setError("")
      } catch (err) {
        console.error("Error checking session:", err)

        // If we've tried less than 3 times, retry
        if (retryCount < 3) {
          setRetryCount((prev) => prev + 1)
          // Exponential backoff
          const delay = Math.pow(2, retryCount) * 1000
          console.log(`Retrying in ${delay}ms...`)
          setTimeout(checkSession, delay)
        } else {
          setError("Session not found or connection error. Please check your link and try again.")
          setIsLoading(false)
        }
      }
    }

    checkSession()
  }, [params.id, retryCount])

  // Update timer
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (!prev) return null

        const newTime = prev - 1000
        if (newTime <= 0) {
          setError("This session has expired")
          clearInterval(timer)
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  const handleJoin = async () => {
    if (!userName.trim()) {
      setError("Please enter your name")
      return
    }

    setIsJoining(true)
    setError("")

    try {
      const supabase = createClient()
      const userId = nanoid()

      const { error } = await supabase.from("participants").insert({
        id: userId,
        session_id: params.id,
        name: userName,
        is_host: false,
      })

      if (error) throw error

      router.push(`/session/${params.id}?user=${encodeURIComponent(userName)}&userId=${userId}`)
    } catch (err) {
      console.error("Error joining session:", err)
      setError(`Failed to join session: ${err.message || "Unknown error"}`)
      setIsJoining(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(0)
    setError("")
  }

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{retryCount > 0 ? `Retrying connection (Attempt ${retryCount})...` : "Checking session..."}</p>
          {retryCount > 0 && (
            <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!sessionData && error) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">Return Home</Link>
            </Button>
            <Button onClick={handleRetry} className="flex-1">
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader>
          <CardTitle>Join Estimation Session</CardTitle>
          <CardDescription>
            You're joining a session with {sessionData.participants.length} participants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          <div className="text-sm">
            <p>
              <span className="font-medium">Session ID:</span> {sessionData.id}
            </p>
            <p>
              <span className="font-medium">Created:</span> {new Date(sessionData.created_at).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Participants:</span> {sessionData.participants.length}
            </p>
            {timeRemaining !== null && (
              <p className="flex items-center gap-1 mt-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-medium">Expires in:</span> <SessionTimer timeRemaining={timeRemaining} inline />
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/">Cancel</Link>
          </Button>
          <Button onClick={handleJoin} disabled={isJoining || !userName.trim()}>
            {isJoining ? "Joining..." : "Join Session"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

