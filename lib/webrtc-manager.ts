// A simplified WebRTC manager for the Scrum estimation tool

export type PeerMessage = {
  type: "update-session" | "new-participant" | "new-story" | "vote" | "estimate" | "sync-request"
  data: any
  sender: string
  timestamp: number
}

export class WebRTCManager {
  private connections: Map<string, RTCPeerConnection> = new Map()
  private dataChannels: Map<string, RTCDataChannel> = new Map()
  private userId: string
  private sessionId: string
  private signalingServer: string
  private onMessageCallback: (message: PeerMessage) => void
  private socket: WebSocket | null = null

  constructor(userId: string, sessionId: string, signalingServer: string, onMessage: (message: PeerMessage) => void) {
    this.userId = userId
    this.sessionId = sessionId
    this.signalingServer = signalingServer
    this.onMessageCallback = onMessage
  }

  // Connect to the signaling server and set up WebRTC
  public async connect(): Promise<void> {
    // Connect to signaling server
    this.socket = new WebSocket(`${this.signalingServer}/signal`)

    this.socket.onopen = () => {
      console.log("Connected to signaling server")
      // Join the session room
      this.socket.send(
        JSON.stringify({
          type: "join",
          sessionId: this.sessionId,
          userId: this.userId,
        }),
      )
    }

    this.socket.onmessage = async (event) => {
      const message = JSON.parse(event.data)

      switch (message.type) {
        case "user-joined":
          // A new user joined, initiate connection
          if (message.userId !== this.userId) {
            await this.createPeerConnection(message.userId)
          }
          break

        case "offer":
          // Received an offer, create answer
          if (message.target === this.userId) {
            await this.handleOffer(message)
          }
          break

        case "answer":
          // Received an answer to our offer
          if (message.target === this.userId) {
            await this.handleAnswer(message)
          }
          break

        case "ice-candidate":
          // Received ICE candidate
          if (message.target === this.userId) {
            await this.handleIceCandidate(message)
          }
          break
      }
    }

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    this.socket.onclose = () => {
      console.log("Disconnected from signaling server")
    }
  }

  // Create a peer connection to another user
  private async createPeerConnection(targetUserId: string): Promise<void> {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      })

      // Create data channel
      const dataChannel = peerConnection.createDataChannel("scrum-estimation")
      this.setupDataChannel(dataChannel, targetUserId)

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket?.send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: event.candidate,
              sender: this.userId,
              target: targetUserId,
              sessionId: this.sessionId,
            }),
          )
        }
      }

      // Handle data channel creation from the other side
      peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel, targetUserId)
      }

      // Create and send offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      this.socket?.send(
        JSON.stringify({
          type: "offer",
          offer: peerConnection.localDescription,
          sender: this.userId,
          target: targetUserId,
          sessionId: this.sessionId,
        }),
      )

      this.connections.set(targetUserId, peerConnection)
    } catch (error) {
      console.error("Error creating peer connection:", error)
    }
  }

  // Handle an offer from another peer
  private async handleOffer(message: any): Promise<void> {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      })

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket?.send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: event.candidate,
              sender: this.userId,
              target: message.sender,
              sessionId: this.sessionId,
            }),
          )
        }
      }

      // Handle data channel creation from the other side
      peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel, message.sender)
      }

      // Set remote description (the offer)
      await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer))

      // Create and send answer
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      this.socket?.send(
        JSON.stringify({
          type: "answer",
          answer: peerConnection.localDescription,
          sender: this.userId,
          target: message.sender,
          sessionId: this.sessionId,
        }),
      )

      this.connections.set(message.sender, peerConnection)
    } catch (error) {
      console.error("Error handling offer:", error)
    }
  }

  // Handle an answer to our offer
  private async handleAnswer(message: any): Promise<void> {
    try {
      const peerConnection = this.connections.get(message.sender)
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer))
      }
    } catch (error) {
      console.error("Error handling answer:", error)
    }
  }

  // Handle ICE candidate
  private async handleIceCandidate(message: any): Promise<void> {
    try {
      const peerConnection = this.connections.get(message.sender)
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate))
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error)
    }
  }

  // Set up data channel
  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onopen = () => {
      console.log(`Data channel to ${peerId} opened`)
      this.dataChannels.set(peerId, dataChannel)
    }

    dataChannel.onclose = () => {
      console.log(`Data channel to ${peerId} closed`)
      this.dataChannels.delete(peerId)
    }

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as PeerMessage
        this.onMessageCallback(message)
      } catch (error) {
        console.error("Error parsing message:", error)
      }
    }
  }

  // Send a message to all connected peers
  public broadcastMessage(type: PeerMessage["type"], data: any): void {
    const message: PeerMessage = {
      type,
      data,
      sender: this.userId,
      timestamp: Date.now(),
    }

    this.dataChannels.forEach((channel) => {
      if (channel.readyState === "open") {
        channel.send(JSON.stringify(message))
      }
    })
  }

  // Send a message to a specific peer
  public sendMessage(peerId: string, type: PeerMessage["type"], data: any): boolean {
    const channel = this.dataChannels.get(peerId)
    if (channel && channel.readyState === "open") {
      const message: PeerMessage = {
        type,
        data,
        sender: this.userId,
        timestamp: Date.now(),
      }
      channel.send(JSON.stringify(message))
      return true
    }
    return false
  }

  // Disconnect from all peers
  public disconnect(): void {
    this.dataChannels.forEach((channel) => {
      channel.close()
    })

    this.connections.forEach((connection) => {
      connection.close()
    })

    this.socket?.close()

    this.dataChannels.clear()
    this.connections.clear()
    this.socket = null
  }

  // Get list of connected peers
  public getConnectedPeers(): string[] {
    return Array.from(this.dataChannels.keys())
  }
}

