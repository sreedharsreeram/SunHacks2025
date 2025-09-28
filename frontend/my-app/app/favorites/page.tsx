"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, Home, ArrowLeft, MessageCircle, Clock, Calendar } from "lucide-react"

// Mock paper data (same as search page)
const mockPapers = [
  {
    id: "1",
    title: "Attention Is All You Need",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar"],
    summary:
      "This paper introduces the Transformer architecture, a novel neural network architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. The Transformer model achieves superior performance on translation tasks while being more parallelizable and requiring significantly less time to train than existing architectures.",
    thumbnail: "/transformer-neural-network-paper.jpg",
    year: 2017,
    venue: "NIPS",
  },
  {
    id: "2",
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    authors: ["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee"],
    summary:
      "BERT represents a new method of pre-training language representations which obtains state-of-the-art results on a wide array of Natural Language Processing tasks. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context.",
    thumbnail: "/bert-language-model-paper.jpg",
    year: 2018,
    venue: "NAACL",
  },
  {
    id: "3",
    title: "GPT-3: Language Models are Few-Shot Learners",
    authors: ["Tom B. Brown", "Benjamin Mann", "Nick Ryder"],
    summary:
      "This paper demonstrates that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches. GPT-3 achieves strong performance on many NLP datasets, including translation, question-answering, and cloze tasks, as well as several tasks that require on-the-fly reasoning or domain adaptation.",
    thumbnail: "/gpt-3-language-model-paper.jpg",
    year: 2020,
    venue: "NeurIPS",
  },
  {
    id: "4",
    title: "ResNet: Deep Residual Learning for Image Recognition",
    authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren"],
    summary:
      "This paper presents a residual learning framework to ease the training of networks that are substantially deeper than those used previously. The framework explicitly reformulates the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. This approach enables the training of networks with hundreds of layers while maintaining excellent performance.",
    thumbnail: "/resnet-deep-learning-paper.jpg",
    year: 2016,
    venue: "CVPR",
  },
  {
    id: "5",
    title: "AlexNet: ImageNet Classification with Deep Convolutional Neural Networks",
    authors: ["Alex Krizhevsky", "Ilya Sutskever", "Geoffrey E. Hinton"],
    summary:
      "This paper presents a large, deep convolutional neural network that was trained to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest into the 1000 different classes. The network consists of five convolutional layers, some of which are followed by max-pooling layers, and three fully-connected layers with a final 1000-way softmax. The architecture achieved unprecedented performance on the ImageNet dataset.",
    thumbnail: "/alexnet-cnn-paper.jpg",
    year: 2012,
    venue: "NIPS",
  },
]

export default function FavoritesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"latest" | "oldest">("latest")

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      router.push("/")
      return
    }

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem("citesight-favorites")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [user, router])

  if (!user) {
    return null // Will redirect
  }

  const favoritePapers = mockPapers.filter((paper) => favorites.includes(paper.id))

  const filteredPapers = favoritePapers.filter(
    (paper) =>
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors.some((author) => author.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const sortedPapers = [...filteredPapers].sort((a, b) => {
    // For demo purposes, sort by year as a proxy for recency
    return sortBy === "latest" ? b.year - a.year : a.year - b.year
  })

  const handleAskClick = (paperId: string) => {
    router.push(`/chat/${paperId}`)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-background ml-64">
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
                  className="pl-10 pr-4 h-10 bg-card light-shadow dark:dark-glow"
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
                  {favorites.length === 0 ? "You haven't favorited any papers yet." : "No papers match your search."}
                </p>
                {favorites.length === 0 && <Button onClick={() => router.push("/search")}>Browse Papers</Button>}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedPapers.map((paper) => (
                <Card key={paper.id} className="p-6 light-shadow dark:dark-glow transition-all duration-200">
                  <div className="space-y-4">
                    {/* Paper Info */}
                    <div className="space-y-3">
                      <h3 className="font-serif font-semibold text-xl leading-tight">{paper.title}</h3>

                      <p className="text-sm text-muted-foreground">
                        {paper.authors.join(", ")} • {paper.year}
                      </p>

                      <p className="text-base leading-relaxed text-foreground/90 mt-4">{paper.summary}</p>
                    </div>

                    {/* Ask Button */}
                    <div className="pt-4">
                      <Button
                        onClick={() => handleAskClick(paper.id)}
                        className="w-full light-shadow dark:dark-glow"
                        title="Click here to learn more about the paper"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Ask
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Bottom Navigation */}
        <div className="fixed bottom-6 left-72 flex flex-col gap-3 z-50">
          <Button
            onClick={() => router.push("/")}
            size="sm"
            className="h-12 w-12 rounded-full p-0 light-shadow-lg dark:dark-glow-lg hover:light-shadow-lg dark:hover:dark-glow-lg transition-all duration-200"
            title="Home"
          >
            <Home className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => router.push("/search")}
            variant="outline"
            size="sm"
            className="h-12 w-12 rounded-full p-0 light-shadow-lg dark:dark-glow-lg hover:light-shadow-lg dark:hover:dark-glow-lg transition-all duration-200 bg-card"
            title="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
