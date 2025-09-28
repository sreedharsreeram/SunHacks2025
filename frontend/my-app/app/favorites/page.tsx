"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { useSidebarContext } from "@/components/sidebar-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ArrowLeft, MessageCircle, Clock, Calendar, ExternalLink, Heart, HelpCircle } from "lucide-react"
import { ArxivPaper } from "@/lib/arxiv-scraper"

export default function FavoritesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { isHovered } = useSidebarContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])
  const [favoritePapers, setFavoritePapers] = useState<ArxivPaper[]>([])
  const [sortBy, setSortBy] = useState<"latest" | "oldest">("latest")

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      router.push("/")
      return
    }

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem("citesight-favorites")
    const savedPapers = localStorage.getItem("citesight-favorite-papers")

    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }

    if (savedPapers) {
      setFavoritePapers(JSON.parse(savedPapers))
    }
  }, [user, router])

  const toggleFavorite = async (paper: ArxivPaper) => {
    const wasAlreadyFavorited = favorites.includes(paper.id)
    const updatedFavoriteIds = wasAlreadyFavorited
      ? favorites.filter((id) => id !== paper.id)
      : [...favorites, paper.id]

    setFavorites(updatedFavoriteIds)
    localStorage.setItem("citesight-favorites", JSON.stringify(updatedFavoriteIds))

    const updatedPapers = wasAlreadyFavorited
      ? favoritePapers.filter((p) => p.id !== paper.id)
      : [...favoritePapers.filter((p) => p.id !== paper.id), paper]

    setFavoritePapers(updatedPapers)
    localStorage.setItem("citesight-favorite-papers", JSON.stringify(updatedPapers))

    // Automatically upload to Supermemory when favorited (not when unfavorited)
    if (!wasAlreadyFavorited && paper.pdf_url) {
      try {
        console.log('Auto-uploading paper to Supermemory:', paper.title)
        const response = await fetch('/api/supermemory/ingest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdfUrl: paper.pdf_url,
            paperId: paper.id,
            title: paper.title,
            authors: paper.authors || []
          }),
        })

        const result = await response.json()

        if (result.success) {
          console.log('Paper successfully uploaded to Supermemory')
          localStorage.setItem(`supermemory-ingested-${paper.id}`, 'true')
        } else {
          console.warn('Failed to upload paper to Supermemory:', result.error)
        }
      } catch (error) {
        console.error('Error uploading paper to Supermemory:', error)
      }
    }
  }

  if (!user) {
    return null // Will redirect
  }

  const filteredPapers = favoritePapers.filter(
    (paper) =>
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors.some((author) => author.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const sortedPapers = [...filteredPapers].sort((a, b) => {
    const yearA = a.year || new Date(a.published_date).getFullYear()
    const yearB = b.year || new Date(b.published_date).getFullYear()
    return sortBy === "latest" ? yearB - yearA : yearA - yearB
  })

  const handleAskClick = (paperId: string) => {
    router.push(`/chat/${paperId}`)
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
              <h1 className="text-3xl font-serif font-bold">Favorites</h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for a favorited paper..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10 bg-card light-shadow dark:dark-glow relative z-10"
                />
              </div>

              {/* Sort Button */}
              <Button
                variant="outline"
                onClick={() => setSortBy(sortBy === "latest" ? "oldest" : "latest")}
                className="shrink-0 h-10 light-shadow dark:dark-glow"
              >
                {sortBy === "latest" ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Latest to Oldest
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Oldest to Latest
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {sortedPapers.length === 0 ? (
            <div className="text-center py-12">
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  {favoritePapers.length === 0 ? "You haven't favorited any papers yet." : "No papers match your search."}
                </p>
                {favoritePapers.length === 0 && <Button onClick={() => router.push("/search")}>Browse Papers</Button>}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedPapers.map((paper) => (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(paper)
                          }}
                          className="shrink-0 ml-2 hover:bg-pink-50 dark:hover:bg-pink-950"
                          title="Remove from favorites"
                        >
                          <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
                        </Button>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {paper.authors.join(", ")} • {paper.year || new Date(paper.published_date).getFullYear()} • {paper.venue || 'arXiv'}
                      </p>

                      <p className="text-sm leading-relaxed">{paper.summary}</p>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs light-shadow dark:dark-glow bg-transparent"
                          onClick={() => {
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
                            console.log('Ask button clicked for paper:', paper.id, paper.title)
                            // Store the paper data for the chat page
                            localStorage.setItem(`citesight-paper-${paper.id}`, JSON.stringify(paper))
                            console.log('Paper data stored, navigating to chat page...')
                            router.push(`/chat/${encodeURIComponent(paper.id)}`)
                          }}
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
        </div>

      </div>
    </div>
  )
}
