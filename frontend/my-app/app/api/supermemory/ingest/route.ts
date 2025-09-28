import { NextRequest, NextResponse } from 'next/server'
import { Supermemory } from 'supermemory'

const client = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY!
})

interface IngestRequest {
  pdfUrl: string
  paperId: string
  title: string
  authors: string[]
}

export class DocumentProcessor {
  async uploadURL({ url, collection, metadata = {} }: { url: string, collection: string, metadata?: Record<string, any> }) {
    try {
      const result = await client.memories.add({
        content: url,
        containerTag: collection,
        metadata: {
          type: 'url',
          originalUrl: url,
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      })

      return result
    } catch (error) {
      console.error('URL upload error:', error)
      throw error
    }
  }

  async getDocumentStatus(documentId: string) {
    try {
      const memory = await client.memories.get(documentId)
      return {
        id: memory.id,
        status: memory.status,
        title: memory.title,
        progress: memory.metadata?.progress || 0
      }
    } catch (error) {
      console.error('Status check error:', error)
      throw error
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl, paperId, title, authors }: IngestRequest = await request.json()

    console.log('📤 Starting document ingestion:', {
      pdfUrl,
      paperId,
      title,
      authors
    })

    if (!process.env.SUPERMEMORY_API_KEY) {
      return NextResponse.json({ error: 'Supermemory API key not configured' }, { status: 500 })
    }

    const processor = new DocumentProcessor()

    const uploadData = {
      url: pdfUrl,
      collection: paperId,  // This becomes the containerTag
      metadata: {
        title,
        authors: authors.join(', '),
        paperId,
        source: 'arxiv',
        category: 'research-paper',
        arxivId: paperId,  // Explicit arxiv ID for searching
        documentType: 'research-paper',
        tags: ['arxiv-paper', 'research-paper', 'pdf', paperId]  // Include paperId as a tag too
      }
    }

    console.log('📤 Uploading with data:', uploadData)

    const result = await processor.uploadURL(uploadData)

    console.log('✅ Upload successful:', {
      documentId: result.id,
      status: result.status,
      title: result.title
    })

    return NextResponse.json({
      success: true,
      documentId: result.id,
      message: 'Document ingested successfully using uploadURL',
      data: result
    })

  } catch (error) {
    console.error('❌ Document ingestion error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}