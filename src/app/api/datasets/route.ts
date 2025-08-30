import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import awsExports from "../../../amplifyconfiguration.json";
import { get, post } from 'aws-amplify/api';

const myAPI = "chartistryapi";
const path = '/datasets';

Amplify.configure(awsExports, {
  ssr: true // required when using Amplify with Next.js
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await post({
      apiName: myAPI,
      path: path,
      options: {
        body: body
      }
    }).response;

    const data = await response.body.json();
    
    return NextResponse.json(data, { 
      status: response.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Dataset API error:', error);
    return NextResponse.json(
      { error: 'Failed to process dataset request' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    const response = await get({
      apiName: myAPI,
      path: path,
      options: {
        queryParams: {
          userId: userId
        }
      }
    }).response;

    const data = await response.body.json();
    
    return NextResponse.json(data, { 
      status: response.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Dataset API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}