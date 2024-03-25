"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"

type SyncIndicatorProps = {
  status: "idle" | "syncing" | "updated" | "error"
  lastSyncTime: number
  onManualSync?: () => void
}

export function SyncIndicator({ status, lastSyncTime, onManualSync }: SyncIndicatorProps) {
  const [visible, setVisible] = useState(false)

  // Show the indicator when status changes to syncing or updated
  useEffect(() => {
    if (status === "syncing" || status === "updated" || status === "error") {
      setVisible(true)

      // Hide after 3 seconds if status is "updated"
      if (status === "updated") {
        const timer = setTimeout(() => {
          setVisible(false)
        }, 3000)

        return () => clearTimeout(timer)
      }
    } else if (status === "idle") {
      // Keep visible for a moment after syncing
      const timer = setTimeout(() => {
        setVisible(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [status])

  if (!visible) return null

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md px-3 py-2 text-sm shadow-lg transition-all duration-300 ${
        status === "syncing"
          ? "bg-blue-100 text-blue-800"
          : status === "updated"
            ? "bg-green-100 text-green-800"
            : status === "error"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
      }`}
    >
      <RefreshCw
        className={`h-4 w-4 ${status === "syncing" ? "animate-spin" : ""}`}
        onClick={onManualSync}
        style={{ cursor: onManualSync ? "pointer" : "default" }}
      />
      <span>
        {status === "syncing"
          ? "Syncing..."
          : status === "updated"
            ? "Session updated"
            : status === "error"
              ? "Sync error"
              : `Last synced: ${formatTime(lastSyncTime)}`}
      </span>
    </div>
  )
}

