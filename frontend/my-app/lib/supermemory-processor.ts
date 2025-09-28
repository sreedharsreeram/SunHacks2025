import { Supermemory } from 'supermemory'
import { ArxivPaper } from './arxiv-scraper'

const client = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY!
})

interface DocumentUpload {
  file: File
  collection: string
  metadata?: Record<string, any>
}

export interface PaperUpload {
  paper: ArxivPaper
  collection?: string
  metadata?: Record<string, any>
}

export class DocumentProcessor {
  async uploadDocument({ file, collection, metadata = {} }: DocumentUpload) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('containerTags', JSON.stringify([collection]))
      formData.append('metadata', JSON.stringify({
        originalName: file.name,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        ...metadata
      }))

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Document upload error:', error)
      throw error
    }
  }

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

  async uploadArxivPaper({ paper, collection = 'arxiv-papers', metadata = {} }: PaperUpload) {
    try {
      console.log(`📤 Uploading ArXiv paper: ${paper.title}`)

      // Use the uploadURL function to process the document
      const result = await this.uploadURL({
        url: paper.pdf_url,
        collection,
        metadata: {
          type: 'arxiv-paper',
          arxivId: paper.id,
          title: paper.title,
          authors: paper.authors,
          summary: paper.summary,
          publishedDate: paper.published_date,
          venue: paper.venue,
          year: paper.year,
          ...metadata
        }
      })

      console.log(`✅ Successfully uploaded paper to SuperMemory: ${result.id}`)
      return result
    } catch (error) {
      console.error('ArXiv paper upload error:', error)
      throw error
    }
  }

  async uploadMultipleArxivPapers(papers: ArxivPaper[], collection = 'arxiv-papers', metadata = {}) {
    const results = []
    const errors = []

    console.log(`📤 Uploading ${papers.length} ArXiv papers one by one...`)

    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i]
      try {
        console.log(`📄 Processing paper ${i + 1}/${papers.length}: ${paper.title}`)

        const result = await this.uploadArxivPaper({
          paper,
          collection,
          metadata: {
            batchIndex: i,
            batchTotal: papers.length,
            ...metadata
          }
        })

        results.push(result)

        // Add a small delay between uploads to avoid rate limiting
        if (i < papers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

      } catch (error) {
        console.error(`❌ Failed to upload paper ${i + 1}: ${paper.title}`, error)
        errors.push({
          paper,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`✅ Batch upload complete: ${results.length} successful, ${errors.length} failed`)

    return {
      successful: results,
      failed: errors,
      totalProcessed: papers.length,
      successCount: results.length,
      failureCount: errors.length
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

  async listDocuments(collection: string) {
    try {
      const memories = await client.memories.list({
        containerTags: [collection],
        limit: 50,
        sort: 'updatedAt',
        order: 'desc'
      })

      return memories.memories.map(memory => ({
        id: memory.id,
        title: memory.title || memory.metadata?.originalName || memory.metadata?.title || 'Untitled',
        type: memory.metadata?.fileType || memory.metadata?.type || 'unknown',
        uploadedAt: memory.metadata?.uploadedAt,
        status: memory.status,
        url: memory.metadata?.originalUrl,
        arxivId: memory.metadata?.arxivId,
        authors: memory.metadata?.authors,
        summary: memory.metadata?.summary
      }))
    } catch (error) {
      console.error('List documents error:', error)
      throw error
    }
  }

  async searchDocuments(query: string, collection?: string) {
    try {
      const searchParams: any = {
        query,
        limit: 20,
      }

      if (collection) {
        searchParams.containerTags = [collection]
      }

      const results = await client.memories.search(searchParams)

      return results.memories.map(memory => ({
        id: memory.id,
        title: memory.title || memory.metadata?.title || 'Untitled',
        content: memory.content,
        relevanceScore: memory.score,
        type: memory.metadata?.type || 'unknown',
        arxivId: memory.metadata?.arxivId,
        authors: memory.metadata?.authors,
        url: memory.metadata?.originalUrl
      }))
    } catch (error) {
      console.error('Document search error:', error)
      throw error
    }
  }

  async deleteDocument(documentId: string) {
    try {
      await client.memories.delete(documentId)
      console.log(`🗑️ Deleted document: ${documentId}`)
      return true
    } catch (error) {
      console.error('Delete document error:', error)
      throw error
    }
  }
}

// Export a singleton instance
export const documentProcessor = new DocumentProcessor()