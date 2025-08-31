import { NextRequest, NextResponse } from 'next/server';

const CHART_GENERATOR_FUNCTION_URL = 'https://7xj5vtwghbnjb3p6cupkx7jjc40nfznv.lambda-url.eu-west-2.on.aws/';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_intent, dataset_id, table_name } = body;

    if (!user_intent || !dataset_id || !table_name) {
      return NextResponse.json(
        { error: 'user_intent, dataset_id, and table_name are required' },
        { status: 400 }
      );
    }

    // Call the Lambda Function URL
    const response = await fetch(CHART_GENERATOR_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_intent,
        dataset_id,
        table_name
      })
    });

    if (!response.ok) {
      throw new Error(`Lambda function returned status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error calling chart generator:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate insights', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}