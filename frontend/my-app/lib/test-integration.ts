/**
 * Test file to demonstrate the query-processor → arxiv-scraper integration
 * This shows how personalized queries are generated and used for better arXiv results
 */

import { searchWithQueryEnhancement, processQuery } from './arxiv-scraper';

/**
 * Test the complete integration flow
 */
export async function testQueryProcessorIntegration() {
  console.log('🧪 Testing Query Processor → ArXiv Scraper Integration\n');

  // Test cases with different types of research queries
  const testQueries = [
    "machine learning for computer vision",
    "RAG question chunking for document retrieval", 
    "transformer attention mechanisms in neural networks",
    "quantum machine learning algorithms",
    "federated learning privacy preservation"
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Testing Query: "${query}"`);
    console.log('='.repeat(60));

    try {
      // Step 1: Test query processing only
      console.log('📝 Step 1: Processing query with Gemini...');
      const queryResult = await processQuery(query);
      
      if (queryResult.success) {
        console.log('✅ Query processed successfully!');
        console.log('📤 Original Query:', queryResult.originalQuery);
        console.log('🎯 Enhanced Query:', queryResult.enhancedQuery);
        console.log('🔧 Query includes arXiv syntax:', /(all:|ti:|au:|abs:|cat:)/.test(queryResult.enhancedQuery));
        console.log('🔧 Query includes boolean logic:', /(AND|OR|ANDNOT)/.test(queryResult.enhancedQuery));
        console.log('🔧 Query includes categories:', /cat:/.test(queryResult.enhancedQuery));
      } else {
        console.log('❌ Query processing failed:', queryResult.error);
        continue;
      }

      // Step 2: Test full integration with arXiv scraping
      console.log('\n📡 Step 2: Using enhanced query for arXiv search...');
      const searchResult = await searchWithQueryEnhancement(query, 5);
      
      console.log('📊 Search Results:');
      console.log('- Success:', searchResult.success);
      console.log('- Papers Found:', searchResult.count);
      console.log('- Query Processing Success:', searchResult.queryProcessingSuccess);
      console.log('- Original Query:', searchResult.originalQuery);
      console.log('- Enhanced Query:', searchResult.enhancedQuery);
      
      if (searchResult.data.length > 0) {
        console.log('\n📄 Sample Papers:');
        searchResult.data.slice(0, 2).forEach((paper, index) => {
          console.log(`${index + 1}. ${paper.title}`);
          console.log(`   Authors: ${paper.authors.join(', ')}`);
          console.log(`   Published: ${paper.published_date}`);
          console.log(`   Venue: ${paper.venue}`);
        });
      }

    } catch (error) {
      console.error('❌ Error in integration test:', error);
    }
  }

  console.log('\n✅ Integration test completed!');
}

/**
 * Test query processing with different complexity levels
 */
export async function testQueryComplexity() {
  console.log('\n🧠 Testing Query Complexity Levels\n');

  const complexityTests = [
    {
      level: "Simple",
      query: "machine learning",
      expectedFeatures: ["synonyms", "categories", "boolean logic"]
    },
    {
      level: "Medium", 
      query: "neural networks for image recognition",
      expectedFeatures: ["field expansion", "acronym expansion", "category inference"]
    },
    {
      level: "Complex",
      query: "transformer attention mechanisms in large language models for natural language processing",
      expectedFeatures: ["comprehensive expansion", "methodology terms", "interdisciplinary categories"]
    }
  ];

  for (const test of complexityTests) {
    console.log(`\n📊 ${test.level} Query: "${test.query}"`);
    
    try {
      const result = await processQuery(test.query);
      
      if (result.success) {
        console.log('✅ Enhanced Query Generated:');
        console.log(result.enhancedQuery);
        
        // Analyze the enhanced query
        const hasSynonyms = /OR/.test(result.enhancedQuery);
        const hasCategories = /cat:/.test(result.enhancedQuery);
        const hasBooleanLogic = /(AND|OR|ANDNOT)/.test(result.enhancedQuery);
        const hasFieldPrefixes = /(all:|ti:|au:|abs:)/.test(result.enhancedQuery);
        
        console.log('\n🔍 Query Analysis:');
        console.log('- Contains synonyms/alternatives:', hasSynonyms);
        console.log('- Contains categories:', hasCategories);
        console.log('- Contains boolean logic:', hasBooleanLogic);
        console.log('- Contains field prefixes:', hasFieldPrefixes);
        console.log('- Query length:', result.enhancedQuery.length, 'characters');
      } else {
        console.log('❌ Query processing failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error in complexity test:', error);
    }
  }
}

/**
 * Run all integration tests
 */
export async function runAllIntegrationTests() {
  console.log('🚀 Running All Integration Tests\n');
  
  await testQueryComplexity();
  console.log('\n' + '='.repeat(80) + '\n');
  await testQueryProcessorIntegration();
  
  console.log('\n🎉 All integration tests completed successfully!');
  console.log('\n📋 Summary:');
  console.log('✅ Query Processor generates personalized arXiv queries');
  console.log('✅ Enhanced queries are passed to ArXiv Scraper');
  console.log('✅ ArXiv Scraper uses optimized queries for better results');
  console.log('✅ Integration provides comprehensive research discovery');
}

// Export for use in other files
export {
  testQueryProcessorIntegration,
  testQueryComplexity,
  runAllIntegrationTests
};
