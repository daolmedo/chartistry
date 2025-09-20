import { NextRequest, NextResponse } from 'next/server';

const CHART_GENERATOR_FUNCTION_URL = 'https://7xj5vtwghbnjb3p6cupkx7jjc40nfznv.lambda-url.eu-west-2.on.aws/';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_intent, dataset_id, table_name, user_id, stream } = body;

    if (!user_intent || !dataset_id || !table_name) {
      return NextResponse.json({ 
        error: 'user_intent, dataset_id, and table_name are required' 
      }, { status: 400 });
    }

    // Check if we're in local development mode
    const isLocal = process.env.LOCAL === 'true';
    
    // Check if streaming is requested
    const isStreaming = stream === true;

    if (isLocal) {
      // Call local Lambda function
      const lambdaPayload = {
        httpMethod: 'POST',
        queryStringParameters: isStreaming ? { stream: 'true' } : null,
        body: JSON.stringify({ user_intent, dataset_id, table_name, user_id })
      };

      const response = await fetch('http://localhost:9000/2015-03-31/functions/function/invocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lambdaPayload)
      });

      if (!response.ok) {
        throw new Error(`Local Lambda call failed: ${response.status} ${response.statusText}`);
      }

      if (isStreaming) {
        // For streaming, return the response as-is with proper headers
        const data = await response.text();
        return new NextResponse(data, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          }
        });
      } else {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } else {
      // Build Lambda URL with streaming parameter if needed
      const lambdaUrl = new URL(CHART_GENERATOR_FUNCTION_URL);
      if (isStreaming) {
        lambdaUrl.searchParams.set('stream', 'true');
      }

      // Call the Lambda Function URL directly
      const response = await fetch(lambdaUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_intent,
          dataset_id,
          table_name,
          user_id
        })
      });

      if (!response.ok) {
        throw new Error(`Lambda function returned status: ${response.status}`);
      }

      if (isStreaming) {
        // Stream the response back to the client
        return new NextResponse(response.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache', 
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          }
        });
      } else {
        const data = await response.json();
        return NextResponse.json(data);
      }
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