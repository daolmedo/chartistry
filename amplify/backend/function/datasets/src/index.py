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
        
        # Generate pre-signed POST for better CORS support with KMS
        presigned_post = s3_client.generate_presigned_post(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Fields={
                'Content-Type': file_type,
                'x-amz-server-side-encryption': 'aws:kms',
                'x-amz-server-side-encryption-aws-kms-key-id': 'arn:aws:kms:eu-west-2:252326958099:key/602a7058-adf6-48c5-80bf-39ea7956742f',
                'x-amz-meta-user-id': user_id,
                'x-amz-meta-original-name': file_name,
                'x-amz-meta-file-id': file_id
            },
            Conditions=[
                {'Content-Type': file_type},
                {'x-amz-server-side-encryption': 'aws:kms'},
                {'x-amz-server-side-encryption-aws-kms-key-id': 'arn:aws:kms:eu-west-2:252326958099:key/602a7058-adf6-48c5-80bf-39ea7956742f'},
                ['starts-with', '$x-amz-meta-user-id', user_id],
                ['starts-with', '$x-amz-meta-original-name', ''],
                ['starts-with', '$x-amz-meta-file-id', '']
            ],
            ExpiresIn=EXPIRATION_TIME
        )
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'uploadUrl': presigned_post['url'],
                'fields': presigned_post['fields'],
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