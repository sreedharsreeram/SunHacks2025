# Query Processor for arXiv Search

This module provides AI-powered query enhancement for arXiv searches, converting natural language research requests into optimized arXiv search queries.

## Features

- **Natural Language Processing**: Convert user queries like "I want papers on machine learning for computer vision" into optimized arXiv search syntax
- **Query Expansion**: Automatically expand acronyms, add synonyms, and infer broader context
- **Category Inference**: Automatically suggest relevant arXiv categories
- **Fallback Support**: Graceful degradation to basic search if AI processing fails
- **Batch Processing**: Handle multiple queries simultaneously

## Files

- `query-processor.ts` - Core query processing functionality
- `arxiv-scraper.ts` - Enhanced with query processing integration
- `example-usage.ts` - Usage examples and demonstrations

## Usage

### Basic Enhanced Search

```typescript
import { searchWithQueryEnhancement } from './lib/arxiv-scraper';

const result = await searchWithQueryEnhancement(
  "I want to find papers about machine learning for computer vision",
  20 // max results
);

console.log('Original Query:', result.originalQuery);
console.log('Enhanced Query:', result.enhancedQuery);
console.log('Papers Found:', result.count);
```

### Query Processing Only

```typescript
import { processQuery } from './lib/query-processor';

const result = await processQuery("RAG question chunking");
if (result.success) {
  console.log('Enhanced Query:', result.enhancedQuery);
}
```

### Batch Search

```typescript
import { batchSearchWithEnhancement } from './lib/arxiv-scraper';

const queries = [
  "Recent advances in transformer models",
  "Quantum computing applications"
];

const results = await batchSearchWithEnhancement(queries, 10);
```

## Environment Setup

Make sure to set your Gemini API key:

```bash
# In your .env file
GEMINI_API_KEY=your_api_key_here
```

## API Reference

### QueryProcessor Class

- `processQuery(userMessage: string): Promise<QueryProcessorResult>` - Process a natural language query
- `static create(apiKey?: string): QueryProcessor` - Create instance with API key

### Enhanced Search Functions

- `searchWithQueryEnhancement(userQuery, maxResults?, apiKey?)` - Enhanced search with AI processing
- `batchSearchWithEnhancement(queries, maxResultsPerQuery?, apiKey?)` - Batch processing
- `scrapeWithFallback(query, maxResults?)` - Basic search without AI processing

### Interfaces

- `QueryProcessorResult` - Result from query processing
- `EnhancedArxivSearchResult` - Enhanced search results with processing info
- `ArxivSearchResult` - Basic search results

## Examples

See `example-usage.ts` for comprehensive usage examples including:
- Basic enhanced search
- Batch processing
- Query processing only
- Fallback scenarios

## Migration from Python

This TypeScript implementation replaces the Python `filter.py` with:
- Better type safety
- Integrated error handling
- Seamless integration with existing arXiv scraper
- Enhanced functionality with batch processing
