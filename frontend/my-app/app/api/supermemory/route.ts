import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/lib/supermemory-processor';
import { ArxivPaper } from '@/lib/arxiv-scraper';

// Upload ArXiv paper to SuperMemory
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, paper, collection = 'arxiv-papers', metadata = {} } = body;

        if (!action) {
            return NextResponse.json({
                success: false,
                error: 'Action is required'
            }, { status: 400 });
        }

        switch (action) {
            case 'upload-arxiv-paper':
                if (!paper) {
                    return NextResponse.json({
                        success: false,
                        error: 'Paper data is required'
                    }, { status: 400 });
                }

                const result = await documentProcessor.uploadArxivPaper({
                    paper: paper as ArxivPaper,
                    collection,
                    metadata: {
                        uploadedBy: 'citesight-app',
                        source: 'arxiv',
                        ...metadata
                    }
                });

                return NextResponse.json({
                    success: true,
                    data: result
                });

            case 'upload-url':
                const { url } = body;
                if (!url) {
                    return NextResponse.json({
                        success: false,
                        error: 'URL is required'
                    }, { status: 400 });
                }

                const urlResult = await documentProcessor.uploadURL({
                    url,
                    collection,
                    metadata: {
                        uploadedBy: 'citesight-app',
                        ...metadata
                    }
                });

                return NextResponse.json({
                    success: true,
                    data: urlResult
                });

            case 'search':
                const { query, searchCollection } = body;
                if (!query) {
                    return NextResponse.json({
                        success: false,
                        error: 'Query is required'
                    }, { status: 400 });
                }

                const searchResults = await documentProcessor.searchDocuments(query, searchCollection);
                return NextResponse.json({
                    success: true,
                    data: searchResults
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: `Unknown action: ${action}`
                }, { status: 400 });
        }

    } catch (error) {
        console.error('SuperMemory API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}

// Get document status or list documents
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const documentId = searchParams.get('id');
        const collection = searchParams.get('collection') || 'arxiv-papers';

        switch (action) {
            case 'status':
                if (!documentId) {
                    return NextResponse.json({
                        success: false,
                        error: 'Document ID is required'
                    }, { status: 400 });
                }

                const status = await documentProcessor.getDocumentStatus(documentId);
                return NextResponse.json({
                    success: true,
                    data: status
                });

            case 'list':
                const documents = await documentProcessor.listDocuments(collection);
                return NextResponse.json({
                    success: true,
                    data: documents
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Action parameter is required (status, list)'
                }, { status: 400 });
        }

    } catch (error) {
        console.error('SuperMemory GET API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}

// Delete document
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('id');

        if (!documentId) {
            return NextResponse.json({
                success: false,
                error: 'Document ID is required'
            }, { status: 400 });
        }

        await documentProcessor.deleteDocument(documentId);
        return NextResponse.json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        console.error('SuperMemory DELETE API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}