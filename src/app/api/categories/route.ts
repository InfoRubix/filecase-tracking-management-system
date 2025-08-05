import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = request.cookies.get('admin-authenticated')?.value;

    if (isAuthenticated !== 'true') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await getCategories();
    return NextResponse.json(result);
  } catch (error) {
    console.error('API /categories GET: Error:', error);
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

    const { category } = await request.json();

    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category is required' },
        { status: 400 }
      );
    }

    const result = await createCategory(category.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error('API /categories POST: Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}