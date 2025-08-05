import { NextRequest, NextResponse } from 'next/server';
import { getRackLookup } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = request.cookies.get('admin-authenticated')?.value;

    if (isAuthenticated !== 'true') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await getRackLookup();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}