"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function PasteLinkPage() {
  const router = useRouter()
  const [link, setLink] = useState("")
  const [error, setError] = useState("")

  const handleJoinViaLink = () => {
    try {
      // Extract session ID from the link
      const url = new URL(link)
      const pathParts = url.pathname.split("/")
      const joinIndex = pathParts.findIndex((part) => part === "join")

      if (joinIndex === -1 || !pathParts[joinIndex + 1]) {
        setError("Invalid join link. Please check the link and try again.")
        return
      }

      const sessionId = pathParts[joinIndex + 1]

      // Redirect to the join page
      router.push(`/join/${sessionId}`)
    } catch (err) {
      setError("Invalid URL format. Please paste the complete link.")
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join via Link</CardTitle>
          <CardDescription>Paste the complete join link you received</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="join-link">Join Link</Label>
            <Input
              id="join-link"
              placeholder="https://example.com/join/ABC123"
              value={link}
              onChange={(e) => {
                setLink(e.target.value)
                setError("")
              }}
            />
            <p className="text-xs text-muted-foreground">
              The link should look like: https://yourdomain.com/join/ABC123
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleJoinViaLink} disabled={!link.trim()}>
            Join Session
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

