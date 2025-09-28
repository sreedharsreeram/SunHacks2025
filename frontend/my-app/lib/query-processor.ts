import { GoogleGenerativeAI } from '@google/generative-ai';

export interface QueryProcessorResult {
  success: boolean;
  enhancedQuery: string;
  originalQuery: string;
  error?: string;
}

export interface QueryProcessorConfig {
  apiKey: string;
  model?: string;
}

/**
 * Query processor that enhances natural language queries for arXiv search
 * Converts user's natural language research requests into optimized arXiv search queries
 */
export class QueryProcessor {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(config: QueryProcessorConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-2.0-flash-exp';
  }

  /**
   * Processes a user's natural language query and converts it to an optimized arXiv search query
   * @param userMessage The user's natural language research request
   * @returns Promise<QueryProcessorResult> Enhanced query string or error
   */
  async processQuery(userMessage: string): Promise<QueryProcessorResult> {
    try {
      const message = userMessage.toLowerCase().trim();
      
      if (!message) {
        return {
          success: false,
          enhancedQuery: '',
          originalQuery: userMessage,
          error: 'Empty query provided'
        };
      }

      const systemInstruction = `You are a world-class Research Strategist AI, an expert information scientist with a deep understanding of the academic landscape and the nuances of scholarly search. Your core mandate is to translate a researcher's nascent idea or question into a surgically precise and maximally effective arXiv query. You don't just add keywords; you model the user's research intent.

## Guiding Principles

1.  **Intent Deconstruction:** Your first priority is to infer the user's goal. Are they surveying a broad field? Investigating a specific new method? Looking for applications of a known technique? The structure of your query must reflect this intent.
2.  **Hierarchical Term Expansion:** You will generate a multi-layered keyword strategy.
    * **Primary Terms:** The user's exact terms, their most common acronyms, and direct synonyms. These form the query's core.
    * **Secondary Terms:** Broader parent concepts, related methodologies, and foundational techniques that a relevant paper would likely mention.
    * **Tertiary/Niche Terms:** Highly specific, cutting-edge, or alternative terminologies to capture emerging research.
3.  **Interdisciplinary Field Mapping:** You will not just list categories. You will map the query to a primary research area and strategically include relevant secondary or cross-disciplinary fields. For example, a query on "AI for drug discovery" must bridge Computer Science (\`cs.AI\`, \`cs.LG\`) with Quantitative Biology (\`q-bio.QM\`, \`q-bio.BM\`).
4.  **Dynamic Query Structuring:** The boolean structure is not fixed. A survey query might use more \`OR\`s at the top level, while a query for a specific application will be a series of \`AND\` clauses linking method to domain.

## Step-by-Step Internal Cognitive Process (Your mental model before generating the query)

1.  **Analyze & Infer Intent:** Deconstruct the user's input into its core components: [Subject], [Technique/Method], [Application/Domain], [Qualifier (e.g., "latest," "explainable")]. Form a hypothesis about the user's primary goal.
2.  **Brainstorm & Prioritize Terms:** Generate a hierarchical list of keywords (Primary, Secondary, Tertiary) for each component identified in Step 1.
3.  **Map to Fields & Categories:** Select the most probable primary arXiv category. Then, add secondary categories that represent the interdisciplinary nature of the research.
4.  **Construct & Refine Query:** Assemble the prioritized terms using advanced boolean logic. Start with the most restrictive \`AND\` clauses to define the search space, then use \`OR\` clauses within parentheses to broaden the net for each core concept. Ensure the final query is both comprehensive (high recall) and precise (high precision).

## Critical Output Constraints

1.  **FINAL OUTPUT IS THE QUERY STRING ONLY.** Your internal reasoning process is for your guidance alone and must not appear in the response. No explanations, no greetings, no apologies, no additional text.
2.  **Strict arXiv Syntax:** Use \`ti:\`, \`au:\`, \`abs:\`, and \`cat:\` prefixes where appropriate. Default to \`all:\` if the field is not specified.
3.  **Correct Boolean Operators:** \`AND\`, \`OR\`, \`ANDNOT\` must be uppercase.
4.  **Sophisticated Grouping:** Use parentheses \`()\` extensively to enforce logical precedence.
5.  **Exact Phrases:** Enclose all multi-word phrases in double quotes \`" "\`.

## Enhanced Examples Demonstrating Deeper Intent

**User Input:** "latest on RAG for long-context documents"
*(Internal Thought: User wants cutting-edge RAG methods specifically for a known challenge: long context. I need terms for "latest," "RAG," and "long context.")*
**Your Output:** \`(ti:"state-of-the-art" OR ti:"recent" OR ti:"advances") AND (all:"retrieval augmented generation" OR all:"RAG") AND (all:"long-context" OR all:"long context" OR all:"extended context" OR all:"document analysis") AND (cat:cs.CL OR cat:cs.AI OR cat:cs.IR)\`

**User Input:** "explainable AI for vision transformers"
*(Internal Thought: This is an intersection of three fields: XAI, Transformers, and Computer Vision. The query must link them all.)*
**Your Output:** \`(all:"explainable AI" OR all:"XAI" OR all:"interpretable AI" OR all:"interpretability" OR all:"attribution methods") AND (all:"vision transformer" OR all:"ViT" OR all:"transformers for vision") AND (cat:cs.CV OR cat:cs.LG OR cat:cs.AI)\`

**User Input:** "using GNNs for discovering new drugs"
*(Internal Thought: A classic application query. I need to connect the method (GNNs) with the application domain (drug discovery) and include relevant categories from both CS and biology.)*
**Your Output:** \`(all:"graph neural network" OR all:"GNN" OR all:"graph representation learning") AND (all:"drug discovery" OR all:"drug design" OR all:"de novo design" OR all:"molecular property prediction") AND (cat:cs.LG OR cat:q-bio.BM OR cat:q-bio.QM OR cat:cs.AI)\`

**User Input:** "what is the math behind diffusion models"
*(Internal Thought: User wants foundational, theoretical papers. I should target terms related to the underlying mathematics and theory, not just applications.)*
**Your Output:** \`( (ti:"theory" OR ti:"mathematical foundations" OR ti:"analysis") AND (all:"diffusion models" OR all:"denoising diffusion" OR all:"score-based models") ) OR ( all:("stochastic differential equation" OR "SDE") AND all:("diffusion model" OR "denoising diffusion") ) AND (cat:cs.LG OR cat:stat.ML OR cat:math.PR)\`
`;

      const model = this.genAI.getGenerativeModel({ 
        model: this.model,
        systemInstruction: systemInstruction
      });

      const result = await model.generateContent(message);
      const response = await result.response;
      let enhancedQuery = response.text().trim();

      // Validate and clean the enhanced query
      enhancedQuery = this.validateAndCleanQuery(enhancedQuery);

      return {
        success: true,
        enhancedQuery,
        originalQuery: userMessage
      };

    } catch (error) {
      console.error('❌ Error processing query:', error);
      return {
        success: false,
        enhancedQuery: '',
        originalQuery: userMessage,
        error: error instanceof Error ? error.message : 'Unknown query processing error'
      };
    }
  }

  /**
   * Validates and cleans the enhanced query to ensure proper arXiv syntax
   * @param query The raw enhanced query from Gemini
   * @returns Cleaned and validated query string
   */
  private validateAndCleanQuery(query: string): string {
    if (!query || query.trim().length === 0) {
      return '';
    }

    // Remove any non-query text that might have been included
    let cleanedQuery = query.trim();
    
    // Remove common prefixes that might indicate explanation
    const prefixesToRemove = [
      'Here is the enhanced query:',
      'The enhanced query is:',
      'Enhanced query:',
      'Query:',
      'Here\'s the query:',
      'The query is:'
    ];
    
    for (const prefix of prefixesToRemove) {
      if (cleanedQuery.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleanedQuery = cleanedQuery.substring(prefix.length).trim();
      }
    }

    // Remove any trailing explanations or additional text
    const explanationMarkers = [
      'This query',
      'The query',
      'This enhanced',
      'The enhanced',
      'This will',
      'This should'
    ];
    
    for (const marker of explanationMarkers) {
      const markerIndex = cleanedQuery.toLowerCase().indexOf(marker.toLowerCase());
      if (markerIndex > 0) {
        cleanedQuery = cleanedQuery.substring(0, markerIndex).trim();
        break;
      }
    }

    // Ensure proper boolean operator formatting
    cleanedQuery = cleanedQuery
      .replace(/\band\b/gi, 'AND')
      .replace(/\bor\b/gi, 'OR')
      .replace(/\bandnot\b/gi, 'ANDNOT');

    // Ensure proper field prefix formatting
    cleanedQuery = cleanedQuery
      .replace(/\btitle:\b/gi, 'ti:')
      .replace(/\bauthor:\b/gi, 'au:')
      .replace(/\babstract:\b/gi, 'abs:')
      .replace(/\bcategory:\b/gi, 'cat:')
      .replace(/\ball:\b/gi, 'all:');

    // Validate that the query contains at least one search term
    const hasSearchTerms = /(all:|ti:|au:|abs:|cat:)/.test(cleanedQuery);
    if (!hasSearchTerms) {
      // If no field prefixes found, wrap the entire query in all:
      cleanedQuery = `all:${cleanedQuery}`;
    }

    return cleanedQuery;
  }

  /**
   * Creates a new QueryProcessor instance with environment variables
   * @param apiKey Optional API key, defaults to process.env.GEMINI_API_KEY
   * @returns QueryProcessor instance
   */
  static create(apiKey?: string): QueryProcessor {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    return new QueryProcessor({ apiKey: key });
  }
}

/**
 * Convenience function to process a query using the default configuration
 * @param userMessage The user's natural language research request
 * @param apiKey Optional API key, defaults to process.env.GEMINI_API_KEY
 * @returns Promise<QueryProcessorResult> Enhanced query string or error
 */
export async function processQuery(
  userMessage: string, 
  apiKey?: string
): Promise<QueryProcessorResult> {
  const processor = QueryProcessor.create(apiKey);
  return await processor.processQuery(userMessage);
}
