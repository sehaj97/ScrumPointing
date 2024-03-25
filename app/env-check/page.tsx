"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function EnvCheck() {
  const [envVars, setEnvVars] = useState({
    supabaseUrl: "",
    supabaseKeyAvailable: false,
  })

  useEffect(() => {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("Environment variables check:")
    console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl)
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY available:", !!supabaseKey)

    setEnvVars({
      supabaseUrl: supabaseUrl || "",
      supabaseKeyAvailable: !!supabaseKey,
    })
  }, [])

  const allEnvVarsSet = envVars.supabaseUrl && envVars.supabaseKeyAvailable

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Environment Variables Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              className={`p-4 rounded-md ${allEnvVarsSet ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              <div className="flex items-center gap-2">
                {allEnvVarsSet ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <p className="font-medium">
                  {allEnvVarsSet
                    ? "All environment variables are set correctly!"
                    : "Missing required environment variables!"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Environment Variables:</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL</span>
                  <span className={envVars.supabaseUrl ? "text-green-500" : "text-red-500"}>
                    {envVars.supabaseUrl ? "✓" : "✗"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                  <span className={envVars.supabaseKeyAvailable ? "text-green-500" : "text-red-500"}>
                    {envVars.supabaseKeyAvailable ? "✓" : "✗"}
                  </span>
                </div>
              </div>
            </div>

            {!allEnvVarsSet && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="mb-2">Please set the missing environment variables:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    {!envVars.supabaseUrl && <li>Add NEXT_PUBLIC_SUPABASE_URL to your environment</li>}
                    {!envVars.supabaseKeyAvailable && <li>Add NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment</li>}
                  </ol>
                  <p className="mt-2 text-sm">
                    These should be added to your Vercel project environment variables or .env.local file.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/">Return Home</Link>
          </Button>
          {allEnvVarsSet && (
            <Button asChild>
              <Link href="/test-connection">Test Connection</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

