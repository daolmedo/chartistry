import json
import boto3
import uuid
import os
from botocore.exceptions import ClientError

# Initialize S3 client
s3_client = boto3.client('s3')

# Configuration
BUCKET_NAME = 'chartz-datasets'
EXPIRATION_TIME = 3600  # 1 hour

def handler(event, context):
    print('received event:')
    print(event)
    
    # CORS headers
    cors_headers = {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }
    
    # Handle preflight OPTIONS request
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': ''
        }
    
    try:
        # Parse request body
        body = json.loads(event['body']) if event['body'] else {}
        
        # Extract parameters
        user_id = body.get('userId')
        file_name = body.get('fileName')
        file_type = body.get('fileType', 'text/csv')
        
        if not user_id or not file_name:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({
                    'error': 'Missing required parameters: userId and fileName'
                })
            }
        
        # Validate file type
        if not file_type.startswith('text/csv') and not file_name.lower().endswith('.csv'):
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({
                    'error': 'Only CSV files are allowed'
                })
            }
        
        # Generate unique file key
        file_id = str(uuid.uuid4())
        # Store files with structure: user_id/file_id_original_name
        safe_file_name = file_name.replace(' ', '_').replace('/', '_')
        s3_key = f"{user_id}/{file_id}_{safe_file_name}"
        
        # Generate pre-signed URL for PUT operation
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': s3_key,
                'ContentType': file_type,
                'Metadata': {
                    'user-id': user_id,
                    'original-name': file_name,
                    'file-id': file_id
                }
            },
            ExpiresIn=EXPIRATION_TIME
        )
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'uploadUrl': presigned_url,
                'fileId': file_id,
                's3Key': s3_key,
                'expiresIn': EXPIRATION_TIME
            })
        }
        
    except ClientError as e:
        print(f"AWS error: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': 'Failed to generate upload URL',
                'details': str(e)
            })
        }
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }