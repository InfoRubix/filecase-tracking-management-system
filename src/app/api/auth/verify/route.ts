import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = request.cookies.get('admin-authenticated')?.value;
    const email = request.cookies.get('admin-email')?.value;

    if (isAuthenticated === 'true' && email) {
      return NextResponse.json({
        success: true,
        user: { email }
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}