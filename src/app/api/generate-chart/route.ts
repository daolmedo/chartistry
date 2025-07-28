import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Call the Lambda function via API Gateway
    // This URL should be updated with your actual API Gateway endpoint
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://your-api-gateway-url.amazonaws.com/dev/chartgenerator';
    
    const response = await fetch(apiGatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`API Gateway error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in generate-chart API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate chart',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}