import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import Supermemory from "supermemory";

const client = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY!,
});

export async function POST(request: Request) {
  const {
    question,
    collection,
    conversationHistory = [],
  } = await request.json();

  try {
    console.log("🔍 Supermemory document search request:", {
      question,
      collection,
    });

    // Search through documents with containerTags for chatbot functionality
    const searchResults = await client.search.documents({
      q: question,
      containerTags: [collection],
      limit: 8,
    });

    console.log(
      "📊 Supermemory document response:",
      JSON.stringify(searchResults, null, 2),
    );
    console.log(
      `Found ${searchResults.total || 0} documents in ${searchResults.timing || 0}ms`,
    );

    // Use the direct response format for documents
    const results = searchResults.results || [];

    console.log("📊 Documents found:");
    results.forEach((doc: any, i: number) => {
      console.log(
        `${i + 1}. ${doc.title || "Document"} (Score: ${doc.score || 0})`,
      );
      console.log(`   ${doc.chunks?.length || 0} chunks found`);
    });

    if (results.length === 0) {
      console.log(
        "🔄 No results with containerTags, trying without containerTags...",
      );

      // Try fallback search through documents without containerTags
      const fallbackResponse = await client.search.documents({
        q: `${question} ${collection}`,
        limit: 8,
      });

      console.log(
        "📊 Fallback search response:",
        JSON.stringify(fallbackResponse, null, 2),
      );
      console.log(
        `Found ${fallbackResponse.total} documents in ${fallbackResponse.timing}ms (fallback)`,
      );

      const fallbackResults = fallbackResponse.results || [];

      if (fallbackResults.length === 0) {
        return Response.json({
          answer:
            "I couldn't find any relevant information in the uploaded documents to answer your question. The document may still be processing or the search terms may not match the content.",
          sources: [],
          confidence: 0,
          debug: {
            collection,
            searchAttempts: 2,
            containerTagSearch: "no results",
            fallbackSearch: "no results",
          },
        });
      }

      // Use fallback results
      console.log("✅ Using fallback search results:", fallbackResults.length);
      // Update our variables to use fallback results
      results.splice(0, results.length, ...fallbackResults);
    }

    // Prepare context from document search results
    const context = results
      .map((result: any, index: number) => {
        const chunks = (result.chunks || [])
          .filter((chunk: any) => chunk.isRelevant)
          .slice(0, 3)
          .map((chunk: any) => chunk.content)
          .join("\n\n");

        return `[Document ${index + 1}: "${result.title || "Document"}"]${chunks ? `\n${chunks}` : "\nNo content available"}`;
      })
      .join("\n\n---\n\n");

    // Prepare sources for citation from documents
    const sources = results.map((result: any, index: number) => ({
      id: result.documentId || result.id,
      title: result.title || "Untitled Document",
      type: result.type || "document",
      relevantChunks: (result.chunks || []).filter(
        (chunk: any) => chunk.isRelevant,
      ).length,
      score: result.score || 0,
      citationNumber: index + 1,
    }));

    const messages = [
      ...conversationHistory,
      {
        role: "user" as const,
        content: question,
      },
    ];

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      messages,
      system: `You are a helpful document Q&A assistant. Answer questions based ONLY on the provided document context.

CONTEXT FROM DOCUMENTS:
${context}

INSTRUCTIONS:
1. Answer the question using ONLY the information from the provided documents
2. Include specific citations in your response using [Document X] format
3. If the documents don't contain enough information, say so clearly
4. Be accurate and quote directly when possible
5. If multiple documents support a point, cite all relevant ones
6. Maintain a helpful, professional tone

CITATION FORMAT:
- Use [Document 1], [Document 2], etc. to cite sources
- Place citations after the relevant information
- Example: "The process involves three steps [Document 1]. However, some experts recommend a four-step approach [Document 3]."

If the question cannot be answered from the provided documents, respond with: "I don't have enough information in the provided documents to answer this question accurately."`,
      temperature: 0.1,
      maxTokens: 1000,
    });

    return Response.json({
      answer: result.text,
      sources,
      searchResultsCount: results.length,
      totalResults: searchResults.total || 0,
      confidence: Math.round(
        (results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length) *
          100,
      ),
    });
  } catch (error) {
    console.error("Q&A API error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      cause: error.cause,
    });

    return Response.json(
      {
        error: "Failed to process question",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: {
          question,
          collection,
          errorType: error.name,
          stack: error.stack,
        },
      },
      { status: 500 },
    );
  }
}
