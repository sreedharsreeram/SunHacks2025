"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { useSidebarContext } from "@/components/sidebar-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, Heart, ArrowLeft, ExternalLink, HelpCircle } from "lucide-react"

// Mock paper data
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
  },
  {
    id: "2",
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    authors: ["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee"],
    summary:
      "BERT represents a new method of pre-training language representations which obtains state-of-the-art results on a wide array of Natural Language Processing tasks.",
    thumbnail: "/bert-language-model-paper.jpg",
    year: 2018,
    venue: "NAACL",
  },
  {
    id: "3",
    title: "GPT-3: Language Models are Few-Shot Learners",
    authors: ["Tom B. Brown", "Benjamin Mann", "Nick Ryder"],
    summary:
      "This paper demonstrates that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches.",
    thumbnail: "/gpt-3-language-model-paper.jpg",
    year: 2020,
    venue: "NeurIPS",
  },
  {
    id: "4",
    title: "ResNet: Deep Residual Learning for Image Recognition",
    authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren"],
    summary:
      "This paper presents a residual learning framework to ease the training of networks that are substantially deeper than those used previously.",
    thumbnail: "/resnet-deep-learning-paper.jpg",
    year: 2016,
    venue: "CVPR",
  },
  {
    id: "5",
    title: "AlexNet: ImageNet Classification with Deep Convolutional Neural Networks",
    authors: ["Alex Krizhevsky", "Ilya Sutskever", "Geoffrey E. Hinton"],
    summary:
      "This paper presents a large, deep convolutional neural network that was trained to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest.",
    thumbnail: "/alexnet-cnn-paper.jpg",
    year: 2012,
    venue: "NIPS",
  },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { isHovered } = useSidebarContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    const query = searchParams.get("q")
    if (query && query !== searchQuery) {
      setSearchQuery(query)
    }
  }, [searchParams]) // Remove searchQuery from dependencies to prevent loop

  useEffect(() => {
    const savedFavorites = localStorage.getItem("citesight-favorites")
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (error) {
        console.error("Error parsing favorites from localStorage:", error)
        setFavorites([])
      }
    }
  }, []) // Empty dependency array - only run once on mount

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const history = JSON.parse(localStorage.getItem("citesight-search-history") || "[]")
      const updatedHistory = [searchQuery, ...history.filter((item: string) => item !== searchQuery)].slice(0, 10)
      localStorage.setItem("citesight-search-history", JSON.stringify(updatedHistory))

      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as any)
    }
  }

  const toggleFavorite = (paperId: string) => {
    if (!user) return

    const updatedFavorites = favorites.includes(paperId)
      ? favorites.filter((id) => id !== paperId)
      : [...favorites, paperId]

    setFavorites(updatedFavorites)
    localStorage.setItem("citesight-favorites", JSON.stringify(updatedFavorites))
  }

  const handlePaperAccess = (paper: any, action: "view" | "chat") => {
    // Track recently accessed papers instead of searches
    const recentPapers = JSON.parse(localStorage.getItem("citesight-recent-papers") || "[]")
    const paperData = {
      id: paper.id,
      title: paper.title,
      authors: paper.authors,
      action,
      timestamp: Date.now(),
    }

    const updatedRecent = [paperData, ...recentPapers.filter((p: any) => p.id !== paper.id)].slice(0, 10)
    localStorage.setItem("citesight-recent-papers", JSON.stringify(updatedRecent))
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className={`flex-1 min-h-screen bg-background transition-all duration-300 ${isHovered ? 'ml-64' : 'ml-20'}`}>
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border light-shadow dark:dark-glow">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="shrink-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-serif font-bold">Results</h1>
            </div>

            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for a paper..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-4 h-10 bg-card light-shadow dark:dark-glow"
              />
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {mockPapers.map((paper) => (
              <Card
                key={paper.id}
                className="p-6 transition-all duration-200 light-shadow dark:dark-glow hover:light-shadow-lg dark:hover:dark-glow-lg"
              >
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <img
                      src={paper.thumbnail || "/placeholder.svg"}
                      alt={paper.title}
                      className="w-24 h-32 object-cover rounded border light-shadow dark:dark-glow"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-serif font-semibold text-lg leading-tight">{paper.title}</h3>
                      {user && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(paper.id)
                          }}
                          className="shrink-0 ml-2"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              favorites.includes(paper.id) ? "fill-pink-500 text-pink-500" : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {paper.authors.join(", ")} • {paper.year} • {paper.venue}
                    </p>

                    <p className="text-sm leading-relaxed">{paper.summary}</p>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs light-shadow dark:dark-glow bg-transparent"
                        onClick={() => {
                          handlePaperAccess(paper, "view")
                          // In a real app, this would open the actual paper
                          window.open(`#paper-${paper.id}`, "_blank")
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Paper Link
                      </Button>
                      {user && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs light-shadow dark:dark-glow bg-transparent"
                          onClick={() => {
                            handlePaperAccess(paper, "chat")
                            router.push(`/chat/${paper.id}`)
                          }}
                        >
                          <HelpCircle className="h-3 w-3 mr-1" />
                          Ask
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 text-sm text-muted-foreground">Showing top 10 results only</div>
        </div>

      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}
