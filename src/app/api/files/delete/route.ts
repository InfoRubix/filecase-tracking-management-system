import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = request.cookies.get('admin-authenticated')?.value;
    const email = request.cookies.get('admin-email')?.value;

    if (isAuthenticated !== 'true' || !email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { refFile } = await request.json();

    if (!refFile) {
      return NextResponse.json(
        { success: false, message: 'Reference file number is required' },
        { status: 400 }
      );
    }

    const result = await deleteFile({
      refFile,
      deletedBy: email
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}