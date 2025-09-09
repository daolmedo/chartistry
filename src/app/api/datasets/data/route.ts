import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import { post } from 'aws-amplify/api';
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

    // Call the datasets Lambda function to get the actual data
    const response = await post({
      apiName: 'chartistryapi',
      path: '/datasets',
      options: {
        body: {
          action: 'getData',
          datasetId,
          tableName,
          limit: 1000 // Limit to first 1000 rows for performance
        }
      }
    }).response;

    console.log("response");
    console.log(response);
    const data = await response.body.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dataset data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, datasetId, tableName, sql } = body;

    if (!datasetId || !tableName) {
      return NextResponse.json(
        { error: 'datasetId and tableName are required' },
        { status: 400 }
      );
    }

    if (action === 'executeSQL') {
      if (!sql) {
        return NextResponse.json(
          { error: 'sql is required for executeSQL action' },
          { status: 400 }
        );
      }

      // Call the datasets Lambda function to execute custom SQL
      const response = await post({
        apiName: 'chartistryapi',
        path: '/datasets',
        options: {
          body: {
            action: 'executeSQL',
            datasetId,
            tableName,
            sql,
            limit: 1000 // Safety limit
          }
        }
      }).response;

      const data = await response.body.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: executeSQL' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/datasets/data:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}