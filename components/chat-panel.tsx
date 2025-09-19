"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendIcon } from "@/components/icons"

interface Message {
  id: string
  username: string
  message: string
  timestamp: Date
  isOwn: boolean
}

interface ChatPanelProps {
  roomId: string
  username: string
  messages: Message[]
  onSendMessage: (message: string) => void
}

export default function ChatPanel({ roomId, username, messages, onSendMessage }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 py-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message flex flex-col gap-1 ${message.isOwn ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 hover:scale-105 ${
                    message.isOwn 
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-auto" 
                      : "bg-gradient-to-r from-slate-700 to-slate-800 text-white border border-purple-500/20"
                  }`}
                >
                  {!message.isOwn && (
                    <div className="text-xs font-semibold mb-2 text-purple-300 flex items-center gap-1">
                      🎭 {message.username}
                    </div>
                  )}
                  <div className="text-sm break-words leading-relaxed">{message.message}</div>
                </div>
                <div className={`text-xs text-gray-400 opacity-70 ${message.isOwn ? 'text-right' : 'text-left'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-purple-500/30 p-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="flex gap-3">
          <Input
            placeholder="Type something awesome... 💬"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 h-12 bg-gradient-to-r from-slate-800 to-slate-900 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            variant="gradient"
            size="sm"
            className="h-12 px-4"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
