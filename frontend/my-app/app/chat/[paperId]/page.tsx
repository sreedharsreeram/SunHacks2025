"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/sidebar";
import { useSidebarContext } from "@/components/sidebar-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  ArrowLeft,
  Bot,
  User,
  ExternalLink,
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
// import { useChat } from "ai/rsc";

// Mock paper data with full content for all papers
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
    content: `Abstract

The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature.

1 Introduction

Recurrent neural networks, long short-term memory [13] and gated recurrent [7] neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation [35, 2, 5]. Numerous efforts have since continued to push the boundaries of recurrent language models and encoder-decoder architectures [38, 24, 15].

Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states ht, as a function of the previous hidden state ht−1 and the input for position t. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples. Recent work has achieved significant improvements in computational efficiency through factorization tricks [21] and conditional computation [32], while also improving model performance in the latter case. The fundamental constraint of sequential computation, however, remains.

Attention mechanisms have become an integral part of compelling sequence modeling and transduction models in various tasks, allowing modeling of dependencies without regard to their distance in the input or output sequences [2, 19]. In all but a few cases [27], however, such attention mechanisms are used in conjunction with a recurrent network.

In this work we propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output. The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours on eight P100 GPUs.`,
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
    content: `Abstract

We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers. As a result, the pre-trained BERT model can be fine-tuned with just one additional output layer to create state-of-the-art models for a wide range of tasks, such as question answering and language inference, without substantial task-specific architecture modifications.

BERT is conceptually simple and empirically powerful. It obtains new state-of-the-art results on eleven natural language processing tasks, including pushing the GLUE score to 80.5% (7.7% point absolute improvement), MultiNLI accuracy to 86.7% (4.6% absolute improvement), SQuAD v1.1 question answering Test F1 to 93.2 (1.5 point absolute improvement) and SQuAD v2.0 Test F1 to 83.1 (5.1 point absolute improvement).

1 Introduction

Language model pre-training has been shown to be effective for improving many natural language processing tasks. These include sentence-level tasks such as natural language inference and paraphrasing, which aim to predict the relationships between sentences by analyzing them holistically, as well as token-level tasks such as named entity recognition and question answering, where models are required to produce fine-grained output at the token level.

There are two existing strategies for applying pre-trained language representations to downstream tasks: feature-based and fine-tuning. The feature-based approach, such as ELMo, uses task-specific architectures that include the pre-trained representations as additional features. The fine-tuning approach, such as the Generative Pre-trained Transformer (OpenAI GPT), introduces minimal task-specific parameters, and is trained on the downstream tasks by simply fine-tuning all pre-trained parameters. The two approaches share the same objective function during pre-training, where they use unidirectional language models to learn general language representations.`,
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
    content: `Abstract

Recent work has demonstrated substantial gains on many NLP tasks and benchmarks by pre-training on a large corpus of text followed by fine-tuning on a specific task. While typically task-agnostic in architecture, this method still requires task-specific fine-tuning datasets of thousands or tens of thousands of examples. By contrast, humans can generally perform a new language task from only a few examples or from simple instructions – something which current NLP systems still largely struggle with. Here we show that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches.

Specifically, we train GPT-3, an autoregressive language model with 175 billion parameters, 10x more than any previous non-sparse language model, and test its performance in the few-shot setting. For all tasks, GPT-3 is applied without any gradient updates or fine-tuning, with tasks and few-shot demonstrations specified purely via text interaction with the model. GPT-3 achieves strong performance on many NLP datasets, including translation, question-answering, and cloze tasks, as well as several tasks that require on-the-fly reasoning or domain adaptation, such as unscrambling words, using a novel word in a sentence, or performing 3-digit arithmetic.

1 Introduction

Recent years have featured a trend towards pre-trained language representations in NLP systems, applied in increasingly flexible and task-agnostic ways for downstream transfer. First, single-layer representations were learned using word vectors and applied to a variety of NLP tasks. Then, RNNs with multiple layers of representations and contextual state were used to form stronger representations (though still applied to task-specific architectures). More recently, pre-trained recurrent or transformer language models have been directly fine-tuned, entirely replacing task-specific architectures.

This last paradigm has led to substantial progress on many challenging NLP tasks such as reading comprehension, question answering, textual entailment, and many others, and has continued to advance based on new architectures and algorithms and increased computational budgets for training.`,
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
    content: `Abstract

Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. We provide comprehensive empirical evidence showing that these residual networks are easier to optimize, and can gain accuracy from considerably increased depth. On the ImageNet dataset we evaluate residual nets with a depth of up to 152 layers—8× deeper than VGG nets but still having lower complexity.

An ensemble of these residual nets achieves 3.57% error on the ImageNet test set. This result won the 1st place on the ILSVRC 2015 classification task. We also present analysis on CIFAR-10 with 100 and 1000 layers. The depth of representations is of central importance for many visual recognition tasks. Solely due to our extremely deep representations, we obtain a 28% relative improvement on the COCO object detection dataset. Deep residual nets are foundations of our submissions to ILSVRC & COCO 2015 competitions, where we also won the 1st places on the tasks of ImageNet detection, ImageNet localization, COCO detection, and COCO segmentation.

1 Introduction

Deep convolutional neural networks have led to a series of breakthroughs for image classification. Deep networks naturally integrate low/mid/high-level features and classifiers in an end-to-end multilayer fashion, and the "levels" of features can be enriched by the number of stacked layers (depth). Recent evidence reveals that network depth is of crucial importance, and the leading results on the challenging ImageNet dataset all exploit "very deep" models, with a depth of sixteen to thirty layers. Many other nontrivial visual recognition tasks have also greatly benefited from very deep models.

Driven by the significance of depth, a question arises: Is learning better networks as easy as stacking more layers? An obstacle to answering this question was the notorious problem of vanishing/exploding gradients, which hamper convergence from the beginning. This problem, however, has been largely addressed by normalized initialization and intermediate normalization layers, which enable networks with tens of layers to start converging for stochastic gradient descent (SGD) with backpropagation.`,
  },
  {
    id: "5",
    title:
      "AlexNet: ImageNet Classification with Deep Convolutional Neural Networks",
    authors: ["Alex Krizhevsky", "Ilya Sutskever", "Geoffrey E. Hinton"],
    summary:
      "This paper presents a large, deep convolutional neural network that was trained to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest into the 1000 different classes.",
    thumbnail: "/alexnet-cnn-paper.jpg",
    year: 2012,
    venue: "NIPS",
    content: `Abstract

We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest into the 1000 different classes. On the test data, we achieved top-1 and top-5 error rates of 37.5% and 17.0% which is considerably better than the previous state-of-the-art. The neural network, which has 60 million parameters and 650,000 neurons, consists of five convolutional layers, some of which are followed by max-pooling layers, and three fully-connected layers with a final 1000-way softmax.

To make training faster, we used non-saturating neurons and a very efficient GPU implementation of the convolution operation. To reduce overfitting in the fully-connected layers we employed a recently-developed regularization method called "dropout" that proved to be very effective. We also entered a variant of this model in the ILSVRC-2012 competition and achieved a winning top-5 test error rate of 15.3%, compared to 26.2% achieved by the second-best entry.

1 Introduction

Current approaches to object recognition make essential use of machine learning methods. To improve their performance, we can collect larger datasets, learn more powerful models, and use better techniques for preventing overfitting. Until recently, datasets of labeled images were relatively small — on the order of tens of thousands of images (e.g., NORB, Caltech-101/256, and CIFAR-10/100). Simple recognition tasks can be solved quite well with datasets of this size, especially if they are augmented with label-preserving transformations.

But objects in realistic settings exhibit considerable variability, so to learn to recognize them it is necessary to use much larger training sets. And indeed, the shortcomings of small image datasets have been widely recognized (e.g., Pinto et al.), but it has only recently become possible to collect labeled datasets with millions of images. The new larger datasets include LabelMe, which consists of hundreds of thousands of fully-segmented images, and ImageNet, which consists of over 15 million labeled high-resolution images in over 22,000 categories.`,
  },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { isHovered } = useSidebarContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState<
    "idle" | "ingesting" | "success" | "error"
  >("idle");
  const [ingestionError, setIngestionError] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const paperId = params?.paperId
    ? decodeURIComponent(params.paperId as string)
    : "";
  const [paper, setPaper] = useState<any>(null);

  // Function to ingest PDF into Supermemory
  const ingestPaperPDF = async () => {
    if (
      !paper?.pdf_url ||
      ingestionStatus === "ingesting" ||
      ingestionStatus === "success"
    )
      return;

    setIsIngesting(true);
    setIngestionStatus("ingesting");
    setIngestionError("");

    try {
      const response = await fetch("/api/supermemory/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfUrl: paper.pdf_url,
          paperId: paperId,
          title: paper.title,
          authors: paper.authors || [],
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIngestionStatus("success");
        // Store ingestion success in localStorage to avoid re-ingesting
        localStorage.setItem(`supermemory-ingested-${paperId}`, "true");
      } else {
        throw new Error(result.error || "Ingestion failed");
      }
    } catch (error) {
      console.error("PDF ingestion error:", error);
      setIngestionStatus("error");
      setIngestionError(
        error instanceof Error ? error.message : "Failed to ingest PDF",
      );
    } finally {
      setIsIngesting(false);
    }
  };

  // Load paper data from localStorage or fall back to mock data
  useEffect(() => {
    console.log("[v0] Loading paper data for paperId:", paperId);
    if (paperId) {
      const storageKey = `citesight-paper-${paperId}`;
      console.log("[v0] Looking for paper data with key:", storageKey);
      const storedPaper = localStorage.getItem(storageKey);
      if (storedPaper) {
        console.log(
          "[v0] Found stored paper data:",
          storedPaper.substring(0, 100) + "...",
        );
        try {
          const parsedPaper = JSON.parse(storedPaper);
          // Add content field if it doesn't exist (for ArXiv papers)
          if (!parsedPaper.content) {
            parsedPaper.content = `${parsedPaper.title}\n\nAuthors: ${parsedPaper.authors.join(", ")}\n\nAbstract:\n${parsedPaper.summary}\n\nThis is an ArXiv paper. For the full content, please refer to the original PDF at the provided link.`;
          }
          console.log(
            "[v0] Paper data loaded successfully:",
            parsedPaper.title,
          );
          setPaper(parsedPaper);

          // Check if PDF was already ingested
          const wasIngested = localStorage.getItem(
            `supermemory-ingested-${paperId}`,
          );
          if (wasIngested) {
            setIngestionStatus("success");
          }
        } catch (error) {
          console.error("[v0] Error parsing stored paper data:", error);
          // Fall back to mock data
          const mockPaper = mockPapers.find((p) => p.id === paperId);
          console.log("[v0] Falling back to mock paper:", mockPaper?.title);
          setPaper(mockPaper);
        }
      } else {
        console.log("[v0] No stored paper data found, trying mock data");
        // Fall back to mock data
        const mockPaper = mockPapers.find((p) => p.id === paperId);
        console.log("[v0] Mock paper found:", mockPaper?.title);
        setPaper(mockPaper);
      }
    }
  }, [paperId]);

  console.log("[v0] ChatPage - paperId:", paperId, "paper found:", !!paper);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    if (!paperId) {
      console.log("[v0] ChatPage - No paper ID provided");
      router.push("/search");
      return;
    }

    if (!paper) {
      console.log("[v0] ChatPage - Paper data not loaded yet");
      return;
    }

    const chatHistory = localStorage.getItem(`citesight-chat-${paperId}`);
    if (chatHistory) {
      try {
        const parsedHistory = JSON.parse(chatHistory).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(parsedHistory);
      } catch (error) {
        console.error("[v0] Error parsing chat history:", error);
        // Initialize with welcome message if parsing fails
        initializeWelcomeMessage();
      }
    } else {
      initializeWelcomeMessage();
    }

    function initializeWelcomeMessage() {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm here to help you understand "${paper?.title}". You can ask me questions about the paper's content, methodology, results, or any concepts you'd like clarified.`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [user, router, paperId, paper]); // Include paper in dependencies

  useEffect(() => {
    if (messages.length > 0 && paperId) {
      localStorage.setItem(
        `citesight-chat-${paperId}`,
        JSON.stringify(messages),
      );
    }
  }, [messages, paperId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    return null; // Will redirect
  }

  if (!paperId || !paper) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Paper not found</p>
          <Button onClick={() => router.push("/search")}>Back to Search</Button>
        </div>
      </div>
    );
  }

  // Handle streaming responses from the API
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      console.log("💬 Chat Debug:", {
        ingestionStatus,
        paperId,
        question: inputMessage,
        wasIngested: localStorage.getItem(`supermemory-ingested-${paperId}`),
      });

      // Use streaming Q&A if paper is ingested, otherwise show fallback
      if (ingestionStatus === "success") {
        console.log("✅ Using Supermemory streaming for response");

        const conversationHistory = messages.slice(-6).map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Create streaming response
        const response = await fetch("/api/supermemory/qa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: inputMessage,
            collection: paperId,
            conversationHistory,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle non-streaming response
        const result = await response.json();

        if (result.answer) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: result.answer + (result.sources?.length > 0 ? `\n\n**Sources:** ${result.sources.length} relevant passages found` : ''),
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          throw new Error('No answer received from Supermemory');
        }
      } else {
        console.log("⚠️ Document not ingested - showing fallback response");
        const fallbackResponse =
          "I'd love to help you understand this paper better! For more detailed insights, please wait for the document to be fully processed by clicking 'Enable Smart Chat', or I can provide general guidance based on the paper's abstract and title.\n\n**Debug**: Ingestion status is '" +
          ingestionStatus +
          "'. Try clicking 'Enable Smart Chat' first, or use the Debug Status button to check if documents were uploaded.";

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fallbackResponse,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your question. Please try again or rephrase your question.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div
        className={`flex-1 flex h-screen transition-all duration-300 ${isHovered ? "ml-64" : "ml-20"}`}
      >
        {/* Paper Content Panel */}
        <div className="w-1/2 border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border bg-card light-shadow dark:dark-glow">
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-serif font-bold">Paper Content</h1>
            </div>
            <h2 className="text-lg font-serif font-semibold leading-tight">
              {paper.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {paper.authors.join(", ")} • {paper.year} • {paper.venue}
            </p>
          </div>

          {/* Paper Content */}
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-sm max-w-none">
              {paper.pdf_url && (
                <div className="mb-4 p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm font-medium mb-2">Paper Access:</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(paper.pdf_url, "_blank")}
                      className="light-shadow dark:dark-glow"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original PDF
                    </Button>

                    {ingestionStatus === "idle" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={ingestPaperPDF}
                        disabled={isIngesting}
                        className="light-shadow dark:dark-glow"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Enable Smart Chat
                      </Button>
                    )}

                    {ingestionStatus === "ingesting" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="light-shadow dark:dark-glow"
                      >
                        <Upload className="h-4 w-4 mr-2 animate-pulse" />
                        Processing...
                      </Button>
                    )}

                    {ingestionStatus === "success" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="light-shadow dark:dark-glow text-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Smart Chat Ready
                      </Button>
                    )}

                    {/* Debug button to check document status */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            `/api/supermemory/status?paperId=${encodeURIComponent(paperId)}`,
                          );
                          const result = await response.json();
                          console.log("📋 Document status check:", result);
                          alert(
                            `Documents in collection: ${result.totalDocuments}\n\nCheck console for details`,
                          );
                        } catch (error) {
                          console.error("Status check failed:", error);
                          alert("Status check failed - see console");
                        }
                      }}
                      className="light-shadow dark:dark-glow text-blue-600"
                    >
                      🔍 Debug Status
                    </Button>

                    {ingestionStatus === "error" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={ingestPaperPDF}
                        className="light-shadow dark:dark-glow text-red-600"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Retry Processing
                      </Button>
                    )}
                  </div>

                  {ingestionStatus === "error" && ingestionError && (
                    <p className="text-xs text-red-600 mt-2">
                      {ingestionError}
                    </p>
                  )}

                  {ingestionStatus === "success" && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Document processed - Ask detailed questions about the
                      paper content!
                    </p>
                  )}
                </div>
              )}
              <div className="mb-6">
                <img
                  src={paper.thumbnail || "/placeholder.svg"}
                  alt={paper.title}
                  className="w-full max-w-md mx-auto rounded border light-shadow dark:dark-glow"
                />
              </div>
              <div className="whitespace-pre-line leading-relaxed">
                {paper.content}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Chat Panel */}
        <div className="w-1/2 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-border bg-card light-shadow dark:dark-glow">
            <h1 className="text-xl font-serif font-bold mb-1">Chatbot</h1>
            <p className="text-sm text-muted-foreground">{paper.title}</p>
          </div>

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
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <Card
                      className={`p-3 light-shadow dark:dark-glow ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
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
                placeholder="Ask anything about this paper..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
                className="flex-1 light-shadow dark:dark-glow"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                size="sm"
                className="light-shadow dark:dark-glow"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
