"use client"

import { useState, useEffect, useCallback } from "react"

type SyncOptions = {
  sessionId: string
  currentData: any
  onUpdate: (newData: any) => void
  pollingInterval?: number
  onNewParticipant?: (newParticipant: any) => void
  onNewStory?: (newStory: any) => void
}

export function useSessionSync({
  sessionId,
  currentData,
  onUpdate,
  pollingInterval = 2000, // Default polling every 2 seconds
  onNewParticipant,
  onNewStory,
}: SyncOptions) {
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now())
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "updated" | "error">("idle")

  // Function to check for updates
  const checkForUpdates = useCallback(() => {
    if (!sessionId || !currentData || isSyncing) return

    try {
      setIsSyncing(true)
      setSyncStatus("syncing")

      // Get the latest session data from localStorage
      const latestDataString = localStorage.getItem(`session-${sessionId}`)

      if (!latestDataString) {
        setSyncStatus("error")
        setIsSyncing(false)
        return
      }

      const latestData = JSON.parse(latestDataString)

      // Skip if the data hasn't changed
      if (JSON.stringify(latestData) === JSON.stringify(currentData)) {
        setSyncStatus("idle")
        setIsSyncing(false)
        return
      }

      // Check for new participants
      if (onNewParticipant && latestData.participants?.length > currentData.participants?.length) {
        const newParticipants = latestData.participants.slice(currentData.participants.length)
        newParticipants.forEach((participant) => {
          onNewParticipant(participant)
        })
      }

      // Check for new stories
      if (onNewStory && latestData.stories?.length > currentData.stories?.length) {
        const newStories = latestData.stories.slice(currentData.stories.length)
        newStories.forEach((story) => {
          onNewStory(story)
        })
      }

      // Update the data
      onUpdate(latestData)
      setSyncStatus("updated")
      setLastSyncTime(Date.now())

      // Reset status after a short delay
      setTimeout(() => {
        setSyncStatus("idle")
      }, 1000)
    } catch (error) {
      console.error("Error syncing session data:", error)
      setSyncStatus("error")
    } finally {
      setIsSyncing(false)
    }
  }, [sessionId, currentData, isSyncing, onUpdate, onNewParticipant, onNewStory])

  // Set up polling interval
  useEffect(() => {
    if (!sessionId) return

    // Initial check
    checkForUpdates()

    // Set up polling interval
    const intervalId = setInterval(checkForUpdates, pollingInterval)

    // Clean up on unmount
    return () => {
      clearInterval(intervalId)
    }
  }, [sessionId, checkForUpdates, pollingInterval])

  // Function to manually trigger sync
  const syncNow = useCallback(() => {
    checkForUpdates()
  }, [checkForUpdates])

  return {
    lastSyncTime,
    isSyncing,
    syncStatus,
    syncNow,
  }
}

