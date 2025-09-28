import { NextRequest, NextResponse } from 'next/server';
import { scrapeWithFallback } from '@/lib/arxiv-scraper';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const maxResults = parseInt(searchParams.get('max_results') || '10');

        if (!query) {
            return NextResponse.json({
                success: false,
                error: 'Query parameter "q" is required',
                data: [],
                count: 0,
                query: ''
            }, { status: 400 });
        }

        const result = await scrapeWithFallback(query, maxResults);

        return NextResponse.json(result);

    } catch (error) {
        console.error('ArXiv API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch papers from ArXiv',
            data: [],
            count: 0,
            query: ''
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, maxResults = 10 } = body;

        if (!query) {
            return NextResponse.json({
                success: false,
                error: 'Query is required',
                data: [],
                count: 0,
                query: ''
            }, { status: 400 });
        }

        const result = await scrapeWithFallback(query, maxResults);

        return NextResponse.json(result);

    } catch (error) {
        console.error('ArXiv API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch papers from ArXiv',
            data: [],
            count: 0,
            query: ''
        }, { status: 500 });
    }
}