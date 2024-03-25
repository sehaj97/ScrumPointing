"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Check } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CreateTables() {
  const [copied, setCopied] = useState(false)

  const sqlScript = `
-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  story TEXT NOT NULL,
  revealed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  participant_id TEXT PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_participants_session_id ON participants(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_session_id ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Enable row level security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- In a production environment, you would want more restrictive policies
CREATE POLICY "Allow public read access to sessions" ON sessions
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to sessions" ON sessions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to sessions" ON sessions
FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to participants" ON participants
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to participants" ON participants
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to votes" ON votes
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to votes" ON votes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to votes" ON votes
FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to votes" ON votes
FOR DELETE USING (true);
`

  const realtimeScript = `
-- Enable realtime subscriptions for these tables
BEGIN;
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Create Database Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                <p className="mb-2">To set up your database, follow these steps:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Copy the SQL script below</li>
                  <li>
                    Go to your{" "}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Supabase Dashboard
                    </a>
                  </li>
                  <li>Select your project</li>
                  <li>Go to the SQL Editor</li>
                  <li>Paste the script and run it</li>
                </ol>
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="tables">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tables">Tables & Policies</TabsTrigger>
                <TabsTrigger value="realtime">Realtime Setup</TabsTrigger>
              </TabsList>

              <TabsContent value="tables" className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-sm">{sqlScript}</pre>
                  <Button size="sm" className="absolute top-2 right-2" onClick={() => copyToClipboard(sqlScript)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <Alert>
                  <AlertDescription>
                    This script creates the tables, indexes, and security policies needed for the application.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="realtime" className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-sm">{realtimeScript}</pre>
                  <Button size="sm" className="absolute top-2 right-2" onClick={() => copyToClipboard(realtimeScript)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <Alert>
                  <AlertDescription>
                    <p>
                      This script enables realtime functionality for the tables. Run this after creating the tables.
                    </p>
                    <p className="mt-2 text-sm">
                      Note: You may need to enable realtime in your Supabase project settings first.
                    </p>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/test-connection">Back to Test</Link>
          </Button>
          <Button asChild>
            <Link href="/">Go to App</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

