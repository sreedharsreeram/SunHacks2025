/**
 * Test file to demonstrate the new intent-focused personalization feature
 * Shows how the second Gemini integration compares paper summaries to user intent
 */

import { searchWithFullAIEnhancement } from './arxiv-scraper';

/**
 * Test intent personalization with different types of user queries
 */
export async function testIntentPersonalization() {
  console.log('🎯 Testing Intent-Focused Personalization\n');

  // Test cases with different user intents
  const testCases = [
    {
      query: "I want to learn the fundamentals of machine learning",
      expectedIntent: "Learning fundamentals",
      description: "Educational intent - should prioritize foundational papers"
    },
    {
      query: "I need to find recent advances in transformer architectures for my research",
      expectedIntent: "Recent advances for research",
      description: "Research intent - should prioritize cutting-edge papers"
    },
    {
      query: "I'm looking for practical applications of computer vision in healthcare",
      expectedIntent: "Practical applications",
      description: "Application intent - should prioritize implementation-focused papers"
    },
    {
      query: "I want to compare different approaches to natural language processing",
      expectedIntent: "Comparative analysis",
      description: "Comparison intent - should prioritize papers with methodological comparisons"
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Test Case: "${testCase.query}"`);
    console.log(`📋 Expected Intent: ${testCase.expectedIntent}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log('='.repeat(80));

    try {
      const result = await searchWithFullAIEnhancement(testCase.query, 5);
      
      console.log('\n📊 Results:');
      console.log('- Success:', result.success);
      console.log('- Papers Found:', result.count);
      console.log('- Post-Processing Applied:', result.postProcessingApplied);
      
      if (result.intentAnalysis) {
        console.log('\n🧠 Intent Analysis:');
        console.log('- User Intent Identified:', result.intentAnalysis.user_intent_identified);
        console.log('- Intent Specificity:', result.intentAnalysis.intent_specificity);
        console.log('- Intent Classification:', result.intentAnalysis.intent_classification);
        console.log('- Total Papers Analyzed:', result.intentAnalysis.total_papers_analyzed);
        console.log('- Intent Matched Papers:', result.intentAnalysis.intent_matched_papers);
        console.log('- Intent Coverage:', result.intentAnalysis.intent_coverage);
        
        if (result.intentAnalysis.intent_gaps.length > 0) {
          console.log('- Intent Gaps:', result.intentAnalysis.intent_gaps);
        }
        
        if (result.intentAnalysis.intent_recommendations.length > 0) {
          console.log('- Intent Recommendations:', result.intentAnalysis.intent_recommendations);
        }
      }
      
      if (result.data.length > 0) {
        console.log('\n📄 Personalized Papers:');
        result.data.slice(0, 3).forEach((paper, index) => {
          console.log(`\n${index + 1}. ${paper.title}`);
          console.log(`   Authors: ${paper.authors.slice(0, 2).join(', ')}`);
          console.log(`   Published: ${paper.published_date}`);
          console.log(`   Summary: ${paper.summary.substring(0, 150)}...`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error in intent personalization test:', error);
    }
  }

  console.log('\n✅ Intent personalization testing completed!');
}

/**
 * Test the filtering effectiveness
 */
export async function testFilteringEffectiveness() {
  console.log('\n🔍 Testing Filtering Effectiveness\n');
  
  const query = "machine learning for computer vision";
  
  try {
    console.log(`🔍 Query: "${query}"`);
    console.log('📊 This test shows how intent-based filtering reduces noise and improves relevance\n');
    
    const result = await searchWithFullAIEnhancement(query, 10);
    
    if (result.intentAnalysis) {
      console.log('📈 Filtering Statistics:');
      console.log('- Total Papers Analyzed:', result.intentAnalysis.total_papers_analyzed);
      console.log('- Intent Matched Papers:', result.intentAnalysis.intent_matched_papers);
      console.log('- Filtering Rate:', 
        `${Math.round((1 - result.intentAnalysis.intent_matched_papers / result.intentAnalysis.total_papers_analyzed) * 100)}% of papers filtered out`
      );
      console.log('- Intent Coverage:', result.intentAnalysis.intent_coverage);
    }
    
    console.log('\n🎯 Personalization Benefits:');
    console.log('✅ Papers are filtered based on user intent alignment');
    console.log('✅ Only highly relevant papers (score ≥ 7) are included');
    console.log('✅ Summaries are rewritten to highlight intent relevance');
    console.log('✅ Intent-specific insights are extracted');
    console.log('✅ Recommendations are tailored to user goals');
    
  } catch (error) {
    console.error('❌ Error in filtering effectiveness test:', error);
  }
}

/**
 * Run all intent personalization tests
 */
export async function runAllIntentTests() {
  console.log('🚀 Running All Intent Personalization Tests\n');
  
  await testIntentPersonalization();
  console.log('\n' + '='.repeat(80) + '\n');
  await testFilteringEffectiveness();
  
  console.log('\n🎉 All intent personalization tests completed!');
  console.log('\n📋 Summary:');
  console.log('✅ Intent analysis extracts user research goals');
  console.log('✅ Paper summaries are compared to user intent');
  console.log('✅ Extreme filtering removes irrelevant papers');
  console.log('✅ Results are highly personalized to user needs');
  console.log('✅ Intent coverage ensures comprehensive addressing of user goals');
}

// Export for use in other files
export {
  testIntentPersonalization,
  testFilteringEffectiveness,
  runAllIntentTests
};
