const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")

const app = express()
const server = http.createServer(app)

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling']
})

app.use(cors())
app.use(express.json())

// Store rooms and their participants
const rooms = new Map()

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: rooms.size,
    timestamp: new Date().toISOString()
  })
})

// Get room info endpoint for debugging
app.get('/rooms/:roomId', (req, res) => {
  const roomId = req.params.roomId
  const room = rooms.get(roomId)
  
  if (room) {
    res.json({
      roomId,
      participants: room.participants.map(p => ({ id: p.id, username: p.username })),
      currentVideo: room.currentVideo,
      playerState: room.playerState
    })
  } else {
    res.status(404).json({ error: 'Room not found' })
  }
})

console.log("WebSocket server starting...")

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join a room
  socket.on("join-room", (roomId, username) => {
    console.log(`${username} (${socket.id}) attempting to join room: ${roomId}`)
    
    socket.join(roomId)
    socket.username = username
    socket.roomId = roomId

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      console.log(`Creating new room: ${roomId}`)
      rooms.set(roomId, {
        participants: [],
        currentVideo: null,
        playerState: {
          currentTime: 0,
          isPlaying: false,
          lastUpdate: Date.now(),
        },
      })
    }

    const room = rooms.get(roomId)
    
    // Check if user is already in the room
    const existingParticipant = room.participants.find(p => p.username === username || p.id === socket.id)
    if (!existingParticipant) {
      room.participants.push({
        id: socket.id,
        username: username,
      })
    }

    // Notify others in the room
    socket.to(roomId).emit("user-joined", {
      id: socket.id,
      username: username,
    })

    // Send current room state to the new user
    socket.emit("room-state", {
      participants: room.participants,
      currentVideo: room.currentVideo,
      playerState: room.playerState,
    })

    console.log(`${username} successfully joined room ${roomId}. Room now has ${room.participants.length} participants.`)
    console.log(`Room ${roomId} participants:`, room.participants.map(p => p.username))
  })

  // WebRTC signaling
  socket.on("offer", (data) => {
    socket.to(data.target).emit("offer", {
      offer: data.offer,
      sender: socket.id,
    })
  })

  socket.on("answer", (data) => {
    socket.to(data.target).emit("answer", {
      answer: data.answer,
      sender: socket.id,
    })
  })

  socket.on("ice-candidate", (data) => {
    socket.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      sender: socket.id,
    })
  })

  // YouTube video synchronization
  socket.on("video-change", (data) => {
    console.log(`${socket.username} changed video to: ${data.videoId} in room ${socket.roomId}`)
    if (socket.roomId) {
      const room = rooms.get(socket.roomId)
      if (room) {
        room.currentVideo = data.videoId
        socket.to(socket.roomId).emit("video-changed", {
          videoId: data.videoId,
          sender: socket.username,
        })
        console.log(`Video change broadcasted to room ${socket.roomId}`)
      }
    }
  })

  socket.on("player-state-change", (data) => {
    if (socket.roomId) {
      const room = rooms.get(socket.roomId)
      if (room) {
        room.playerState = {
          ...data,
          lastUpdate: Date.now(),
        }
        socket.to(socket.roomId).emit("sync-player", {
          ...data,
          sender: socket.username,
        })
        console.log(`Player state synced for room ${socket.roomId}: playing=${data.isPlaying}, time=${data.currentTime}`)
      }
    }
  })

  socket.on("seek-to", (data) => {
    console.log(`${socket.username} seeked to ${data.time} in room ${socket.roomId}`)
    if (socket.roomId) {
      socket.to(socket.roomId).emit("seek-to", {
        time: data.time,
        sender: socket.username,
      })
    }
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id, socket.username || "unknown")

    if (socket.roomId) {
      const room = rooms.get(socket.roomId)
      if (room) {
        const beforeCount = room.participants.length
        room.participants = room.participants.filter((p) => p.id !== socket.id)
        const afterCount = room.participants.length

        console.log(`Removed user from room ${socket.roomId}. Participants: ${beforeCount} -> ${afterCount}`)

        // Notify others in the room
        socket.to(socket.roomId).emit("user-left", {
          id: socket.id,
          username: socket.username,
        })

        // Clean up empty rooms
        if (room.participants.length === 0) {
          rooms.delete(socket.roomId)
          console.log(`Deleted empty room: ${socket.roomId}`)
        }
      }
    }
  })
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`)
})
