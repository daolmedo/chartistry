import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import { post } from 'aws-amplify/api';
import amplifyConfig from '@/amplifyconfiguration.json';

// Configure Amplify for SSR
Amplify.configure(amplifyConfig, { ssr: true });

const myAPI = "chartistryapi";
const datasetsPath = '/datasets';

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

    // Call the Lambda function via API Gateway using aws-amplify
    const response = await post({
      apiName: myAPI,
      path: datasetsPath,
      options: {
        body: {
          userId,
          fileName,
          fileType: fileType || 'text/csv'
        }
      }
    }).response;

    const data = await response.body.json() as {
      uploadUrl: string;
      fields: any;
      fileId: string;
      s3Key: string;
      expiresIn: number;
    };

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