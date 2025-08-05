import { NextRequest, NextResponse } from 'next/server';
import { updateFile } from '@/lib/api';

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
    console.log('Update API received data:', fileData);

    if (!fileData.id) {
      console.log('Missing ID in request data');
      return NextResponse.json(
        { success: false, message: 'File ID is required' },
        { status: 400 }
      );
    }

    console.log('Updating file with data:', { ...fileData, updateBy: email });
    
    const result = await updateFile({
      ...fileData,
      updateBy: email
    });

    console.log('API result before sending:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API catch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}