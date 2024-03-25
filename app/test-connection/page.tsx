"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function TestConnection() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState("")
  const [tables, setTables] = useState<{ name: string; exists: boolean }[]>([])
  const [envVars, setEnvVars] = useState({
    url: "",
    keyAvailable: false,
  })

  const testConnection = async () => {
    setStatus("loading")
    setMessage("Testing connection to Supabase...")

    try {
      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      setEnvVars({
        url: supabaseUrl || "",
        keyAvailable: !!supabaseKey,
      })

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase environment variables")
      }

      // Create client and test connection
      const supabase = createClient()

      // Test if we can connect at all
      const { error: pingError } = await supabase.from("sessions").select("count").limit(1)

      // Check for specific tables directly
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
      setTables(tableResults)

      const missingTables = tableResults.filter((r) => !r.exists).map((r) => r.name)

      if (pingError) {
        // If we can't even ping, there's a connection issue
        throw pingError
      } else if (missingTables.length > 0) {
        // If some tables are missing, show a warning
        setDetails(`Warning: Missing required tables: ${missingTables.join(", ")}. Please create them.`)
        setStatus("success")
        setMessage("Connected to Supabase, but some tables are missing.")
      } else {
        // All good!
        setDetails("All required tables are present.")
        setStatus("success")
        setMessage("Successfully connected to Supabase!")
      }
    } catch (err) {
      console.error("Connection test failed:", err)
      setStatus("error")
      setMessage(`Connection failed: ${err.message || "Unknown error"}`)
      setDetails(JSON.stringify(err, null, 2))
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              className={`p-4 rounded-md ${
                status === "loading"
                  ? "bg-yellow-50 text-yellow-800"
                  : status === "success"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {status === "loading" && <RefreshCw className="h-4 w-4 animate-spin" />}
                {status === "error" && <AlertCircle className="h-4 w-4" />}
                <p className="font-medium">{message}</p>
              </div>

              {details && (
                <div className="mt-2 text-sm">
                  <p>{details}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Environment Variables:</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL:</span>{" "}
                  {envVars.url ? envVars.url : <span className="text-red-500">Not set</span>}
                </p>
                <p>
                  <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>{" "}
                  {envVars.keyAvailable ? (
                    <span className="text-green-500">Set</span>
                  ) : (
                    <span className="text-red-500">Not set</span>
                  )}
                </p>
              </div>
            </div>

            {tables.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Required Tables:</h3>
                <div className="space-y-1">
                  {tables.map((table) => (
                    <div key={table.name} className="flex items-center justify-between">
                      <span className="font-mono text-sm">{table.name}</span>
                      <span className={table.exists ? "text-green-500" : "text-red-500"}>
                        {table.exists ? "✓" : "✗"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="mb-2">Make sure you have:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Set up the Supabase project correctly</li>
                    <li>Added the correct environment variables</li>
                    <li>Created the required database tables</li>
                  </ol>
                </AlertDescription>
              </Alert>
            )}

            {status === "success" && tables.some((t) => !t.exists) && (
              <Alert>
                <AlertDescription>
                  <p>Some required tables are missing. You need to create them for the app to work properly.</p>
                  <Button variant="outline" className="mt-2" asChild>
                    <Link href="/create-tables">Create Tables</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/">Return Home</Link>
          </Button>
          <Button onClick={testConnection} disabled={status === "loading"}>
            {status === "loading" ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Again"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

