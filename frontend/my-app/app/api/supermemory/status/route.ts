import { NextRequest, NextResponse } from 'next/server'
import { Supermemory } from 'supermemory'

const client = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY!
})

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const paperId = url.searchParams.get('paperId')

    if (!paperId) {
      return NextResponse.json({ error: 'paperId parameter required' }, { status: 400 })
    }

    console.log('🔍 Checking documents for paperId:', paperId)

    // List all documents in this collection
    const allDocs = await client.memories.list({
      containerTags: [paperId],
      limit: 50
    })

    console.log('📋 Found documents:', {
      total: allDocs.memories?.length || 0,
      documents: allDocs.memories?.map(doc => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        type: doc.metadata?.type,
        containerTag: doc.containerTag,
        metadata: doc.metadata,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }))
    })

    // Also try to search for any document to test searchability
    try {
      console.log('🧪 Testing document searchability...')
      const testSearch = await client.search.documents({
        q: paperId,
        limit: 5
      })

      console.log('🧪 Test search results:', {
        query: paperId,
        total: testSearch?.total || 0,
        resultsFound: testSearch?.results?.length || 0,
        results: testSearch?.results?.map(r => ({
          id: r.documentId,
          title: r.title,
          containerTag: r.containerTag,
          score: r.score
        })) || []
      })
    } catch (searchError) {
      console.error('🧪 Test search failed:', searchError)
    }

    // Include test search results in response
    let testSearchResults = null
    try {
      const testSearch = await client.search.documents({
        q: paperId,
        limit: 5
      })
      testSearchResults = {
        total: testSearch?.total || 0,
        resultsFound: testSearch?.results?.length || 0,
        results: testSearch?.results?.map(r => ({
          id: r.documentId,
          title: r.title,
          containerTag: r.containerTag,
          score: r.score
        })) || []
      }
    } catch (searchError) {
      testSearchResults = { error: searchError.message }
    }

    return NextResponse.json({
      paperId,
      totalDocuments: allDocs.memories?.length || 0,
      documents: allDocs.memories?.map(doc => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        type: doc.metadata?.type,
        containerTag: doc.containerTag,
        metadata: doc.metadata,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      })) || [],
      testSearch: testSearchResults
    })

  } catch (error) {
    console.error('❌ Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}