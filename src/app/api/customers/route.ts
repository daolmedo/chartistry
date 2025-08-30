import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/amplifyconfiguration.json';

// Configure Amplify for SSR
Amplify.configure(amplifyConfig, { ssr: true });

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the API endpoint from Amplify configuration
    const apiUrl = amplifyConfig.aws_cloud_logic_custom?.[0]?.endpoint;
    
    if (!apiUrl) {
      throw new Error('API endpoint not configured');
    }

    // Forward request to customers Lambda
    const response = await fetch(`${apiUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Lambda error response:', errorData);
      
      return NextResponse.json(
        { error: 'Failed to process request', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Get the API endpoint from Amplify configuration
    const apiUrl = amplifyConfig.aws_cloud_logic_custom?.[0]?.endpoint;
    
    if (!apiUrl) {
      throw new Error('API endpoint not configured');
    }

    // Forward request to customers Lambda
    const response = await fetch(`${apiUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get',
        user_id: userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Lambda error response:', errorData);
      
      return NextResponse.json(
        { error: 'Failed to get user profile', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Ensure action is set to update
    body.action = 'update';
    
    // Get the API endpoint from Amplify configuration
    const apiUrl = amplifyConfig.aws_cloud_logic_custom?.[0]?.endpoint;
    
    if (!apiUrl) {
      throw new Error('API endpoint not configured');
    }

    // Forward request to customers Lambda
    const response = await fetch(`${apiUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Lambda error response:', errorData);
      
      return NextResponse.json(
        { error: 'Failed to update user profile', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}