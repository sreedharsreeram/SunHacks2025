import { NextRequest, NextResponse } from 'next/server';
import { scrapePapers } from '@/lib/arxiv-scraper';
import { documentProcessor } from '@/lib/supermemory-processor';
import { Supermemory } from 'supermemory';

const client = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY!
});

interface SearchResult {
    papers: any[];
    source: 'supermemory' | 'arxiv' | 'hybrid';
    fromCache: boolean;
    uploadedCount?: number;
    searchTime: number;
}

export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const maxResults = parseInt(searchParams.get('max_results') || '200');
        const forceArxiv = searchParams.get('force_arxiv') === 'true';

        if (!query) {
            return NextResponse.json({
                success: false,
                error: 'Query parameter "q" is required'
            }, { status: 400 });
        }

        console.log(`🔍 Contextual search for: "${query}"`);

        let result: SearchResult;

        if (forceArxiv) {
            // Force ArXiv search (for admin/testing)
            result = await performArxivSearch(query, maxResults, startTime);
        } else {
            // Try SuperMemory semantic search first
            result = await performHybridSearch(query, maxResults, startTime);
        }

        return NextResponse.json({
            success: true,
            data: result.papers,
            meta: {
                source: result.source,
                fromCache: result.fromCache,
                uploadedCount: result.uploadedCount,
                searchTime: result.searchTime,
                query: query,
                count: result.papers.length
            }
        });

    } catch (error) {
        console.error('Contextual search error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Search failed',
            data: [],
            meta: {
                source: 'error',
                searchTime: Date.now() - Date.now(),
                query: '',
                count: 0
            }
        }, { status: 500 });
    }
}

async function performHybridSearch(query: string, maxResults: number, startTime: number): Promise<SearchResult> {
    try {
        // Step 1: Try SuperMemory semantic search first
        console.log('📊 Searching SuperMemory knowledge base...');

        const searchResults = await client.search.documents({
            q: query,
            containerTags: ['arxiv-papers'],
            limit: maxResults,
            rerank: true,
            includeFullDocs: false,
            includeSummary: true,
            onlyMatchingChunks: false,
            documentThreshold: 0.6,
            chunkThreshold: 0.7
        });

        if (searchResults.results.length >= maxResults) {
            // Sufficient contextual results from SuperMemory
            console.log(`✅ Found ${searchResults.results.length} contextual results from SuperMemory`);
            return {
                papers: searchResults.results.slice(0, maxResults).map(formatSuperMemorySearchResult),
                source: 'supermemory',
                fromCache: true,
                searchTime: Date.now() - startTime
            };
        }

        // Step 2: Insufficient SuperMemory results - scrape ArXiv and ingest
        console.log(`📝 SuperMemory has ${searchResults.results.length} results, scraping ArXiv for more...`);
        const arxivResult = await scrapePapers(query, maxResults);

        if (!arxivResult.success || arxivResult.data.length === 0) {
            // Return what we have from SuperMemory
            return {
                papers: searchResults.results.map(formatSuperMemorySearchResult),
                source: 'supermemory',
                fromCache: true,
                searchTime: Date.now() - startTime
            };
        }

        // Step 3: Upload ArXiv papers to SuperMemory FIRST
        console.log(`📤 Uploading ${arxivResult.data.length} papers to SuperMemory for better search...`);
        const uploadResult = await documentProcessor.uploadMultipleArxivPapers(arxivResult.data, 'arxiv-papers');
        console.log(`✅ Uploaded ${uploadResult.successCount} papers successfully`);

        // Step 4: Wait a moment for indexing, then search again for contextual results
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for indexing

        console.log('🔍 Re-searching with newly uploaded papers for better contextual results...');
        const updatedSearchResults = await client.search.documents({
            q: query,
            containerTags: ['arxiv-papers'],
            limit: maxResults,
            rerank: true,
            includeFullDocs: false,
            includeSummary: true,
            onlyMatchingChunks: false,
            documentThreshold: 0.6,
            chunkThreshold: 0.7
        });

        // Step 5: Return the contextual search results
        return {
            papers: updatedSearchResults.results.slice(0, maxResults).map(formatSuperMemorySearchResult),
            source: searchResults.results.length > 0 ? 'hybrid' : 'supermemory',
            fromCache: false,
            uploadedCount: uploadResult.successCount,
            searchTime: Date.now() - startTime
        };

    } catch (error) {
        console.error('Hybrid search error:', error);
        // Fallback to ArXiv search
        return await performArxivSearch(query, maxResults, startTime);
    }
}

async function performArxivSearch(query: string, maxResults: number, startTime: number): Promise<SearchResult> {
    console.log('📚 Performing ArXiv search...');
    const arxivResult = await scrapePapers(query, maxResults);

    if (!arxivResult.success) {
        return {
            papers: [],
            source: 'arxiv',
            fromCache: false,
            searchTime: Date.now() - startTime
        };
    }

    // Upload papers to SuperMemory in background
    uploadPapersInBackground(arxivResult.data).catch(console.error);

    return {
        papers: arxivResult.data.map(formatArxivResult),
        source: 'arxiv',
        fromCache: false,
        uploadedCount: arxivResult.data.length,
        searchTime: Date.now() - startTime
    };
}

async function uploadPapersInBackground(papers: any[]): Promise<number> {
    try {
        const result = await documentProcessor.uploadMultipleArxivPapers(papers, 'arxiv-papers');
        return result.successCount;
    } catch (error) {
        console.error('Background upload error:', error);
        return 0;
    }
}

function formatSuperMemorySearchResult(result: any) {
    return {
        id: result.metadata?.arxivId || result.documentId,
        title: result.title,
        authors: result.metadata?.authors || [],
        summary: result.summary || result.metadata?.summary || '',
        published_date: result.metadata?.publishedDate || '',
        pdf_url: result.metadata?.originalUrl || '',
        venue: result.metadata?.venue || 'arXiv',
        year: result.metadata?.year || new Date(result.metadata?.publishedDate || Date.now()).getFullYear(),
        source: 'supermemory',
        relevanceScore: result.score,
        superMemoryId: result.documentId,
        chunks: result.chunks?.filter(chunk => chunk.isRelevant)?.length || 0
    };
}

function formatSuperMemoryResult(result: any) {
    return {
        id: result.arxivId || result.id,
        title: result.title,
        authors: result.authors || [],
        summary: result.content || '',
        published_date: result.metadata?.publishedDate || '',
        pdf_url: result.url || '',
        venue: 'arXiv',
        year: result.metadata?.year || new Date(result.metadata?.publishedDate || Date.now()).getFullYear(),
        source: 'supermemory',
        relevanceScore: result.relevanceScore,
        superMemoryId: result.id
    };
}

function formatArxivResult(paper: any) {
    return {
        ...paper,
        source: 'arxiv'
    };
}