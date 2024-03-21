"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, AlertCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ConnectionStatusProps = {
  status: "disconnected" | "connecting" | "connected" | "error"
  connectedPeers: string[]
}

export function ConnectionStatus({ status, connectedPeers }: ConnectionStatusProps) {
  const [visible, setVisible] = useState(true)

  // Hide after 10 seconds if connected
  useEffect(() => {
    if (status === "connected") {
      const timer = setTimeout(() => {
        setVisible(false)
      }, 10000)

      return () => clearTimeout(timer)
    } else {
      setVisible(true)
    }
  }, [status])

  if (!visible) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="fixed top-4 right-4 cursor-pointer hover:bg-muted"
              onClick={() => setVisible(true)}
            >
              <Wifi className="h-3 w-3 mr-1" />
              {connectedPeers.length} peers
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to show connection details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md px-3 py-2 text-sm shadow-lg transition-all duration-300 ${
        status === "connected"
          ? "bg-green-100 text-green-800 border border-green-200"
          : status === "connecting"
            ? "bg-blue-100 text-blue-800 border border-blue-200"
            : status === "error"
              ? "bg-red-100 text-red-800 border border-red-200"
              : "bg-gray-100 text-gray-800 border border-gray-200"
      }`}
    >
      {status === "connected" ? (
        <Wifi className="h-4 w-4" />
      ) : status === "connecting" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : status === "error" ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}

      <div>
        <span className="font-medium">
          {status === "connected"
            ? "Connected"
            : status === "connecting"
              ? "Connecting..."
              : status === "error"
                ? "Connection Error"
                : "Disconnected"}
        </span>
        {status === "connected" && (
          <span className="ml-1 text-xs">
            ({connectedPeers.length} peer{connectedPeers.length !== 1 ? "s" : ""})
          </span>
        )}
        <button className="ml-4 text-xs underline" onClick={() => setVisible(false)}>
          Hide
        </button>
      </div>
    </div>
  )
}

