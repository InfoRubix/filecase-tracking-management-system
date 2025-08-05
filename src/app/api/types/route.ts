import { NextRequest, NextResponse } from 'next/server';
import { getTypes, createType } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = request.cookies.get('admin-authenticated')?.value;

    if (isAuthenticated !== 'true') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await getTypes();
    return NextResponse.json(result);
  } catch (error) {
    console.error('API /types GET: Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = request.cookies.get('admin-authenticated')?.value;

    if (isAuthenticated !== 'true') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { type } = await request.json();

    if (!type || typeof type !== 'string' || !type.trim()) {
      return NextResponse.json(
        { success: false, message: 'Type is required' },
        { status: 400 }
      );
    }

    const result = await createType(type.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error('API /types POST: Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}