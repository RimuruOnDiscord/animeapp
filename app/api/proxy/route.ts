import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://rapid-cloud.co/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // If it's m3u8, modify URLs to point to our proxy
    if (contentType.includes('application/vnd.apple.mpegurl') || url.includes('.m3u8')) {
      let content = await response.text();

      // Replace relative URLs with proxy URLs
      content = content.replace(/^([^#].*)$/gm, (match) => {
        if (match.startsWith('http')) {
          return `/api/proxy?url=${encodeURIComponent(match)}`;
        } else {
          // Relative URL - construct full URL
          const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
          const fullUrl = baseUrl + match;
          return `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
        }
      });

      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // For video segments, return as-is
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}