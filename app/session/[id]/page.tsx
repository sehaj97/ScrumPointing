"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertCircle, RefreshCw, Eye, ArrowLeft, Copy, Check, Share2, Clock, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { SessionTimer } from "@/components/session-timer"

type Participant = {
  id: string
  session_id: string
  name: string
  is_host: boolean
}

type Vote = {
  participant_id: string
  session_id: string
  value: string | null
}

type Session = {
  id: string
  story: string
  revealed: boolean
  created_at: string
  expires_at?: string
}

export default function SessionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userName = searchParams?.get("user") || ""
  const userId = searchParams?.get("userId") || ""

  const [session, setSession] = useState<Session | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [currentUser, setCurrentUser] = useState<Participant | null>(null)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [missingTables, setMissingTables] = useState<string[]>([])
  const [sessionExpired, setSessionExpired] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  const storyPoints = ["1", "2", "3", "5", "8", "13", "21", "?"]

  // Check if tables exist
  const checkTables = useCallback(async () => {
    try {
      const supabase = createClient()
      const requiredTables = ["sessions", "participants", "votes"]
      const tableCheckPromises = requiredTables.map((table) =>
        supabase
          .from(table)
          .select("count")
          .limit(1)
          .then((result) => ({ name: table, exists: !result.error }))
          .catch(() => ({ name: table, exists: false })),
      )

      const tableResults = await Promise.all(tableCheckPromises)
      const missing = tableResults.filter((r) => !r.exists).map((r) => r.name)

      setMissingTables(missing)
      return missing.length === 0
    } catch (err) {
      console.error("Error checking tables:", err)
      return false
    }
  }, [])

  // Load session data with retry logic
  const loadSessionData = useCallback(async () => {
    if (!userId || !userName) {
      router.push("/")
      return
    }

    try {
      setIsLoading(true)
      setIsRetrying(retryCount > 0)

      // First check if tables exist
      const tablesExist = await checkTables()

      if (!tablesExist) {
        setError("Database tables are missing. Please set up the database first.")
        setIsLoading(false)
        return
      }

      console.log(`Loading session data for ID: ${params.id} (Attempt ${retryCount + 1})`)

      const supabase = createClient()

      // Fetch session data
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select()
        .eq("id", params.id)
        .single()

      if (sessionError) {
        console.error("Session fetch error:", sessionError)
        throw sessionError
      }

      console.log("Session data loaded:", sessionData)

      // Check if session is expired
      if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
        setSessionExpired(true)
        setError("This session has expired.")
        setIsLoading(false)
        return
      }

      // Calculate time remaining
      if (sessionData.expires_at) {
        const expiresAt = new Date(sessionData.expires_at).getTime()
        const now = new Date().getTime()
        setTimeRemaining(Math.max(0, expiresAt - now))
      }

      setSession(sessionData)

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from("participants")
        .select()
        .eq("session_id", params.id)

      if (participantsError) throw participantsError

      setParticipants(participantsData)

      // Find current user
      const user = participantsData.find((p) => p.id === userId)
      if (user) {
        setCurrentUser(user)
      } else {
        // If user not found, add them
        const { data: newUser, error: newUserError } = await supabase
          .from("participants")
          .insert({
            id: userId,
            session_id: params.id,
            name: userName,
            is_host: false,
          })
          .select()
          .single()

        if (newUserError) throw newUserError

        setCurrentUser(newUser)
        setParticipants([...participantsData, newUser])
      }

      // Fetch votes
      const { data: votesData, error: votesError } = await supabase.from("votes").select().eq("session_id", params.id)

      if (votesError) throw votesError

      setVotes(votesData)

      // Set selected card if user has voted
      const userVote = votesData.find((v) => v.participant_id === userId)
      if (userVote) {
        setSelectedCard(userVote.value)
      } else {
        setSelectedCard(null)
      }

      setIsLoading(false)
      setError(null)
    } catch (err) {
      console.error("Error loading session:", err)

      // If we've tried less than 3 times, retry
      if (retryCount < 3) {
        setRetryCount((prev) => prev + 1)
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000
        console.log(`Retrying in ${delay}ms...`)
        setTimeout(loadSessionData, delay)
      } else {
        setError(
          `Failed to load session data: ${err.message || "Connection error"}. Please check your internet connection.`,
        )
        setIsLoading(false)
      }
    }
  }, [params.id, router, userName, userId, retryCount, checkTables])

  // Initial data load
  useEffect(() => {
    loadSessionData()
  }, [loadSessionData])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!session) return

    try {
      const supabase = createClient()

      const sessionSubscription = supabase
        .channel("session-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sessions",
            filter: `id=eq.${params.id}`,
          },
          (payload) => {
            setSession(payload.new as Session)

            if ((payload.new as Session).revealed !== (payload.old as Session).revealed) {
              if ((payload.new as Session).revealed) {
                showNotification("Votes have been revealed")
              } else {
                showNotification("Starting a new round")
                // Clear selected card when a new round starts
                setSelectedCard(null)
              }
            }
          },
        )
        .subscribe()

      const participantsSubscription = supabase
        .channel("participant-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "participants",
            filter: `session_id=eq.${params.id}`,
          },
          (payload) => {
            const newParticipant = payload.new as Participant
            setParticipants((prev) => {
              if (!prev.some((p) => p.id === newParticipant.id)) {
                showNotification(`${newParticipant.name} joined the session`)
                return [...prev, newParticipant]
              }
              return prev
            })
          },
        )
        .subscribe()

      const votesSubscription = supabase
        .channel("vote-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "votes",
            filter: `session_id=eq.${params.id}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              setVotes((prev) => {
                const existingIndex = prev.findIndex((v) => v.participant_id === (payload.new as Vote).participant_id)
                if (existingIndex >= 0) {
                  const updated = [...prev]
                  updated[existingIndex] = payload.new as Vote
                  return updated
                } else {
                  return [...prev, payload.new as Vote]
                }
              })
            } else if (payload.eventType === "DELETE") {
              setVotes((prev) => prev.filter((v) => v.participant_id !== (payload.old as Vote).participant_id))

              // If the current user's vote was deleted, clear the selected card
              if ((payload.old as Vote).participant_id === userId) {
                setSelectedCard(null)
              }
            }
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(sessionSubscription)
        supabase.removeChannel(participantsSubscription)
        supabase.removeChannel(votesSubscription)
      }
    } catch (err) {
      console.error("Error setting up realtime subscriptions:", err)
      showNotification("Failed to set up real-time updates")
    }
  }, [session, params.id, userId])

  // Handle session expiration
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (!prev) return null

        const newTime = prev - 1000
        if (newTime <= 0) {
          // Session expired
          setSessionExpired(true)
          setError("This session has expired.")
          clearInterval(timer)
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  const showNotification = (message: string) => {
    setNotification(message)
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const selectCard = async (value: string) => {
    if (!session || !currentUser || session.revealed) return

    try {
      const supabase = createClient()
      const existingVote = votes.find((v) => v.participant_id === userId)

      if (existingVote) {
        // Update existing vote
        const { error } = await supabase
          .from("votes")
          .update({ value })
          .eq("participant_id", userId)
          .eq("session_id", params.id)

        if (error) throw error
      } else {
        // Insert new vote
        const { error } = await supabase.from("votes").insert({
          participant_id: userId,
          session_id: params.id,
          value,
        })

        if (error) throw error
      }

      setSelectedCard(value)
    } catch (err) {
      console.error("Error voting:", err)
      showNotification("Failed to submit vote")
    }
  }

  const toggleReveal = async () => {
    if (!session || !currentUser?.is_host) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("sessions").update({ revealed: !session.revealed }).eq("id", params.id)

      if (error) throw error
    } catch (err) {
      console.error("Error toggling reveal:", err)
      showNotification("Failed to reveal/hide votes")
    }
  }

  const resetVotes = async () => {
    if (!session || !currentUser?.is_host) return

    try {
      const supabase = createClient()
      // First hide the votes
      const { error: revealError } = await supabase.from("sessions").update({ revealed: false }).eq("id", params.id)

      if (revealError) throw revealError

      // Then delete all votes
      const { error: deleteError } = await supabase.from("votes").delete().eq("session_id", params.id)

      if (deleteError) throw deleteError

      setSelectedCard(null)
    } catch (err) {
      console.error("Error resetting votes:", err)
      showNotification("Failed to reset votes")
    }
  }

  const copySessionLink = () => {
    const link = `${window.location.origin}/join/${params.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getAverageVote = () => {
    if (!session || !session.revealed) return null

    const numericVotes = votes
      .map((v) => v.value)
      .filter((v) => v !== null && v !== "?")
      .map((v) => Number.parseInt(v as string))
      .filter((v) => !isNaN(v))

    if (numericVotes.length === 0) return null

    const sum = numericVotes.reduce((acc, val) => acc + val, 0)
    return (sum / numericVotes.length).toFixed(1)
  }

  const handleRetry = () => {
    setRetryCount(0)
    setError(null)
    loadSessionData()
  }

  const allVoted = participants.length > 0 && votes.length === participants.length
  const averageVote = getAverageVote()

  if (missingTables.length > 0) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p>Database tables are missing. The following tables need to be created:</p>
            <ul className="list-disc pl-5 mt-2">
              {missingTables.map((table) => (
                <li key={table}>{table}</li>
              ))}
            </ul>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" asChild className="flex-1">
                <Link href="/">Return Home</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/create-tables">Create Tables</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">Return Home</Link>
            </Button>
            {!sessionExpired && (
              <Button onClick={handleRetry} className="flex-1">
                Retry
              </Button>
            )}
          </div>
        </Alert>
      </div>
    )
  }

  if (isLoading || !session || !currentUser) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{isRetrying ? `Retrying connection (Attempt ${retryCount})...` : "Loading session..."}</p>
          {isRetrying && (
            <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-5xl">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Story Point Estimation</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono">
                Session: {session.id}
              </Badge>
              <Badge variant="outline">{participants.length} participants</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {timeRemaining !== null && (
            <SessionTimer timeRemaining={timeRemaining} className={timeRemaining < 300000 ? "text-red-500" : ""} />
          )}

          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Session</DialogTitle>
                <DialogDescription>
                  Share this link with your team members to invite them to the session
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2 mt-4">
                <Input value={`${window.location.origin}/join/${params.id}`} readOnly className="font-mono text-sm" />
                <Button size="sm" onClick={copySessionLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Separator className="my-4" />
              <div className="text-sm text-muted-foreground">
                <p>
                  Session ID: <span className="font-mono font-medium">{params.id}</span>
                </p>
                <p className="mt-1">Anyone with this link can join your estimation session</p>
                {timeRemaining !== null && (
                  <p className="mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Session expires in <SessionTimer timeRemaining={timeRemaining} inline />
                  </p>
                )}
              </div>
              <DialogFooter className="mt-4">
                <Button onClick={() => setShowShareDialog(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {currentUser.is_host && (
            <>
              {session.revealed ? (
                <Button variant="default" size="sm" onClick={resetVotes} className="flex items-center gap-1">
                  New Round
                </Button>
              ) : (
                <Button
                  variant={allVoted ? "default" : "outline"}
                  size="sm"
                  onClick={toggleReveal}
                  disabled={!allVoted}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Reveal Cards
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      {timeRemaining !== null && timeRemaining < 300000 && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            This session will expire in <SessionTimer timeRemaining={timeRemaining} inline />. After expiration, the
            session and all data will be deleted.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">User Story</h2>
            <Card className="overflow-hidden border-0 shadow-md">
              <CardContent className="p-6">
                <p>{session.story}</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Your Estimation</h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {storyPoints.map((point) => (
                <button
                  key={point}
                  className={`aspect-[2/3] rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                    selectedCard === point
                      ? "border-primary bg-primary/10 shadow-md scale-105 transform"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                  onClick={() => selectCard(point)}
                  disabled={session.revealed}
                >
                  {point}
                </button>
              ))}
            </div>
          </div>

          {session.revealed && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Results</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-2">Average</h3>
                      <div className="text-4xl font-bold">{averageVote || "N/A"}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md overflow-hidden">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-2">Consensus</h3>
                      <div className="text-4xl font-bold">
                        {votes.length > 0 && votes.every((v) => v.value === votes[0].value && v.value !== null)
                          ? "Yes"
                          : "No"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Participants</h2>
          <div className="space-y-3">
            {participants.map((participant) => {
              const participantVote = votes.find((v) => v.participant_id === participant.id)
              return (
                <div
                  key={participant.id}
                  className={`p-4 rounded-lg border shadow-sm flex items-center justify-between ${
                    participant.id === currentUser.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {participant.id === currentUser.id ? "You" : ""}
                        {participant.is_host && (
                          <Badge variant="secondary" className="text-xs">
                            Host
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {session.revealed ? (
                      <Badge className="text-lg px-3 py-1">{participantVote?.value || "-"}</Badge>
                    ) : (
                      <Badge variant={participantVote ? "default" : "outline"} className="px-3 py-1">
                        {participantVote ? "Voted" : "Not voted"}
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {notification && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-md animate-in slide-in-from-right-5 z-50">
          {notification}
        </div>
      )}
    </div>
  )
}

