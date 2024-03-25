"use client"

import { useState, useEffect } from "react"
import { AlertCircle, UserPlus, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type UpdateNotificationType = "participant" | "story" | "vote" | "estimate"

type UpdateNotificationProps = {
  type: UpdateNotificationType
  message: string
  duration?: number
  onClose?: () => void
}

export function UpdateNotification({ type, message, duration = 5000, onClose }: UpdateNotificationProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      if (onClose) onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!visible) return null

  const getIcon = () => {
    switch (type) {
      case "participant":
        return <UserPlus className="h-4 w-4" />
      case "story":
        return <FileText className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getColor = () => {
    switch (type) {
      case "participant":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "story":
        return "bg-green-100 text-green-800 border-green-200"
      case "vote":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "estimate":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Alert className={`${getColor()} shadow-md animate-in slide-in-from-right-5 duration-300`}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <AlertDescription>{message}</AlertDescription>
      </div>
    </Alert>
  )
}

