"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function JoinSession() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState("")
  const [userName, setUserName] = useState("")
  const [error, setError] = useState("")

  const handleJoinSession = () => {
    // In a real app, we would validate the session on the server
    // For now, we'll check localStorage
    const sessionData = localStorage.getItem(`session-${sessionId}`)

    if (!sessionData) {
      setError("Session not found. Please check the session ID.")
      return
    }

    // Add user to the session
    const session = JSON.parse(sessionData)
    const userId = `user-${session.participants.length + 1}`

    session.participants.push({
      id: userId,
      name: userName,
    })

    localStorage.setItem(`session-${sessionId}`, JSON.stringify(session))

    // Navigate to the session page
    router.push(`/session/${sessionId}?user=${encodeURIComponent(userName)}`)
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Estimation Session</CardTitle>
          <CardDescription>Enter the session ID and your name to join</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-id">Session ID</Label>
            <Input
              id="session-id"
              placeholder="ABC123"
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value.toUpperCase())
                setError("")
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="your-name">Your Name</Label>
            <Input
              id="your-name"
              placeholder="John Doe"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          {error && <div className="text-sm font-medium text-destructive">{error}</div>}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleJoinSession} disabled={!sessionId || !userName}>
            Join Session
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

