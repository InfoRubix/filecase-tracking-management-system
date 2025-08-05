import { NextRequest, NextResponse } from 'next/server';
import { createFile } from '@/lib/api';

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

    const fileData = await request.json();

    if (!fileData.reffile || !fileData.clientname || !fileData.category || !fileData.kotak) {
      return NextResponse.json(
        { success: false, message: 'Required fields missing: reffile, clientname, category, kotak' },
        { status: 400 }
      );
    }

    console.log('Creating file with data:', { ...fileData, createdBy: email });
    
    const result = await createFile({
      ...fileData,
      createdBy: email
    });

    console.log('Create file result:', result);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}