"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { useSidebarContext } from "@/components/sidebar-context"
import { Button } from "@/components/ui/button"
import ChatHeader from "@/components/chat-header"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, ArrowLeft, Bot, User, ExternalLink } from "lucide-react"

// NOTE: The mock data is kept here as a fallback, but the component's logic
// prioritizes loading real data from localStorage first, as intended.
const mockPapers = [
  {
    id: "1",
    title: "Attention Is All You Need",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar"],
    summary:
      "This paper introduces the Transformer architecture, a novel neural network architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
    thumbnail: "/transformer-neural-network-paper.jpg",
    year: 2017,
    venue: "NIPS",
    content: `Abstract...`, // Content shortened for brevity
  },
  // Other mock papers shortened for brevity
]

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { isHovered } = useSidebarContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const paperId = params?.paperId ? decodeURIComponent(params.paperId as string) : ""
  const [paper, setPaper] = useState<any>(null)

  // This logic correctly loads paper data from localStorage or falls back to mocks
  useEffect(() => {
    if (paperId) {
      const storageKey = `citesight-paper-${paperId}`
      const storedPaper = localStorage.getItem(storageKey)
      if (storedPaper) {
        try {
          const parsedPaper = JSON.parse(storedPaper)
          if (!parsedPaper.content) {
            parsedPaper.content = `${parsedPaper.title}\n\nAuthors: ${parsedPaper.authors.join(', ')}\n\nAbstract:\n${parsedPaper.summary}\n\nThis is an ArXiv paper. For the full content, please refer to the original PDF at the provided link.`
          }
          setPaper(parsedPaper)
        } catch (error) {
          const mockPaper = mockPapers.find((p) => p.id === paperId)
          setPaper(mockPaper)
        }
      } else {
        const mockPaper = mockPapers.find((p) => p.id === paperId)
        setPaper(mockPaper)
      }
    }
  }, [paperId])

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    if (!paperId) {
      router.push("/search")
      return
    }
    if (!paper) {
      return
    }

    const chatHistory = localStorage.getItem(`citesight-chat-${paperId}`)
    if (chatHistory) {
      try {
        const parsedHistory = JSON.parse(chatHistory).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(parsedHistory)
      } catch (error) {
        initializeWelcomeMessage()
      }
    } else {
      initializeWelcomeMessage()
    }

    function initializeWelcomeMessage() {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm here to help you understand "${paper?.title}". You can ask me questions about the paper's content, methodology, results, or any concepts you'd like clarified.`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [user, router, paperId, paper])

  useEffect(() => {
    if (messages.length > 0 && paperId) {
      localStorage.setItem(`citesight-chat-${paperId}`, JSON.stringify(messages))
    }
  }, [messages, paperId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!user) {
    return null
  }

  if (!paperId || !paper) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Paper not found</p>
          <Button onClick={() => router.push("/search")}>Back to Search</Button>
        </div>
      </div>
    )
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

    setTimeout(() => {
      const responses = [
        "That's an excellent question about the paper...",
        "This concept is central to the paper's methodology...",
      ]
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)] + " " + inputMessage,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      <div className="relative z-10 flex w-full">
        <Sidebar />

        <div className={`relative z-10 flex-1 flex h-screen transition-all duration-300 ${isHovered ? 'ml-64' : 'ml-20'}`}>
          <div className="absolute inset-y-0 left-1/2 border-l border-border pointer-events-none z-10" />

          {/* Paper Content Panel */}
          <div className="w-1/2 flex flex-col">
            <ChatHeader
              leftButton={
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2 rounded-full" aria-label="Go back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              }
              title="Paper Content"
              primary={paper.title}
              secondary={`${paper.authors.join(", ")} • ${paper.year} • ${paper.venue}`}
            />
            <div className="flex-1">
              <ScrollArea className="h-full p-6">
                <div className="prose prose-sm max-w-none">
                  {/* LOGIC FROM searchfix */}
                  {paper.pdf_url && (
                    <div className="mb-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Full Paper Access:</p>
                      <Button variant="outline" size="sm" onClick={() => window.open(paper.pdf_url, "_blank")} className="light-shadow dark:dark-glow">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Original PDF
                      </Button>
                    </div>
                  )}
                  <div className="mb-6">
                    <img src={paper.thumbnail || "/placeholder.svg"} alt={paper.title} className="w-full max-w-md mx-auto rounded border light-shadow dark:dark-glow" />
                  </div>
                  <div className="whitespace-pre-line leading-relaxed">{paper.content}</div>
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="w-1/2 flex flex-col">
            {/* STYLING FROM main */}
            <ChatHeader title="Chatbot" primary={paper.title} />

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                        {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <Card className={`p-3 light-shadow dark:dark-glow ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input type="text" placeholder="Ask anything about this paper..." value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} disabled={isLoading} className="flex-1 light-shadow dark:dark-glow" />
                <Button type="submit" disabled={isLoading || !inputMessage.trim()} size="sm" className="light-shadow dark:dark-glow">
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