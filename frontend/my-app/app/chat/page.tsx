"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { useSidebarContext } from "@/components/sidebar-context"
import { Button } from "@/components/ui/button"
import ChatHeader from "@/components/chat-header"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, ArrowLeft, Bot, User, FileText } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { isHovered } = useSidebarContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      router.push("/")
      return
    }

    // Load general chat history
    const chatHistory = localStorage.getItem("citesight-general-chat")
    if (chatHistory) {
      const parsedMessages = JSON.parse(chatHistory).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }))
      setMessages(parsedMessages)
    } else {
      // Initialize with welcome message
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm CiteSight AI. I can help you understand research papers, find relevant studies, and answer questions about academic literature. What would you like to know?",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [user, router])

  useEffect(() => {
    // Save chat history whenever messages change
    if (messages.length > 0) {
      localStorage.setItem("citesight-general-chat", JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    // Scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!user) {
    return null // Will redirect
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    // Simulate AI response (in production, this would call an actual AI API)
    setTimeout(
      () => {
        const responses = [
          "That's a great question about academic research. Based on current literature, I can help you understand...",
          "I can help you find relevant papers on this topic. Let me explain the key concepts...",
          "This is an interesting area of research. The current state of knowledge suggests...",
          "Based on recent publications, the field has been moving towards...",
          "I can provide insights on this topic from multiple research perspectives...",
        ]

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responses[Math.floor(Math.random() * responses.length)] + " " + inputMessage,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
      },
      1000 + Math.random() * 2000,
    )
  }

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      <div className="relative z-10 flex w-full">
        <Sidebar />

        <div className={`relative z-10 flex-1 flex h-screen transition-all duration-300 ${isHovered ? 'ml-64' : 'ml-20'}`}>
          {/* continuous center divider */}
          <div className="absolute inset-y-0 left-1/2 border-l border-border pointer-events-none z-10" />

          <div className="w-1/2 flex flex-col">
            <ChatHeader
              leftButton={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="p-2 rounded-full"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              }
              title="Research Assistant"
              secondary={"General academic research assistance and paper discovery"}
            />

            <div className="flex-1">
              <ScrollArea className="h-full p-6">
                <div className="space-y-6">
                  <Card className="p-4 light-shadow dark:dark-glow">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-serif font-semibold">How I Can Help</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Find relevant research papers on any topic</li>
                      <li>• Explain complex academic concepts</li>
                      <li>• Summarize research findings</li>
                      <li>• Compare different studies and methodologies</li>
                      <li>• Suggest related research areas</li>
                    </ul>
                  </Card>

                  <Card className="p-4 light-shadow dark:dark-glow">
                    <h3 className="font-serif font-semibold mb-3">Recent Topics</h3>
                    <div className="space-y-2">
                      <div className="text-sm p-2 bg-secondary/50 rounded">Machine Learning</div>
                      <div className="text-sm p-2 bg-secondary/50 rounded">Natural Language Processing</div>
                      <div className="text-sm p-2 bg-secondary/50 rounded">Computer Vision</div>
                      <div className="text-sm p-2 bg-secondary/50 rounded">Transformers</div>
                    </div>
                  </Card>

                  <Card className="p-4 light-shadow dark:dark-glow">
                    <h3 className="font-serif font-semibold mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-sm bg-transparent"
                        onClick={() => setInputMessage("What are the latest developments in AI research?")}
                      >
                        Latest AI Research
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-sm bg-transparent"
                        onClick={() => setInputMessage("Explain transformer architecture")}
                      >
                        Explain Transformers
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-sm bg-transparent"
                        onClick={() => setInputMessage("Find papers about computer vision")}
                      >
                        Computer Vision Papers
                      </Button>
                    </div>
                  </Card>
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="w-1/2 flex flex-col">
            {/* Chat Header */}
            <ChatHeader title="CiteSight AI" secondary="General Research Assistant" />

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
                        }`}
                      >
                        {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <Card
                        className={`p-3 light-shadow dark:dark-glow ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </Card>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <Card className="p-3 bg-card border border-border light-shadow dark:dark-glow">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Ask me about research papers..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 light-shadow dark:dark-glow relative z-10"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  size="sm"
                  className="light-shadow dark:dark-glow relative z-10"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
