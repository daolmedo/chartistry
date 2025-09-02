import { NextRequest, NextResponse } from 'next/server';

const CHART_GENERATOR_FUNCTION_URL = 'https://7xj5vtwghbnjb3p6cupkx7jjc40nfznv.lambda-url.eu-west-2.on.aws/';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_intent, dataset_id, table_name } = body;

    if (!user_intent || !dataset_id || !table_name) {
      return NextResponse.json({ 
        error: 'user_intent, dataset_id, and table_name are required' 
      }, { status: 400 });
    }

    // Check if we're in local development mode
    const isLocal = process.env.LOCAL === 'true';

    if (isLocal) {
      // Call local Lambda function
      const response = await fetch('http://localhost:9000/2015-03-31/functions/function/invocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          httpMethod: 'POST',
          body: JSON.stringify({ user_intent, dataset_id, table_name })
        })
      });

      if (!response.ok) {
        throw new Error(`Local Lambda call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // Call the Lambda Function URL directly (bypasses API Gateway timeout)
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
    }

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