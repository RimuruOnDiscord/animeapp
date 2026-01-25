import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const genres = searchParams.get('genres') || '';
  const status = searchParams.get('status') || '';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '24';

  const params = new URLSearchParams({
    q,
    genres,
    status,
    page,
    limit,
  });

  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?${params}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch anime' }, { status: 500 });
  }
}