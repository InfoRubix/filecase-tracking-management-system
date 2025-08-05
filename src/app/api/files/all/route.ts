import { NextRequest, NextResponse } from 'next/server';
import { getAllFiles } from '@/lib/api';

export async function GET(request: NextRequest) {
  console.log('API /files/all: Request received');
  try {
    const isAuthenticated = request.cookies.get('admin-authenticated')?.value;

    if (isAuthenticated !== 'true') {
      console.log('API /files/all: Authentication failed');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('API /files/all: Authentication passed, calling getAllFiles()...');
    const result = await getAllFiles();
    console.log('API /files/all: getAllFiles() completed:', { success: result.success, dataLength: result.data?.length });
    return NextResponse.json(result);
  } catch (error) {
    console.error('API /files/all: Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}