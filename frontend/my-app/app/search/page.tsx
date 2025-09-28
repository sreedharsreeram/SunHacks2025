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
import { Search, Heart, ArrowLeft, ExternalLink, HelpCircle, Loader2 } from "lucide-react"
import { ArxivPaper } from "@/lib/arxiv-scraper"


function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { isHovered } = useSidebarContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])
  const [papers, setPapers] = useState<ArxivPaper[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchStatus, setSearchStatus] = useState('')

  // Debug user state
  console.log('Current user state:', user)

  const performSearch = async (query: string) => {
    if (!query.trim()) return

    setLoading(true)
    setHasSearched(true)
    setSearchStatus('Searching for contextually relevant papers...')

    try {
      const response = await fetch(`/api/arxiv?q=${encodeURIComponent(query)}&max_results=10`)
      const data = await response.json()

      if (data.success) {
        setPapers(data.data || [])

        // Simple status for ArXiv results
        setSearchStatus(`Found ${data.data.length} papers from ArXiv`)
        console.log(`🔍 Search completed - found ${data.data.length} papers`)
      } else {
        console.error('Search failed:', data.error)
        setPapers([])
        setSearchStatus('Search failed. Please try again.')
      }
    } catch (error) {
      console.error('Search error:', error)
      setPapers([])
      setSearchStatus('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const query = searchParams.get("q")
    if (query && query !== searchQuery) {
      setSearchQuery(query)
      performSearch(query)
    }
  }, [searchParams]) // Remove searchQuery from dependencies to prevent loop

  useEffect(() => {
    const savedFavorites = localStorage.getItem("citesight-favorites")
    console.log('Loading favorites from localStorage:', savedFavorites)
    if (savedFavorites) {
      try {
        const parsedFavorites = JSON.parse(savedFavorites)
        console.log('Parsed favorites:', parsedFavorites)
        setFavorites(parsedFavorites)
      } catch (error) {
        console.error("Error parsing favorites from localStorage:", error)
        setFavorites([])
      }
    } else {
      console.log('No favorites found in localStorage')
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
    if (!user) {
      console.log('User not authenticated - cannot favorite papers')
      return
    }

    console.log('Toggling favorite for paper:', paperId)
    const updatedFavorites = favorites.includes(paperId)
      ? favorites.filter((id) => id !== paperId)
      : [...favorites, paperId]

    console.log('Updated favorites:', updatedFavorites)
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Try router.back() first, fallback to home if no history
                  if (window.history.length > 1) {
                    router.back();
                  } else {
                    router.push('/');
                  }
                }}
                className="shrink-0"
              >
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
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <div className="text-center">
                <p className="text-muted-foreground">{searchStatus}</p>
                <p className="text-xs text-muted-foreground mt-2">Building contextual knowledge base...</p>
              </div>
            </div>
          )}

          {!loading && hasSearched && papers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No papers found for your search query.</p>
            </div>
          )}

          {!loading && hasSearched && papers.length > 0 && (
            <div className="space-y-6">
              {papers.map((paper) => (
              <Card
                key={paper.id}
                className="p-6 transition-all duration-200 light-shadow dark:dark-glow hover:light-shadow-lg dark:hover:dark-glow-lg"
              >
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="w-24 h-32 bg-muted rounded border light-shadow dark:dark-glow flex items-center justify-center">
                      <span className="text-xs text-muted-foreground text-center p-2">arXiv Paper</span>
                    </div>
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
                          className="shrink-0 ml-2 hover:bg-pink-50 dark:hover:bg-pink-950"
                          title={favorites.includes(paper.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart
                            className={`h-4 w-4 transition-colors ${
                              favorites.includes(paper.id)
                                ? "fill-pink-500 text-pink-500"
                                : "text-muted-foreground hover:text-pink-500"
                            }`}
                          />
                        </Button>
                      )}
                      {!user && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="shrink-0 ml-2 opacity-50"
                          title="Sign in to favorite papers"
                        >
                          <Heart className="h-4 w-4 text-muted-foreground" />
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
                          window.open(paper.pdf_url, "_blank")
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Paper Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs light-shadow dark:dark-glow bg-transparent"
                        onClick={() => {
                          if (user) {
                            handlePaperAccess(paper, "chat")
                            router.push(`/chat/${paper.id}`)
                          } else {
                            console.log('User not authenticated - redirecting to sign in')
                            // Could show a sign-in prompt or redirect to auth
                            alert('Please sign in to chat with papers')
                          }
                        }}
                        disabled={!user}
                        title={user ? "Chat with this paper" : "Sign in to chat with papers"}
                      >
                        <HelpCircle className="h-3 w-3 mr-1" />
                        Ask
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
              ))}
            </div>
          )}

          {!loading && hasSearched && papers.length > 0 && (
            <div className="text-center mt-8 text-sm space-y-2">
              <p className="text-muted-foreground">
                Showing top {papers.length} contextually relevant results
              </p>
              {searchStatus && (
                <p className="text-xs text-muted-foreground">{searchStatus}</p>
              )}
            </div>
          )}
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
