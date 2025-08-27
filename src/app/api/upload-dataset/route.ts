import { NextRequest, NextResponse } from 'next/server';

async function verifyAuthToken(authToken: string): Promise<string | null> {
  try {
    // For development, we'll do a simplified check
    // In production, you'd want to use Firebase Admin SDK to verify the token
    if (!authToken || authToken === 'undefined') {
      return null;
    }
    
    // Simplified validation - in production you'd verify with Firebase Admin
    // const decodedToken = await adminAuth.verifyIdToken(authToken);
    // return decodedToken.uid;
    
    // For now, we'll extract the userId from the request body and validate it exists
    return authToken; // This should be the actual verification logic
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    const body = await request.json();
    const { userId, fileName, fileType } = body;

    if (!userId || !fileName) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId and fileName' },
        { status: 400 }
      );
    }

    // Basic auth check (in production, use proper token verification)
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the API Gateway URL from your amplifyconfiguration.json
    const apiUrl = process.env.AMPLIFY_API_URL || 'https://4tbgy1hj3m.execute-api.eu-west-2.amazonaws.com/dev';
    
    const response = await fetch(`${apiUrl}/datasets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        fileName,
        fileType: fileType || 'text/csv'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lambda error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      uploadUrl: data.uploadUrl,
      fields: data.fields,
      fileId: data.fileId,
      s3Key: data.s3Key,
      expiresIn: data.expiresIn
    });

  } catch (error) {
    console.error('Upload dataset API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}