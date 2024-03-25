"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, CheckCircle, Trash2 } from "lucide-react"
import Link from "next/link"

export default function CleanupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [result, setResult] = useState<any>(null)

  const runCleanup = async () => {
    try {
      setStatus("loading")

      const response = await fetch("/api/cleanup")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run cleanup")
      }

      setResult(data)
      setStatus("success")
    } catch (error) {
      console.error("Cleanup error:", error)
      setResult({ error: error.message })
      setStatus("error")
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Session Cleanup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>This utility will delete all expired sessions (older than 1 hour) and their associated data.</p>

          {status === "loading" && (
            <div className="flex items-center justify-center p-4">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Running cleanup...</span>
            </div>
          )}

          {status === "success" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                {result.message}
                {result.deletedSessions && result.deletedSessions.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Deleted sessions:</p>
                    <ul className="list-disc pl-5 mt-1">
                      {result.deletedSessions.map((id: string) => (
                        <li key={id} className="font-mono text-sm">
                          {id}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{result?.error || "An unknown error occurred"}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/">Return Home</Link>
          </Button>
          <Button
            onClick={runCleanup}
            disabled={status === "loading"}
            variant={status === "success" ? "outline" : "default"}
          >
            {status === "loading" ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : status === "success" ? (
              "Run Again"
            ) : (
              "Run Cleanup"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

