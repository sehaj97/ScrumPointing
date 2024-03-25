"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CreateSession() {
  const router = useRouter()
  const [sessionName, setSessionName] = useState("")
  const [userName, setUserName] = useState("")
  const [votingSystem, setVotingSystem] = useState("fibonacci")
  const [sessionLink, setSessionLink] = useState("")

  const handleCreateSession = () => {
    // In a real app, we would create the session on the server
    // For now, we'll generate a random session ID
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Store session data in localStorage for demo purposes
    localStorage.setItem(
      `session-${sessionId}`,
      JSON.stringify({
        id: sessionId,
        name: sessionName,
        creator: userName,
        votingSystem,
        stories: [],
        participants: [{ name: userName, id: "user-1" }],
        created: new Date().toISOString(),
      }),
    )

    // Set the shareable link
    setSessionLink(`${window.location.origin}/join/${sessionId}`)

    // Store initial participant count
    localStorage.setItem(`participant-count-${sessionId}`, "1")

    // Navigate to the session page after a short delay
    setTimeout(() => {
      router.push(`/session/${sessionId}?user=${encodeURIComponent(userName)}`)
    }, 2000)
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Estimation Session</CardTitle>
          <CardDescription>Set up a new session for your team to estimate story points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              placeholder="Sprint 42 Planning"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
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
          <div className="space-y-2">
            <Label htmlFor="voting-system">Voting System</Label>
            <Select value={votingSystem} onValueChange={setVotingSystem}>
              <SelectTrigger id="voting-system">
                <SelectValue placeholder="Select a voting system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fibonacci">Fibonacci (1, 2, 3, 5, 8, 13, 21)</SelectItem>
                <SelectItem value="modified">Modified Fibonacci (0, ½, 1, 2, 3, 5, 8, 13, 20, 40, 100)</SelectItem>
                <SelectItem value="tshirt">T-Shirt Sizes (XS, S, M, L, XL, XXL)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        {sessionLink && (
          <Alert className="bg-green-50 text-green-800 border-green-200 mt-4">
            <div className="flex flex-col gap-2">
              <AlertTitle>Session created successfully!</AlertTitle>
              <AlertDescription>
                Share this link with your team:
                <div className="flex items-center gap-2 mt-2">
                  <Input value={sessionLink} readOnly />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(sessionLink)
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-sm mt-2">Redirecting you to the session...</p>
              </AlertDescription>
            </div>
          </Alert>
        )}
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleCreateSession}
            disabled={!sessionName || !userName || sessionLink !== ""}
          >
            {sessionLink ? "Creating..." : "Create Session"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

