/**
 * Example usage of the enhanced arXiv search with query processing
 * This file demonstrates how to use the new TypeScript query processor
 */

import { 
  searchWithQueryEnhancement, 
  batchSearchWithEnhancement,
  scrapeWithFallback 
} from './arxiv-scraper';
import { processQuery } from './query-processor';

/**
 * Example 1: Basic enhanced search with improved query processing
 */
export async function exampleBasicSearch() {
  console.log('🔍 Example 1: Basic Enhanced Search');
  
  try {
    const result = await searchWithQueryEnhancement(
      "I want to find papers about machine learning for computer vision",
      10
    );
    
    console.log('Original Query:', result.originalQuery);
    console.log('Enhanced Query:', result.enhancedQuery);
    console.log('Query Processing Success:', result.queryProcessingSuccess);
    console.log('Papers Found:', result.count);
    console.log('Success:', result.success);
    
    if (result.data.length > 0) {
      console.log('First Paper:', {
        title: result.data[0].title,
        authors: result.data[0].authors,
        published_date: result.data[0].published_date
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error in basic search:', error);
    return null;
  }
}

/**
 * Example 1.5: Advanced query processing with complex research topics
 */
export async function exampleAdvancedSearch() {
  console.log('🧠 Example 1.5: Advanced Query Processing');
  
  const complexQueries = [
    "RAG question chunking for document retrieval",
    "transformer attention mechanisms in neural networks",
    "quantum machine learning algorithms for optimization",
    "federated learning privacy preservation techniques"
  ];
  
  try {
    for (const query of complexQueries) {
      console.log(`\n🔍 Processing: "${query}"`);
      const result = await searchWithQueryEnhancement(query, 5);
      
      console.log('Enhanced Query:', result.enhancedQuery);
      console.log('Papers Found:', result.count);
      console.log('Success:', result.success);
      
      if (result.data.length > 0) {
        console.log('Sample Paper:', result.data[0].title.substring(0, 80) + '...');
      }
    }
  } catch (error) {
    console.error('Error in advanced search:', error);
  }
}

/**
 * Example 2: Batch search with multiple queries
 */
export async function exampleBatchSearch() {
  console.log('🔄 Example 2: Batch Search');
  
  const queries = [
    "Recent advances in transformer models",
    "Quantum computing applications",
    "Natural language processing techniques"
  ];
  
  try {
    const results = await batchSearchWithEnhancement(queries, 5);
    
    results.forEach((result, index) => {
      console.log(`\nQuery ${index + 1}:`);
      console.log('Original:', result.originalQuery);
      console.log('Enhanced:', result.enhancedQuery);
      console.log('Papers Found:', result.count);
      console.log('Success:', result.success);
    });
    
    return results;
  } catch (error) {
    console.error('Error in batch search:', error);
    return [];
  }
}

/**
 * Example 3: Query processing only (without search)
 */
export async function exampleQueryProcessing() {
  console.log('🧠 Example 3: Query Processing Only');
  
  const testQueries = [
    "RAG question chunking",
    "I'm looking for papers on how to make images from text prompts",
    "Recent papers on using RLHF in LLMs",
    "Tell me about the BERT model"
  ];
  
  try {
    for (const query of testQueries) {
      console.log(`\nProcessing: "${query}"`);
      const result = await processQuery(query);
      
      if (result.success) {
        console.log('Enhanced Query:', result.enhancedQuery);
      } else {
        console.log('Error:', result.error);
      }
    }
  } catch (error) {
    console.error('Error in query processing:', error);
  }
}

/**
 * Example 4: Fallback to basic search
 */
export async function exampleFallbackSearch() {
  console.log('🔄 Example 4: Fallback Search');
  
  try {
    // This will use the original scraping without query enhancement
    const result = await scrapeWithFallback("machine learning", 5);
    
    console.log('Query:', result.query);
    console.log('Papers Found:', result.count);
    console.log('Success:', result.success);
    
    return result;
  } catch (error) {
    console.error('Error in fallback search:', error);
    return null;
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Running All Examples\n');
  
  await exampleQueryProcessing();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await exampleBasicSearch();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await exampleAdvancedSearch();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await exampleBatchSearch();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await exampleFallbackSearch();
  
  console.log('\n✅ All examples completed!');
}

// Export for use in other files
export {
  searchWithQueryEnhancement,
  batchSearchWithEnhancement,
  processQuery
};
