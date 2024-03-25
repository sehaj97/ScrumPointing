"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Types
type Story = {
  id: string
  title: string
  description: string
  votes: any[]
  finalEstimate: string | null
  status: "pending" | "voting" | "discussing" | "completed"
}

type Session = {
  id: string
  name: string
  creator: string
  votingSystem: string
  stories: Story[]
  participants: any[]
  created: string
}

export default function VelocityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)

  // Load session data
  useEffect(() => {
    const sessionData = localStorage.getItem(`session-${params.id}`)
    if (sessionData) {
      setSession(JSON.parse(sessionData))
    } else {
      // Session not found, redirect to home
      router.push("/")
    }
  }, [params.id, router])

  // Calculate team velocity
  const calculateVelocity = () => {
    if (!session) return 0

    const completedStories = session.stories.filter((s) => s.status === "completed" && s.finalEstimate)

    if (completedStories.length === 0) return 0

    // For T-shirt sizes, we need to convert to numbers
    if (session.votingSystem === "tshirt") {
      const sizeToPoints: Record<string, number> = {
        XS: 1,
        S: 2,
        M: 3,
        L: 5,
        XL: 8,
        XXL: 13,
      }

      return completedStories.reduce((sum, story) => {
        return sum + (story.finalEstimate ? sizeToPoints[story.finalEstimate] || 0 : 0)
      }, 0)
    }

    // For numeric estimates
    return completedStories.reduce((sum, story) => {
      const estimate = story.finalEstimate === "½" ? 0.5 : Number.parseFloat(story.finalEstimate || "0")
      return sum + (isNaN(estimate) ? 0 : estimate)
    }, 0)
  }

  // Get distribution of story points
  const getPointsDistribution = () => {
    if (!session) return {}

    const completedStories = session.stories.filter((s) => s.status === "completed" && s.finalEstimate)
    const distribution: Record<string, number> = {}

    completedStories.forEach((story) => {
      if (story.finalEstimate) {
        distribution[story.finalEstimate] = (distribution[story.finalEstimate] || 0) + 1
      }
    })

    return distribution
  }

  // Get average story points
  const getAveragePoints = () => {
    if (!session) return 0

    const completedStories = session.stories.filter((s) => s.status === "completed" && s.finalEstimate)

    if (completedStories.length === 0) return 0

    // For T-shirt sizes, we need to convert to numbers
    if (session.votingSystem === "tshirt") {
      const sizeToPoints: Record<string, number> = {
        XS: 1,
        S: 2,
        M: 3,
        L: 5,
        XL: 8,
        XXL: 13,
      }

      const totalPoints = completedStories.reduce((sum, story) => {
        return sum + (story.finalEstimate ? sizeToPoints[story.finalEstimate] || 0 : 0)
      }, 0)

      return totalPoints / completedStories.length
    }

    // For numeric estimates
    const totalPoints = completedStories.reduce((sum, story) => {
      const estimate = story.finalEstimate === "½" ? 0.5 : Number.parseFloat(story.finalEstimate || "0")
      return sum + (isNaN(estimate) ? 0 : estimate)
    }, 0)

    return totalPoints / completedStories.length
  }

  if (!session) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading session...</h1>
        </div>
      </div>
    )
  }

  const pointsDistribution = getPointsDistribution()
  const averagePoints = getAveragePoints()

  return (
    <div className="container py-6">
      <header className="flex items-center mb-6">
        <Link href={`/session/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-2">Team Velocity</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Session Summary</CardTitle>
            <CardDescription>{session.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Total Stories</h3>
              <p className="text-2xl font-bold">{session.stories.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Completed Stories</h3>
              <p className="text-2xl font-bold">{session.stories.filter((s) => s.status === "completed").length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Total Story Points</h3>
              <p className="text-2xl font-bold">{calculateVelocity()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Average Points Per Story</h3>
              <p className="text-2xl font-bold">{averagePoints.toFixed(1)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Team Members</h3>
              <p className="text-2xl font-bold">{session.participants.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Story Point Distribution</CardTitle>
            <CardDescription>Distribution of story points across completed stories</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(pointsDistribution).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No completed stories yet</p>
                <p className="text-sm mt-2">Complete some stories to see the distribution</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Object.entries(pointsDistribution).map(([point, count]) => (
                    <div key={point} className="text-center p-4 border rounded-md">
                      <h3 className="text-2xl font-bold">{point}</h3>
                      <p className="text-sm text-muted-foreground">
                        {count} {count === 1 ? "story" : "stories"}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-4">Completed Stories</h3>
                  <div className="space-y-2">
                    {session.stories
                      .filter((s) => s.status === "completed")
                      .map((story) => (
                        <div key={story.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <h4 className="font-medium">{story.title}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {story.description.substring(0, 60)}
                              {story.description.length > 60 ? "..." : ""}
                            </p>
                          </div>
                          <Badge>{story.finalEstimate}</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

