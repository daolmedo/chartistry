import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import { post } from 'aws-amplify/api';
import awsExports from '../../../amplifyconfiguration.json';

// Configure Amplify for SSR
Amplify.configure(awsExports, {
  ssr: true
});

const myAPI = "chartistryapi";
const chartGeneratorPath = '/charts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csv, prompt } = body;

    if (!csv || !prompt) {
      return NextResponse.json({ 
        error: 'CSV data and prompt are required' 
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
          body: JSON.stringify({ csv, prompt })
        })
      });

      if (!response.ok) {
        throw new Error(`Local Lambda call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // Call the Lambda function via API Gateway using aws-amplify
      const response = await post({
        apiName: myAPI,
        path: chartGeneratorPath,
        options: {
          body: { csv, prompt }
        }
      }).response;

      const data = await response.body.json();
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