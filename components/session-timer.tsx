"use client"

import { Clock } from "lucide-react"

interface SessionTimerProps {
  timeRemaining: number
  className?: string
  inline?: boolean
}

export function SessionTimer({ timeRemaining, className = "", inline = false }: SessionTimerProps) {
  // Format time remaining
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (inline) {
    return <span className={className}>{formatTime(timeRemaining)}</span>
  }

  return (
    <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md bg-muted ${className}`}>
      <Clock className="h-3.5 w-3.5" />
      <span>{formatTime(timeRemaining)}</span>
    </div>
  )
}

