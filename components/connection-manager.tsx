"use client"

import { useEffect, useRef, useCallback } from "react"

interface ConnectionManagerProps {
  roomId: string
  username: string
  onParticipantsChange: (participants: Array<{ id: string; username: string }>) => void
  participants: Array<{ id: string; username: string }>
  onConnectionStatusChange: (status: "disconnected" | "connecting" | "connected") => void
  onDataChannelMessage?: (message: any) => void
  onVideoSync?: (data: any) => void
}

export default function ConnectionManager({
  roomId,
  username,
  participants,
  onParticipantsChange,
  onConnectionStatusChange,
  onDataChannelMessage,
  onVideoSync,
}: ConnectionManagerProps) {
  const socketRef = useRef<any>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map())

  const rtcConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
  }

  const createPeerConnection = useCallback((peerId: string, isInitiator = false) => {
    const peerConnection = new RTCPeerConnection(rtcConfig)
    peersRef.current.set(peerId, peerConnection)

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          target: peerId,
          candidate: event.candidate,
        })
      }
    }

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer ${peerId} connection state:`, peerConnection.connectionState)
      if (peerConnection.connectionState === "failed" || peerConnection.connectionState === "disconnected") {
        // Attempt to reconnect
        setTimeout(() => {
          if (peersRef.current.has(peerId)) {
            console.log(`Attempting to reconnect to peer ${peerId}`)
            createPeerConnection(peerId, true)
          }
        }, 2000)
      }
    }

    // Create data channel for chat and sync
    if (isInitiator) {
      const dataChannel = peerConnection.createDataChannel("chat", {
        ordered: true,
      })
      setupDataChannel(dataChannel, peerId)
    } else {
      peerConnection.ondatachannel = (event) => {
        setupDataChannel(event.channel, peerId)
      }
    }

    return peerConnection
  }, [])

  const setupDataChannel = (dataChannel: RTCDataChannel, peerId: string) => {
    dataChannelsRef.current.set(peerId, dataChannel)

    dataChannel.onopen = () => {
      console.log(`Data channel opened with peer ${peerId}`)
    }

    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log(`Received data from peer ${peerId}:`, data)

        if (data.type === "chat" && onDataChannelMessage) {
          onDataChannelMessage(data)
        } else if (data.type === "video-sync" && onVideoSync) {
          onVideoSync(data)
        }
      } catch (error) {
        console.error("Error parsing data channel message:", error)
      }
    }

    dataChannel.onclose = () => {
      console.log(`Data channel closed with peer ${peerId}`)
      dataChannelsRef.current.delete(peerId)
    }

    dataChannel.onerror = (error) => {
      console.error(`Data channel error with peer ${peerId}:`, error)
    }
  }

  const sendDataToAllPeers = useCallback((data: any) => {
    const message = JSON.stringify(data)
    dataChannelsRef.current.forEach((dataChannel, peerId) => {
      if (dataChannel.readyState === "open") {
        try {
          dataChannel.send(message)
        } catch (error) {
          console.error(`Failed to send data to peer ${peerId}:`, error)
        }
      }
    })
  }, [])

  useEffect(() => {
    ;(window as any).sendDataToAllPeers = sendDataToAllPeers
    return () => {
      delete (window as any).sendDataToAllPeers
    }
  }, [sendDataToAllPeers])

  useEffect(() => {
    // Initialize Socket.io connection
    const initializeConnection = async () => {
      try {
        onConnectionStatusChange("connecting")

        // Dynamic import of socket.io-client
        const { io } = await import("socket.io-client")

        // Try to connect to local server first, fallback to a public server if needed
        const serverUrl = process.env.NODE_ENV === 'production' 
          ? 'https://your-server-url.com' 
          : 'http://localhost:4000'

        console.log("Attempting to connect to:", serverUrl)

        socketRef.current = io(serverUrl, {
          transports: ["websocket", "polling"],
          timeout: 10000,
          forceNew: true,
        })

        socketRef.current.on("connect", () => {
          console.log("Connected to signaling server")
          onConnectionStatusChange("connected")

          // Join the room
          socketRef.current.emit("join-room", roomId, username)
        })

        socketRef.current.on("connect_error", (error: any) => {
          console.error("Connection error:", error)
          onConnectionStatusChange("disconnected")
          // Show user-friendly error message
          const helpMessage = `Unable to connect to the server. Please make sure:

1. The WebSocket server is running
   → Run: node scripts/server.js
   → Or double-click: start-server.bat

2. Port 4000 is available and not blocked

3. If sharing with friends, they also need to run the server locally

For detailed instructions, check the README.md file.`
          
          alert(helpMessage)
        })

        socketRef.current.on("disconnect", (reason: string) => {
          console.log("Disconnected from signaling server:", reason)
          onConnectionStatusChange("disconnected")
          
          // Attempt to reconnect if the disconnection was unexpected
          if (reason === "io server disconnect") {
            // Server disconnected, try to reconnect
            setTimeout(() => {
              console.log("Attempting to reconnect...")
              socketRef.current.connect()
            }, 2000)
          }
        })

        socketRef.current.on("room-state", (data: any) => {
          console.log("Room state received:", data)
          const otherParticipants = data.participants.filter((p: any) => p.username !== username)
          onParticipantsChange(otherParticipants)

          otherParticipants.forEach((participant: any) => {
            if (!peersRef.current.has(participant.id)) {
              initiateConnection(participant.id)
            }
          })
        })

        socketRef.current.on("user-joined", (data: { id: string; username: string }) => {
          console.log("User joined:", data)
          onParticipantsChange([...participants, data])

          if (!peersRef.current.has(data.id)) {
            initiateConnection(data.id)
          }
        })

        socketRef.current.on("user-left", (data: { id: string }) => {
          console.log("User left:", data)
          onParticipantsChange(participants.filter((p) => p.id !== data.id))

          // Clean up peer connection
          const peer = peersRef.current.get(data.id)
          if (peer) {
            peer.close()
            peersRef.current.delete(data.id)
          }
          dataChannelsRef.current.delete(data.id)
        })

        socketRef.current.on("offer", handleOffer)
        socketRef.current.on("answer", handleAnswer)
        socketRef.current.on("ice-candidate", handleIceCandidate)

        socketRef.current.on("video-changed", (data: any) => {
          if (onVideoSync) {
            onVideoSync({ type: "video-change", ...data })
          }
        })

        socketRef.current.on("sync-player", (data: any) => {
          if (onVideoSync) {
            onVideoSync({ type: "player-sync", ...data })
          }
        })

        socketRef.current.on("seek-to", (data: any) => {
          if (onVideoSync) {
            onVideoSync({ type: "seek", ...data })
          }
        })
      } catch (error) {
        console.error("Failed to initialize connection:", error)
        onConnectionStatusChange("disconnected")
      }
    }

    initializeConnection()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      // Close all peer connections
      peersRef.current.forEach((peer) => peer.close())
      peersRef.current.clear()
      dataChannelsRef.current.clear()
    }
  }, [roomId, username])

  const initiateConnection = async (peerId: string) => {
    try {
      const peerConnection = createPeerConnection(peerId, true)

      // Create offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // Send offer through signaling server
      socketRef.current.emit("offer", {
        target: peerId,
        offer: offer,
      })
    } catch (error) {
      console.error("Error initiating connection:", error)
    }
  }

  const handleOffer = async (data: any) => {
    try {
      console.log("Received offer from:", data.sender)

      const peerConnection = createPeerConnection(data.sender, false)

      // Set remote description
      await peerConnection.setRemoteDescription(data.offer)

      // Create answer
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      // Send answer through signaling server
      socketRef.current.emit("answer", {
        target: data.sender,
        answer: answer,
      })
    } catch (error) {
      console.error("Error handling offer:", error)
    }
  }

  const handleAnswer = async (data: any) => {
    try {
      console.log("Received answer from:", data.sender)

      const peerConnection = peersRef.current.get(data.sender)
      if (peerConnection) {
        await peerConnection.setRemoteDescription(data.answer)
      }
    } catch (error) {
      console.error("Error handling answer:", error)
    }
  }

  const handleIceCandidate = async (data: any) => {
    try {
      console.log("Received ICE candidate from:", data.sender)

      const peerConnection = peersRef.current.get(data.sender)
      if (peerConnection) {
        await peerConnection.addIceCandidate(data.candidate)
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error)
    }
  }

  // This component doesn't render anything visible
  return null
}
