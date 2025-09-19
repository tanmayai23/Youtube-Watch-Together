"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UsersIcon, VideoIcon, MessageCircleIcon, WifiIcon, WifiOffIcon } from "@/components/icons"
import YouTubePlayer from "@/components/youtube-player"
import ChatPanel from "@/components/chat-panel"
import ConnectionManager from "@/components/connection-manager"

interface Message {
  id: string
  username: string
  message: string
  timestamp: Date
  isOwn: boolean
}

export default function WatchTogether() {
  const [roomId, setRoomId] = useState("")
  const [username, setUsername] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Array<{ id: string; username: string }>>([])
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [messages, setMessages] = useState<Message[]>([])
  const youtubePlayerRef = useRef<any>(null)

  const handleJoinRoom = () => {
    if (roomId.trim() && username.trim()) {
      setCurrentRoom(roomId)
      setIsConnected(true)
    }
  }

  const handleLeaveRoom = () => {
    setIsConnected(false)
    setCurrentRoom(null)
    setParticipants([])
    setConnectionStatus("disconnected")
    setMessages([])
  }

  const handleDataChannelMessage = useCallback((data: any) => {
    if (data.type === "chat") {
      const newMessage: Message = {
        id: data.id,
        username: data.username,
        message: data.message,
        timestamp: new Date(data.timestamp),
        isOwn: false,
      }
      setMessages((prev) => [...prev, newMessage])
    }
  }, [])

  const handleVideoSync = useCallback((data: any) => {
    console.log("Video sync event:", data)

    if (youtubePlayerRef.current) {
      switch (data.type) {
        case "video-change":
          youtubePlayerRef.current.loadVideo(data.videoId)
          break
        case "player-sync":
          youtubePlayerRef.current.syncPlayer(data)
          break
        case "seek":
          youtubePlayerRef.current.seekTo(data.time)
          break
      }
    }
  }, [])

  const sendChatMessage = useCallback(
    (message: string) => {
      const chatData = {
        type: "chat",
        id: Date.now().toString(),
        username: username,
        message: message,
        timestamp: new Date().toISOString(),
      }

      // Add to local messages
      const localMessage: Message = {
        id: chatData.id,
        username: chatData.username,
        message: chatData.message,
        timestamp: new Date(chatData.timestamp),
        isOwn: true,
      }
      setMessages((prev) => [...prev, localMessage])

      // Send to all peers via WebRTC data channel
      if ((window as any).sendDataToAllPeers) {
        ;(window as any).sendDataToAllPeers(chatData)
      }
    },
    [username],
  )

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background particles */}
        <div className="particle-bg"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-pink-500/20 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-blue-500/20 rounded-full blur-xl" style={{animation: 'floating 6s ease-in-out infinite'}}></div>
        
        <Card className="w-full max-w-md fade-in relative z-10">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6 bounce-in">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                <VideoIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gradient">Watch Together</h1>
            </div>
            <p className="text-gray-300 text-lg">Sync YouTube videos with friends in real-time ✨</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 slide-up">
              <label htmlFor="username" className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
                Your Name
              </label>
              <Input
                id="username"
                placeholder="Enter your awesome name..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="transition-all duration-300 focus:scale-105"
              />
            </div>
            <div className="space-y-3 slide-up" style={{animationDelay: '0.1s'}}>
              <label htmlFor="roomId" className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></span>
                Room ID
              </label>
              <Input
                id="roomId"
                placeholder="Create or join a room..."
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="transition-all duration-300 focus:scale-105"
              />
            </div>
            <Button
              onClick={handleJoinRoom}
              disabled={!roomId.trim() || !username.trim()}
              variant="gradient"
              size="lg"
              className="w-full slide-up"
              style={{animationDelay: '0.2s'}}
            >
              🚀 Join the Fun!
            </Button>
            <div className="text-center slide-up" style={{animationDelay: '0.3s'}}>
              <p className="text-sm text-gray-400 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-3 border border-purple-500/20">
                💡 <strong>Pro tip:</strong> Share the same Room ID with friends to watch together
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="particle-bg"></div>
      
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-xl shadow-2xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 fade-in">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                <VideoIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gradient">Watch Together</h1>
              <Badge variant="gradient" className="animate-pulse">
                🏠 Room: {currentRoom}
              </Badge>
            </div>
            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all duration-300 ${
                connectionStatus === "connected" 
                  ? "border-green-500 bg-green-500/20 text-green-400" 
                  : connectionStatus === "connecting"
                  ? "border-yellow-500 bg-yellow-500/20 text-yellow-400 animate-pulse"
                  : "border-red-500 bg-red-500/20 text-red-400"
              }`}>
                {connectionStatus === "connected" ? (
                  <WifiIcon className="h-4 w-4" />
                ) : connectionStatus === "connecting" ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <WifiOffIcon className="h-4 w-4" />
                )}
                <span className="text-sm font-semibold capitalize">{connectionStatus}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                <UsersIcon className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">{participants.length + 1} online</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLeaveRoom}
                className="hover:scale-105 transition-all duration-300"
              >
                🚪 Leave Room
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-140px)]">
          {/* Video Player Section */}
          <div className="lg:col-span-3 space-y-6 fade-in">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <YouTubePlayer ref={youtubePlayerRef} roomId={currentRoom!} username={username} />
              </CardContent>
            </Card>

            {/* Participants List */}
            <Card className="slide-up">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <UsersIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gradient">Party Members ({participants.length + 1})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="gradient" className="text-sm py-2 px-4">
                    👑 {username} (You)
                  </Badge>
                  {participants.map((participant, index) => (
                    <Badge 
                      key={participant.id} 
                      variant={index % 2 === 0 ? "success" : "secondary"} 
                      className="text-sm py-2 px-4 bounce-in"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      🎭 {participant.username}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-1 slide-up" style={{animationDelay: '0.2s'}}>
            <Card className="h-full overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                    <MessageCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gradient-secondary">Live Chat 💬</span>
                </CardTitle>
                <Separator className="bg-purple-500/30" />
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-100px)]">
                <ChatPanel
                  roomId={currentRoom!}
                  username={username}
                  messages={messages}
                  onSendMessage={sendChatMessage}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Connection Manager (hidden component for WebRTC) */}
      <ConnectionManager
        roomId={currentRoom!}
        username={username}
        participants={participants}
        onParticipantsChange={setParticipants}
        onConnectionStatusChange={setConnectionStatus}
        onDataChannelMessage={handleDataChannelMessage}
        onVideoSync={handleVideoSync}
      />
    </div>
  )
}
