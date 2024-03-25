"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { WebRTCManager, type PeerMessage } from "@/lib/webrtc-manager"

type WebRTCSyncOptions = {
  sessionId: string
  userId: string
  userName: string
  currentData: any
  onUpdate: (newData: any) => void
  onNewParticipant?: (newParticipant: any) => void
  onNewStory?: (newStory: any) => void
  signalingServer?: string
}

export function useWebRTCSync({
  sessionId,
  userId,
  userName,
  currentData,
  onUpdate,
  onNewParticipant,
  onNewStory,
  signalingServer = "wss://your-signaling-server.com",
}: WebRTCSyncOptions) {
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">(
    "disconnected",
  )
  const [connectedPeers, setConnectedPeers] = useState<string[]>([])
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now())
  const webrtcManagerRef = useRef<WebRTCManager | null>(null)

  // Handle incoming messages from peers
  const handlePeerMessage = useCallback(
    (message: PeerMessage) => {
      if (message.sender === userId) return // Ignore own messages

      console.log("Received peer message:", message)

      switch (message.type) {
        case "update-session":
          // Update session data
          onUpdate(message.data)
          setLastUpdateTime(message.timestamp)
          break

        case "new-participant":
          // Handle new participant
          if (onNewParticipant) {
            onNewParticipant(message.data)
          }
          break

        case "new-story":
          // Handle new story
          if (onNewStory) {
            onNewStory(message.data)
          }
          break

        case "sync-request":
          // Someone is requesting the latest data
          if (webrtcManagerRef.current && currentData) {
            webrtcManagerRef.current.sendMessage(message.sender, "update-session", currentData)
          }
          break
      }
    },
    [userId, onUpdate, onNewParticipant, onNewStory, currentData],
  )

  // Initialize WebRTC connection
  useEffect(() => {
    if (!sessionId || !userId) return

    setConnectionStatus("connecting")

    const webrtcManager = new WebRTCManager(userId, sessionId, signalingServer, handlePeerMessage)

    webrtcManagerRef.current = webrtcManager

    webrtcManager
      .connect()
      .then(() => {
        setConnectionStatus("connected")

        // Request sync from existing peers
        webrtcManager.broadcastMessage("sync-request", { userId, userName })

        // Update connected peers list periodically
        const peersInterval = setInterval(() => {
          setConnectedPeers(webrtcManager.getConnectedPeers())
        }, 5000)

        return () => {
          clearInterval(peersInterval)
          webrtcManager.disconnect()
          webrtcManagerRef.current = null
          setConnectionStatus("disconnected")
        }
      })
      .catch((error) => {
        console.error("Failed to connect:", error)
        setConnectionStatus("error")
      })
  }, [sessionId, userId, userName, signalingServer, handlePeerMessage])

  // Broadcast session updates to all peers
  useEffect(() => {
    if (webrtcManagerRef.current && currentData && connectionStatus === "connected") {
      webrtcManagerRef.current.broadcastMessage("update-session", currentData)
    }
  }, [currentData, connectionStatus])

  // Function to manually broadcast an update
  const broadcastUpdate = useCallback(() => {
    if (webrtcManagerRef.current && currentData && connectionStatus === "connected") {
      webrtcManagerRef.current.broadcastMessage("update-session", currentData)
      setLastUpdateTime(Date.now())
      return true
    }
    return false
  }, [currentData, connectionStatus])

  // Function to broadcast a new participant
  const broadcastNewParticipant = useCallback(
    (participant: any) => {
      if (webrtcManagerRef.current && connectionStatus === "connected") {
        webrtcManagerRef.current.broadcastMessage("new-participant", participant)
        return true
      }
      return false
    },
    [connectionStatus],
  )

  // Function to broadcast a new story
  const broadcastNewStory = useCallback(
    (story: any) => {
      if (webrtcManagerRef.current && connectionStatus === "connected") {
        webrtcManagerRef.current.broadcastMessage("new-story", story)
        return true
      }
      return false
    },
    [connectionStatus],
  )

  return {
    connectionStatus,
    connectedPeers,
    lastUpdateTime,
    broadcastUpdate,
    broadcastNewParticipant,
    broadcastNewStory,
  }
}

