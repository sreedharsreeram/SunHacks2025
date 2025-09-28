import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const paperId = searchParams.get('paperId');
        
        if (!paperId) {
            return NextResponse.json({
                success: false,
                error: 'Paper ID is required',
                hasHtml: false,
                htmlUrl: null
            }, { status: 400 });
        }

        // Check if HTML version exists for this paper
        const htmlUrl = `https://arxiv.org/html/${paperId}`;
        
        try {
            // First, check if the HTML version exists by trying to fetch the page
            const response = await axios.get(htmlUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
                timeout: 10000,
                validateStatus: (status) => status < 500, // Don't throw for 4xx errors
            });

            if (response.status === 200) {
                // HTML version exists, return the content
                return NextResponse.json({
                    success: true,
                    hasHtml: true,
                    htmlUrl: htmlUrl,
                    htmlContent: response.data,
                    paperId: paperId
                });
            } else {
                // HTML version doesn't exist
                return NextResponse.json({
                    success: true,
                    hasHtml: false,
                    htmlUrl: null,
                    paperId: paperId,
                    message: 'HTML version not available for this paper'
                });
            }
        } catch (error) {
            // If fetching fails, HTML version likely doesn't exist
            return NextResponse.json({
                success: true,
                hasHtml: false,
                htmlUrl: null,
                paperId: paperId,
                message: 'HTML version not available for this paper'
            });
        }

    } catch (error) {
        console.error('ArXiv HTML proxy error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch HTML version',
            hasHtml: false,
            htmlUrl: null
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paperId } = body;
        
        if (!paperId) {
            return NextResponse.json({
                success: false,
                error: 'Paper ID is required',
                hasHtml: false,
                htmlUrl: null
            }, { status: 400 });
        }

        // Check if HTML version exists for this paper
        const htmlUrl = `https://arxiv.org/html/${paperId}`;
        
        try {
            const response = await axios.get(htmlUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
                timeout: 10000,
                validateStatus: (status) => status < 500,
            });

            if (response.status === 200) {
                return NextResponse.json({
                    success: true,
                    hasHtml: true,
                    htmlUrl: htmlUrl,
                    htmlContent: response.data,
                    paperId: paperId
                });
            } else {
                return NextResponse.json({
                    success: true,
                    hasHtml: false,
                    htmlUrl: null,
                    paperId: paperId,
                    message: 'HTML version not available for this paper'
                });
            }
        } catch (error) {
            return NextResponse.json({
                success: true,
                hasHtml: false,
                htmlUrl: null,
                paperId: paperId,
                message: 'HTML version not available for this paper'
            });
        }

    } catch (error) {
        console.error('ArXiv HTML proxy POST error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch HTML version',
            hasHtml: false,
            htmlUrl: null
        }, { status: 500 });
    }
}
