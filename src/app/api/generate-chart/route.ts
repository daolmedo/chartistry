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
    const { csv, prompt, apiKey } = body;

    if (!csv || !prompt || !apiKey) {
      return NextResponse.json({ 
        error: 'CSV data, prompt, and API key are required' 
      }, { status: 400 });
    }

    // Call the Lambda function via API Gateway using aws-amplify
    const response = await post({
      apiName: myAPI,
      path: chartGeneratorPath,
      options: {
        body: { csv, prompt, apiKey }
      }
    }).response;

    const data = await response.body.json();
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