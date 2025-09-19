"use client"

import * as React from "react"
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PlayIcon, PauseIcon, Volume2Icon, MaximizeIcon, LinkIcon, VideoIcon } from "@/components/icons"

interface YouTubePlayerProps {
  roomId: string
  username: string
}

interface YouTubePlayerRef {
  loadVideo: (videoId: string) => void
  syncPlayer: (data: any) => void
  seekTo: (time: number) => void
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(({ roomId, username }, ref) => {
  const [videoUrl, setVideoUrl] = useState("")
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isSyncingRef = useRef(false)
  const lastSyncTimeRef = useRef(0)
  const socketRef = useRef<any>(null)

  useImperativeHandle(ref, () => ({
    loadVideo: (videoId: string) => {
      if (playerRef.current && videoId !== currentVideoId) {
        isSyncingRef.current = true
        setCurrentVideoId(videoId)
        playerRef.current.loadVideoById(videoId)
        setTimeout(() => {
          isSyncingRef.current = false
        }, 1000)
      }
    },
    syncPlayer: (data: any) => {
      if (playerRef.current && !isSyncingRef.current) {
        const timeDiff = Math.abs(playerRef.current.getCurrentTime() - data.currentTime)

        // Only sync if time difference is significant (>2 seconds)
        if (timeDiff > 2) {
          isSyncingRef.current = true
          playerRef.current.seekTo(data.currentTime, true)
          setTimeout(() => {
            isSyncingRef.current = false
          }, 500)
        }

        // Sync play/pause state
        if (data.isPlaying && playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) {
          isSyncingRef.current = true
          playerRef.current.playVideo()
          setTimeout(() => {
            isSyncingRef.current = false
          }, 500)
        } else if (!data.isPlaying && playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
          isSyncingRef.current = true
          playerRef.current.pauseVideo()
          setTimeout(() => {
            isSyncingRef.current = false
          }, 500)
        }
      }
    },
    seekTo: (time: number) => {
      if (playerRef.current) {
        isSyncingRef.current = true
        playerRef.current.seekTo(time, true)
        setTimeout(() => {
          isSyncingRef.current = false
        }, 500)
      }
    },
  }))

  useEffect(() => {
    const initSocket = async () => {
      const { io } = await import("socket.io-client")
      
      // Try to connect to local server first
      const serverUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-server-url.com' 
        : 'http://localhost:4000'
        
      console.log("YouTube player connecting to:", serverUrl)
      socketRef.current = io(serverUrl, {
        timeout: 10000,
        forceNew: false,
      })
      
      socketRef.current.on("connect_error", (error: any) => {
        console.error("YouTube player socket connection error:", error)
      })
    }
    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Extract YouTube video ID from URL
  const extractVideoId = (url: string): string | null => {
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    // If it's just a video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
      return url.trim()
    }
    
    return null
  }

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer()
      }
    } else {
      initializePlayer()
    }
  }, [])

  const initializePlayer = () => {
    if (containerRef.current && !playerRef.current && window.YT && window.YT.Player) {
      console.log("Initializing YouTube player")
      playerRef.current = new window.YT.Player("youtube-player", {
        height: "400",
        width: "100%",
        videoId: "",
        playerVars: {
          autoplay: 0,
          controls: 1,
          disablekb: 0,
          enablejsapi: 1,
          fs: 1,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError,
        },
      })
    }
  }

  const onPlayerError = (event: any) => {
    console.error("YouTube player error:", event.data)
    const errorMessages: { [key: number]: string } = {
      2: "Invalid video ID",
      5: "Video cannot be played in an HTML5 player",
      100: "Video not found or is private",
      101: "Video is not available in your country",
      150: "Video is not available in your country",
    }
    
    const message = errorMessages[event.data] || "Unknown error occurred"
    alert(`YouTube Player Error: ${message}`)
  }

  const onPlayerReady = (event: any) => {
    console.log("YouTube player ready")
    // Test if the player is working
    try {
      const state = event.target.getPlayerState()
      console.log("Player state on ready:", state)
    } catch (error) {
      console.error("Error getting player state:", error)
    }
  }

  const onPlayerStateChange = (event: any) => {
    const state = event.data
    const player = event.target

    setIsPlaying(state === window.YT.PlayerState.PLAYING)
    setCurrentTime(player.getCurrentTime())
    setDuration(player.getDuration())

    if (!isSyncingRef.current && socketRef.current && Date.now() - lastSyncTimeRef.current > 1000) {
      const syncData = {
        currentTime: player.getCurrentTime(),
        isPlaying: state === window.YT.PlayerState.PLAYING,
        state: state,
        timestamp: Date.now(),
      }

      // Emit player state change for synchronization
      socketRef.current.emit("player-state-change", syncData)
      lastSyncTimeRef.current = Date.now()

      console.log("Emitting player state change:", syncData)
    }
  }

  const handleLoadVideo = () => {
    const videoId = extractVideoId(videoUrl)
    console.log("Extracted video ID:", videoId, "from URL:", videoUrl)
    
    if (videoId && playerRef.current) {
      console.log("Loading video with ID:", videoId)
      setCurrentVideoId(videoId)
      
      // Ensure player is ready before loading video
      if (playerRef.current.getPlayerState) {
        playerRef.current.loadVideoById(videoId)
        setVideoUrl("")

        if (socketRef.current) {
          socketRef.current.emit("video-change", { videoId })
          console.log("Emitted video-change event with videoId:", videoId)
        }
      } else {
        console.error("YouTube player not ready yet")
        // Retry after a short delay
        setTimeout(() => {
          if (playerRef.current && playerRef.current.getPlayerState) {
            playerRef.current.loadVideoById(videoId)
            setVideoUrl("")
            if (socketRef.current) {
              socketRef.current.emit("video-change", { videoId })
            }
          }
        }, 1000)
      }
    } else {
      console.error("Invalid YouTube URL or video ID:", videoUrl)
      alert("Please enter a valid YouTube URL or video ID")
    }
  }

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo()
      } else {
        playerRef.current.playVideo()
      }
    }
  }

  const handleSeek = (time: number) => {
    if (playerRef.current && socketRef.current) {
      playerRef.current.seekTo(time, true)
      socketRef.current.emit("seek-to", { time })
    }
  }

  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (playerRef.current && isPlaying && !isSyncingRef.current && socketRef.current) {
        const currentTime = playerRef.current.getCurrentTime()
        const syncData = {
          currentTime,
          isPlaying: true,
          timestamp: Date.now(),
        }

        // Send periodic sync updates
        if ((window as any).sendDataToAllPeers) {
          ;(window as any).sendDataToAllPeers({
            type: "video-sync",
            ...syncData,
          })
        }
      }
    }, 5000) // Sync every 5 seconds

    return () => clearInterval(syncInterval)
  }, [isPlaying])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      {/* Video URL Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Paste YouTube URL here..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
        />
        <Button
          onClick={handleLoadVideo}
          disabled={!videoUrl.trim()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Load Video
        </Button>
      </div>

      {/* Video Player */}
      <div className="relative">
        {currentVideoId ? (
          <div ref={containerRef} className="youtube-container bg-muted rounded-lg overflow-hidden">
            <div id="youtube-player"></div>
          </div>
        ) : (
          <div className="youtube-container bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <VideoIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No video loaded</p>
              <p className="text-sm">Paste a YouTube URL above to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Custom Controls */}
      {currentVideoId && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={handlePlayPause} className="text-foreground hover:bg-accent">
                  {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                {isSyncingRef.current && <div className="text-xs text-primary font-medium">Syncing...</div>}
              </div>
              <div className="flex items-center gap-2">
                <Volume2Icon className="h-4 w-4 text-muted-foreground" />
                <MaximizeIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-3">
              <div className="relative">
                <div className="w-full h-2 bg-muted rounded-full">
                  <div
                    className="h-2 bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

YouTubePlayer.displayName = "YouTubePlayer"

export default YouTubePlayer
