import { GoogleGenerativeAI } from '@google/generative-ai';
import { ArxivPaper, ArxivSearchResult, EnhancedArxivSearchResult } from './arxiv-scraper';

export interface PostProcessorResult {
  success: boolean;
  enhancedResults: EnhancedArxivSearchResult;
  originalResults: ArxivSearchResult | EnhancedArxivSearchResult;
  error?: string;
}

export interface PostProcessorConfig {
  apiKey: string;
  model?: string;
}

/**
 * Post-processor that enhances arXiv search results using Gemini AI
 * Uses the same structure as QueryProcessor but processes scraped papers
 */
export class ResultPostProcessor {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(config: PostProcessorConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-2.0-flash-exp';
  }

  /**
   * Processes arXiv search results with AI enhancement
   * @param searchResults Original arXiv search results
   * @param userQuery Original user query for context
   * @returns Promise<PostProcessorResult> Enhanced results
   */
  async processResults(
    searchResults: ArxivSearchResult | EnhancedArxivSearchResult,
    userQuery: string
  ): Promise<PostProcessorResult> {
    try {
      if (!searchResults.success || searchResults.data.length === 0) {
        return {
          success: false,
          enhancedResults: searchResults as EnhancedArxivSearchResult,
          originalResults: searchResults,
          error: 'No results to process'
        };
      }

      console.log(`🧠 Post-processing ${searchResults.data.length} papers with Gemini...`);

      // Prepare the papers data for processing
      const papersData = this.preparePapersData(searchResults.data, userQuery);
      
      const systemInstruction = this.getSystemInstruction();

      const model = this.genAI.getGenerativeModel({ 
        model: this.model,
        systemInstruction: systemInstruction
      });

      const result = await model.generateContent(papersData);
      const response = await result.response;
      const enhancedContent = response.text().trim();

      // Parse the enhanced results
      const processedResults = await this.parseEnhancedResults(
        enhancedContent, 
        searchResults as EnhancedArxivSearchResult
      );

      return {
        success: true,
        enhancedResults: processedResults,
        originalResults: searchResults
      };

    } catch (error) {
      console.error('❌ Error in post-processing:', error);
      return {
        success: false,
        enhancedResults: searchResults as EnhancedArxivSearchResult,
        originalResults: searchResults,
        error: error instanceof Error ? error.message : 'Unknown post-processing error'
      };
    }
  }

  /**
   * Gets the system instruction for post-processing
   * This is where you can customize what Gemini does with the papers
   */
  private getSystemInstruction(): string {
    return `You are an expert research analyst specializing in ultra-personalized academic paper curation. Your primary mission is to perform INTENT MATCHING between each paper's content and the user's specific research intent, then apply extreme filtering for maximum personalization.

**CORE MISSION: INTENT-BASED PERSONALIZATION**

**STEP 1: INTENT ANALYSIS**
- **User Intent Extraction**: Deeply analyze the user's query to understand their true research intent, goals, and specific needs
- **Intent Classification**: Categorize the user's intent (e.g., "learning fundamentals", "finding applications", "comparing methods", "identifying gaps", "recent advances")
- **Intent Specificity**: Determine how specific or broad the user's research focus is

**STEP 2: PAPER-BY-PAPER INTENT MATCHING**
For each paper, perform detailed analysis:
- **Summary Analysis**: Extract key concepts, methodologies, and contributions from each paper's summary
- **Intent Alignment**: Compare the paper's content directly to the user's specific research intent
- **Relevance Scoring**: Score each paper (1-10) based on how well it matches the user's intent
- **Intent Gap Analysis**: Identify if the paper addresses the user's specific questions or needs

**STEP 3: EXTREME PERSONALIZATION FILTERING**
- **Intent Match Threshold**: Only include papers with relevance score ≥ 7 that directly address the user's intent
- **Intent-Specific Filtering**: Remove papers that don't align with the user's specific research goals
- **Personalization Ranking**: Rank papers by how well they serve the user's specific intent
- **Intent Coverage**: Ensure the filtered papers collectively address the user's research intent comprehensively
- **Quantity Goal**: Return EXACTLY 25 highly personalized papers after filtering (maintain strict quality standards)
- **Result Limiting**: If more than 25 papers meet the threshold, select the top 25 with highest intent relevance scores
- **Result Limiting**: If fewer than 25 papers meet the threshold, return all qualifying papers

**ENHANCEMENT FOCUS:**
- **Intent Alignment**: Emphasize how each paper directly serves the user's research intent
- **Intent-Specific Summaries**: Rewrite summaries to highlight relevance to user's specific intent
- **Intent-Based Insights**: Extract insights that directly relate to the user's research goals
- **Intent Recommendations**: Provide recommendations based on the user's specific intent

**OUTPUT FORMAT:**
Provide your analysis in the following JSON structure:
{
  "enhanced_papers": [
    {
      "id": "paper_id",
      "title": "enhanced_title",
      "summary": "intent-focused_summary",
      "authors": ["author1", "author2"],
      "published_date": "date",
      "pdf_url": "url",
      "venue": "venue",
      "year": year,
      "intent_relevance_score": number,
      "intent_alignment": "specific_how_paper_serves_user_intent",
      "intent_contribution": "what_this_paper_contributes_to_user_goals",
      "intent_insights": ["insight1_related_to_user_intent", "insight2_related_to_user_intent"],
      "intent_methodology": "methodology_relevant_to_user_intent",
      "intent_category": "category_related_to_user_intent",
      "intent_notes": "specific_notes_about_how_this_paper_serves_user_intent"
    }
  ],
  "intent_analysis": {
    "user_intent_identified": "detailed_analysis_of_user_research_intent",
    "intent_specificity": "how_specific_or_broad_user_intent_is",
    "intent_classification": "type_of_research_intent",
    "total_papers_analyzed": number,
    "intent_matched_papers": number,
    "intent_coverage": "how_well_filtered_papers_cover_user_intent",
    "intent_gaps": ["gaps_in_user_intent_coverage"],
    "intent_recommendations": ["specific_recommendations_for_user_intent"]
  }
}

**CRITICAL REQUIREMENTS:**
- **Intent Focus**: Every analysis must be centered on the user's specific research intent
- **Extreme Filtering**: Only include papers that directly serve the user's intent (relevance ≥ 7)
- **Intent Alignment**: Each paper must clearly align with and serve the user's research goals
- **Personalization**: Prioritize papers that best serve the user's specific research needs
- **Intent Coverage**: Ensure filtered papers comprehensively address the user's intent
- **EXACT LIMIT**: Return EXACTLY 25 papers (or fewer if not enough meet threshold)
- **Ranking**: Sort papers by intent relevance score (highest first) before limiting to 25

**IMPORTANT**: 
- Maintain all original paper data (id, authors, dates, URLs)
- Focus EVERYTHING on the user's specific research intent
- Ensure JSON is valid and complete
- Prioritize intent alignment over general relevance`;
  }

  /**
   * Prepares papers data for Gemini processing
   */
  private preparePapersData(papers: ArxivPaper[], userQuery: string): string {
    const papersData = papers.map(paper => ({
      id: paper.id,
      title: paper.title,
      summary: paper.summary,
      authors: paper.authors,
      published_date: paper.published_date,
      venue: paper.venue,
      year: paper.year
    }));

    return JSON.stringify({
      user_query_context: userQuery,
      papers: papersData,
      total_count: papers.length
    }, null, 2);
  }

  /**
   * Parses enhanced results from Gemini response
   */
  private async parseEnhancedResults(
    enhancedContent: string,
    originalResults: EnhancedArxivSearchResult
  ): Promise<EnhancedArxivSearchResult> {
    try {
      // Extract JSON from the response
      const jsonMatch = enhancedContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Convert enhanced papers back to ArxivPaper format and limit to 25
      const allEnhancedPapers: ArxivPaper[] = parsedData.enhanced_papers.map((paper: any) => ({
        id: paper.id,
        title: paper.title,
        summary: paper.summary,
        authors: paper.authors,
        published_date: paper.published_date,
        pdf_url: paper.pdf_url,
        venue: paper.venue,
        year: paper.year
      }));

      // Limit to exactly 25 papers (or fewer if not enough meet the threshold)
      // Sort by intent relevance score if available, then limit to 25
      const sortedPapers = allEnhancedPapers.sort((a: any, b: any) => {
        const scoreA = a.intent_relevance_score || 0;
        const scoreB = b.intent_relevance_score || 0;
        return scoreB - scoreA; // Sort by highest score first
      });
      
      const enhancedPapers = sortedPapers.slice(0, 25);

      // HARD LIMIT: Ensure exactly 25 results (or fewer if not enough)
      const finalPapers = enhancedPapers.slice(0, 25);
      
      console.log(`🎯 Post-processing: ${enhancedPapers.length} papers processed, returning ${finalPapers.length} papers`);

      return {
        ...originalResults,
        data: finalPapers,
        count: finalPapers.length,
        // Add post-processing metadata
        postProcessingApplied: true,
        intentAnalysis: parsedData.intent_analysis
      };

    } catch (error) {
      console.error('❌ Error parsing enhanced results:', error);
      // Return original results if parsing fails, but limit to 25
      const limitedOriginalResults = {
        ...originalResults,
        data: originalResults.data.slice(0, 25),
        count: Math.min(originalResults.data.length, 25),
        postProcessingApplied: false
      };
      return limitedOriginalResults;
    }
  }

  /**
   * Creates a new ResultPostProcessor instance with environment variables
   * @param apiKey Optional API key, defaults to process.env.GEMINI_API_KEY
   * @returns ResultPostProcessor instance
   */
  static create(apiKey?: string): ResultPostProcessor {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    return new ResultPostProcessor({ apiKey: key });
  }
}

/**
 * Convenience function to post-process results using default configuration
 * @param searchResults Original arXiv search results
 * @param userQuery Original user query for context
 * @param apiKey Optional API key
 * @returns Promise<PostProcessorResult> Enhanced results
 */
export async function postProcessResults(
  searchResults: ArxivSearchResult | EnhancedArxivSearchResult,
  userQuery: string,
  apiKey?: string
): Promise<PostProcessorResult> {
  const processor = ResultPostProcessor.create(apiKey);
  return await processor.processResults(searchResults, userQuery);
}