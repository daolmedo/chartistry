import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import awsExports from '../../../../aws-exports';

Amplify.configure(awsExports, { ssr: true });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');
    const tableName = searchParams.get('tableName');

    if (!datasetId || !tableName) {
      return NextResponse.json(
        { error: 'datasetId and tableName are required' },
        { status: 400 }
      );
    }

    // Create the API client
    const client = generateClient();

    // Call the datasets Lambda function to get the actual data
    const response = await client.post({
      apiName: 'chartistryapi',
      path: '/datasets',
      options: {
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          action: 'getData',
          datasetId,
          tableName,
          limit: 1000 // Limit to first 1000 rows for performance
        }
      }
    });

    return NextResponse.json(response.response);
  } catch (error) {
    console.error('Error fetching dataset data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset data', details: error instanceof Error ? error.message : 'Unknown error' },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}