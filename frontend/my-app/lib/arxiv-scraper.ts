import axios from "axios";
import * as cheerio from "cheerio";
import { QueryProcessor, processQuery, QueryProcessorResult } from "./query-processor";
import { ResultPostProcessor, postProcessResults, PostProcessorResult } from "./result-post-processor";

export interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published_date: string;
  pdf_url: string;
  venue?: string;
  year?: number;
}

export interface ArxivSearchResult {
  success: boolean;
  data: ArxivPaper[];
  count: number;
  query: string;
  error?: string;
}

export interface EnhancedArxivSearchResult extends ArxivSearchResult {
  originalQuery?: string;
  enhancedQuery?: string;
  queryProcessingSuccess?: boolean;
  postProcessingApplied?: boolean;
  intentAnalysis?: {
    user_intent_identified: string;
    intent_specificity: string;
    intent_classification: string;
    total_papers_analyzed: number;
    intent_matched_papers: number;
    intent_coverage: string;
    intent_gaps: string[];
    intent_recommendations: string[];
  };
}

/**
 * Scrapes papers from ArXiv search results page
 * @param query The search term (e.g., "quantum computing").
 * @param maxResults The maximum number of results to return.
 * @returns A promise that resolves to an ArxivSearchResult object.
 */
export async function scrapePapers(
  query: string,
  maxResults: number = 200,
): Promise<ArxivSearchResult> {
  try {
    console.log(`🔍 Scraping ArXiv for: '${query}'`);

    // ArXiv search URL
    const searchUrl = `https://arxiv.org/search/?query=${encodeURIComponent(query)}&searchtype=all&abstracts=show&order=-announced_date_first&size=${maxResults}`;
    console.log(`📡 ArXiv URL: ${searchUrl}`);

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });

    console.log(`📊 Response status: ${response.status}`);

    const $ = cheerio.load(response.data);
    const papers: ArxivPaper[] = [];

    // Find each paper result
    $("li.arxiv-result").each((index, element) => {
      try {
        const $paper = $(element);

        // Extract paper ID from the first link
        const idLink = $paper.find("p.list-title a").first().attr("href");
        const id = idLink
          ? idLink
              .split("/")
              .pop()
              ?.replace("v1", "")
              .replace("v2", "")
              .replace("v3", "") || ""
          : "";

        // Extract title
        const title = $paper
          .find("p.title")
          .text()
          .replace("Title:", "")
          .trim();

        // Extract authors
        const authorsText = $paper
          .find("p.authors")
          .text()
          .replace("Authors:", "")
          .trim();
        const authors = authorsText
          .split(",")
          .map((author) => author.trim())
          .filter((author) => author.length > 0);

        // Extract abstract/summary
        const summary =
          $paper.find("span.abstract-full").text().trim() ||
          $paper.find("p.abstract").text().replace("Abstract:", "").trim();

        // Extract date
        const dateText = $paper.find("p.is-size-7").text();
        const dateMatch = dateText.match(/Submitted (\d{1,2} \w+ \d{4})/);
        const publishedDate = dateMatch ? new Date(dateMatch[1]) : new Date();

        // Generate PDF URL
        const pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;

        if (id && title && authors.length > 0) {
          papers.push({
            id,
            title: title.replace(/\s+/g, " "),
            summary: summary.replace(/\s+/g, " "),
            authors,
            published_date: publishedDate.toISOString().split("T")[0],
            pdf_url: pdfUrl,
            venue: "arXiv",
            year: publishedDate.getFullYear(),
          });
        }
      } catch (error) {
        console.error(`Error parsing paper ${index}:`, error);
      }
    });

    console.log(`✅ Successfully scraped ${papers.length} papers`);

    return {
      success: true,
      data: papers,
      count: papers.length,
      query: query,
    };
  } catch (error) {
    console.error("❌ Error scraping ArXiv:", error);
    return {
      success: false,
      data: [],
      count: 0,
      query: query,
      error: error instanceof Error ? error.message : "Unknown scraping error",
    };
  }
}

/**
 * Alternative scraper using ArXiv API (original approach as fallback)
 * @param query The search term
 * @param maxResults Maximum number of results
 */
export async function scrapeArxivAPI(
  query: string,
  maxResults: number = 150,
): Promise<ArxivSearchResult> {
  try {
    console.log(`🔍 Using ArXiv API fallback for: '${query}'`);

    const baseUrl = "http://export.arxiv.org/api/query?";
    const searchQuery = `search_query=all:${encodeURIComponent(query)}`;
    const results = `&start=0&max_results=${maxResults}`;
    const sortBy = "&sortBy=relevance&sortOrder=descending";
    const apiUrl = `${baseUrl}${searchQuery}${results}${sortBy}`;

    const response = await axios.get(apiUrl, {
      timeout: 10000,
    });

    // Parse XML using cheerio
    const $ = cheerio.load(response.data, { xmlMode: true });
    const papers: ArxivPaper[] = [];

    $("entry")
      .slice(0, maxResults)
      .each((index, element) => {
        const $entry = $(element);

        const id =
          $entry.find("id").text().split("/").pop()?.replace(/v\d+$/, "") || "";
        const title = $entry.find("title").text().trim().replace(/\s+/g, " ");
        const summary = $entry
          .find("summary")
          .text()
          .trim()
          .replace(/\s+/g, " ");
        const publishedDate = new Date($entry.find("published").text());

        // Extract authors
        const authors: string[] = [];
        $entry.find("author name").each((i, authorEl) => {
          authors.push($(authorEl).text().trim());
        });

        // Generate PDF URL
        let pdfUrl = "";
        $entry.find("link").each((i, linkEl) => {
          const $link = $(linkEl);
          if ($link.attr("title") === "pdf") {
            pdfUrl = $link.attr("href") || "";
          }
        });

        if (!pdfUrl && id) {
          pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;
        }

        if (id && title && authors.length > 0) {
          papers.push({
            id,
            title,
            summary,
            authors,
            published_date: publishedDate.toISOString().split("T")[0],
            pdf_url: pdfUrl,
            venue: "arXiv",
            year: publishedDate.getFullYear(),
          });
        }
      });

    return {
      success: true,
      data: papers,
      count: papers.length,
      query: query,
    };
  } catch (error) {
    console.error("❌ Error with ArXiv API fallback:", error);
    return {
      success: false,
      data: [],
      count: 0,
      query: query,
      error: error instanceof Error ? error.message : "API fallback error",
    };
  }
}

/**
 * Optimized scraper for enhanced queries with better result handling
 * @param query Enhanced query from Gemini
 * @param maxResults Maximum number of results
 * @returns Promise<ArxivSearchResult> Optimized search results
 */
export async function scrapeWithOptimizedQuery(
  query: string,
  maxResults: number = 200,
): Promise<ArxivSearchResult> {
  try {
    console.log(`🎯 Using optimized search for enhanced query: '${query}'`);

    // For enhanced queries, try multiple search strategies
    const strategies = [
      // Strategy 1: Direct web scraping with enhanced query
      () => scrapePapers(query, maxResults),
      
      // Strategy 2: API fallback with enhanced query
      () => scrapeArxivAPI(query, maxResults),
      
      // Strategy 3: Simplified query if complex query fails
      () => {
        const simplifiedQuery = simplifyComplexQuery(query);
        if (simplifiedQuery !== query) {
          console.log(`🔄 Trying simplified query: '${simplifiedQuery}'`);
          return scrapePapers(simplifiedQuery, maxResults);
        }
        return Promise.resolve({
          success: false,
          data: [],
          count: 0,
          query: query,
          error: "All search strategies failed"
        });
      }
    ];

    // Try each strategy until one succeeds
    for (let i = 0; i < strategies.length; i++) {
      try {
        const result = await strategies[i]();
        if (result.success && result.data.length > 0) {
          console.log(`✅ Strategy ${i + 1} succeeded with ${result.data.length} results`);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ Strategy ${i + 1} failed:`, error);
        if (i === strategies.length - 1) {
          throw error;
        }
      }
    }

    // If all strategies fail, return empty result
    return {
      success: false,
      data: [],
      count: 0,
      query: query,
      error: "All optimized search strategies failed"
    };

  } catch (error) {
    console.error("❌ Error in optimized search:", error);
    return {
      success: false,
      data: [],
      count: 0,
      query: query,
      error: error instanceof Error ? error.message : "Optimized search failed"
    };
  }
}

/**
 * Simplifies complex queries that might be too specific for arXiv search
 * @param query Complex enhanced query
 * @returns Simplified query string
 */
function simplifyComplexQuery(query: string): string {
  // Remove overly complex boolean logic while preserving key terms
  let simplified = query;
  
  // Extract key terms from complex boolean expressions
  const keyTerms = simplified.match(/"([^"]+)"/g);
  if (keyTerms && keyTerms.length > 0) {
    // Use the first few key terms as a simpler query
    const terms = keyTerms.slice(0, 3).map(term => term.replace(/"/g, ''));
    simplified = terms.join(' ');
  }
  
  // Remove field prefixes for simpler search
  simplified = simplified.replace(/(all:|ti:|au:|abs:|cat:)/g, '');
  
  // Clean up boolean operators
  simplified = simplified.replace(/\s+(AND|OR|ANDNOT)\s+/g, ' ');
  
  // Remove parentheses
  simplified = simplified.replace(/[()]/g, '');
  
  // Clean up extra spaces
  simplified = simplified.replace(/\s+/g, ' ').trim();
  
  return simplified;
}

/**
 * Scraper with fallback - tries main scraping first, then API
 */
export async function scrapeWithFallback(
  query: string,
  maxResults: number = 150,
): Promise<ArxivSearchResult> {
  // Try main web scraping first
  const mainResult = await scrapePapers(query, maxResults);

  if (mainResult.success && mainResult.data.length > 0) {
    return mainResult;
  }

  // Fallback to ArXiv API if web scraping fails
  console.log("📡 Web scraping failed, trying ArXiv API fallback...");
  return await scrapeArxivAPI(query, maxResults);
}

/**
 * Enhanced search with AI-powered query processing
 * Processes natural language queries and converts them to optimized arXiv search queries
 * @param userQuery The user's natural language research request
 * @param maxResults Maximum number of results to return
 * @param apiKey Optional Gemini API key
 * @returns Promise<EnhancedArxivSearchResult> Enhanced search results with query processing info
 */
export async function searchWithQueryEnhancement(
  userQuery: string,
  maxResults: number = 200,
  apiKey?: string
): Promise<EnhancedArxivSearchResult> {
  try {
    console.log(`🧠 Processing natural language query: '${userQuery}'`);

    // Process the query to enhance it for arXiv search
    const queryResult = await processQuery(userQuery, apiKey);
    
    if (!queryResult.success) {
      console.warn("⚠️ Query processing failed, using original query:", queryResult.error);
      // Fallback to original query if processing fails
      const fallbackResult = await scrapeWithFallback(userQuery, maxResults);
      return {
        ...fallbackResult,
        originalQuery: userQuery,
        enhancedQuery: userQuery,
        queryProcessingSuccess: false
      };
    }

    console.log(`✨ Enhanced query: '${queryResult.enhancedQuery}'`);

    // Use the enhanced query for searching with optimized parameters
    const searchResult = await scrapeWithOptimizedQuery(queryResult.enhancedQuery, maxResults);

    // Limit to 25 results even in basic enhancement
    const limitedResult = {
      ...searchResult,
      data: searchResult.data.slice(0, 25),
      count: Math.min(searchResult.data.length, 25),
      originalQuery: userQuery,
      enhancedQuery: queryResult.enhancedQuery,
      queryProcessingSuccess: true
    };
    
    console.log(`🎯 BASIC ENHANCEMENT: Returning ${limitedResult.count} papers`);
    return limitedResult;

  } catch (error) {
    console.error("❌ Error in enhanced search:", error);
    
    // Fallback to basic search if enhanced search fails
    const fallbackResult = await scrapeWithFallback(userQuery, maxResults);
    const limitedFallback = {
      ...fallbackResult,
      data: fallbackResult.data.slice(0, 25),
      count: Math.min(fallbackResult.data.length, 25),
      originalQuery: userQuery,
      enhancedQuery: userQuery,
      queryProcessingSuccess: false,
      error: error instanceof Error ? error.message : "Enhanced search failed"
    };
    
    console.log(`🎯 ERROR FALLBACK: Returning ${limitedFallback.count} papers`);
    return limitedFallback;
  }
}

/**
 * Full AI-enhanced search with both query processing AND result post-processing
 * Performs two rounds of Gemini integration for optimal results
 * @param userQuery The user's natural language research request
 * @param maxResults Maximum number of results to return
 * @param apiKey Optional Gemini API key
 * @returns Promise<EnhancedArxivSearchResult> Fully enhanced search results
 */
export async function searchWithFullAIEnhancement(
  userQuery: string,
  maxResults: number = 200,
  apiKey?: string
): Promise<EnhancedArxivSearchResult> {
  try {
    console.log(`🚀 Starting full AI enhancement for: '${userQuery}'`);

    // Step 1: Query enhancement and arXiv search
    console.log('📝 Step 1: Query enhancement and arXiv search...');
    const searchResult = await searchWithQueryEnhancement(userQuery, maxResults, apiKey);
    
    if (!searchResult.success || searchResult.data.length === 0) {
      console.log('⚠️ No results from initial search, skipping post-processing');
      return searchResult;
    }

    console.log(`✅ Found ${searchResult.data.length} papers from initial search`);

    // Step 2: Post-processing with Gemini (same structure as query-processor)
    console.log('🧠 Step 2: Post-processing results with Gemini...');
    const postProcessResult = await postProcessResults(searchResult, userQuery, apiKey);

    if (!postProcessResult.success) {
      console.warn('⚠️ Post-processing failed, returning original results:', postProcessResult.error);
      // Even if post-processing fails, limit to 25 results
      const limitedSearchResult = {
        ...searchResult,
        data: searchResult.data.slice(0, 25),
        count: Math.min(searchResult.data.length, 25)
      };
      console.log(`🎯 FALLBACK: Returning ${limitedSearchResult.count} papers (post-processing failed)`);
      return limitedSearchResult;
    }

    console.log('✅ Post-processing completed successfully');

    // FINAL SAFETY CHECK: Ensure exactly 25 results
    const finalResult = {
      ...postProcessResult.enhancedResults,
      data: postProcessResult.enhancedResults.data.slice(0, 25),
      count: Math.min(postProcessResult.enhancedResults.data.length, 25)
    };
    
    console.log(`🎯 FINAL RESULT: Returning exactly ${finalResult.count} papers`);
    return finalResult;

  } catch (error) {
    console.error("❌ Error in full AI enhancement:", error);
    
    // Fallback to basic search if full enhancement fails
    const fallbackResult = await scrapeWithFallback(userQuery, maxResults);
    const limitedFullFallback = {
      ...fallbackResult,
      data: fallbackResult.data.slice(0, 25),
      count: Math.min(fallbackResult.data.length, 25),
      originalQuery: userQuery,
      enhancedQuery: userQuery,
      queryProcessingSuccess: false,
      postProcessingApplied: false,
      error: error instanceof Error ? error.message : "Full AI enhancement failed"
    };
    
    console.log(`🎯 FULL AI FALLBACK: Returning ${limitedFullFallback.count} papers`);
    return limitedFullFallback;
  }
}

/**
 * Batch search with multiple queries - useful for processing multiple research topics
 * @param queries Array of natural language queries
 * @param maxResultsPerQuery Maximum results per query
 * @param apiKey Optional Gemini API key
 * @returns Promise<EnhancedArxivSearchResult[]> Array of enhanced search results
 */
export async function batchSearchWithEnhancement(
  queries: string[],
  maxResultsPerQuery: number = 100,
  apiKey?: string
): Promise<EnhancedArxivSearchResult[]> {
  console.log(`🔄 Processing ${queries.length} queries in batch...`);
  
  const results = await Promise.allSettled(
    queries.map(query => searchWithQueryEnhancement(query, maxResultsPerQuery, apiKey))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`❌ Batch search failed for query ${index + 1}:`, result.reason);
      return {
        success: false,
        data: [],
        count: 0,
        query: queries[index],
        originalQuery: queries[index],
        enhancedQuery: queries[index],
        queryProcessingSuccess: false,
        error: result.reason instanceof Error ? result.reason.message : "Batch search failed"
      };
    }
  });
}
