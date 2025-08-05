import { NextRequest, NextResponse } from 'next/server';
import { searchFile } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('searchTerm') || searchParams.get('refFile'); // Support both old and new param names
    const searchType = searchParams.get('searchType') || 'auto';

    if (!searchTerm) {
      return NextResponse.json(
        { success: false, message: 'Search term is required' },
        { status: 400 }
      );
    }

    const result = await searchFile(searchTerm, searchType);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}