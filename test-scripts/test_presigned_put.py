#!/usr/bin/env python3
"""
Test presigned PUT URL instead of POST to avoid CORS preflight issues
"""

import boto3
import json
import uuid
import requests
from botocore.exceptions import ClientError

# Configuration
BUCKET_NAME = 'chartz-datasets'
EXPIRATION_TIME = 3600
KMS_KEY_ID = 'arn:aws:kms:eu-west-2:252326958099:key/602a7058-adf6-48c5-80bf-39ea7956742f'

def generate_presigned_put(user_id, file_name, file_type='text/csv'):
    """
    Generate a presigned PUT URL for S3 upload with KMS encryption
    """
    try:
        s3_client = boto3.client('s3', region_name='eu-west-2')
        
        # Generate unique file key
        file_id = str(uuid.uuid4())
        safe_file_name = file_name.replace(' ', '_').replace('/', '_')
        s3_key = f"{user_id}/{file_id}_{safe_file_name}"
        
        print(f"Generating presigned PUT for: {s3_key}")
        
        # Generate pre-signed PUT URL with KMS encryption
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': s3_key,
                'ContentType': file_type,
                'ServerSideEncryption': 'aws:kms',
                'SSEKMSKeyId': KMS_KEY_ID,
                'Metadata': {
                    'user-id': user_id,
                    'original-name': file_name,
                    'file-id': file_id
                }
            },
            ExpiresIn=EXPIRATION_TIME
        )
        
        return {
            'success': True,
            'uploadUrl': presigned_url,
            'fileId': file_id,
            's3Key': s3_key,
            'contentType': file_type,
            'expiresIn': EXPIRATION_TIME
        }
        
    except ClientError as e:
        print(f"AWS error: {e}")
        return {
            'success': False,
            'error': f'Failed to generate upload URL: {e}'
        }
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {
            'success': False,
            'error': f'Internal error: {e}'
        }

def test_cors_preflight_put(upload_url):
    """
    Test CORS preflight for PUT request
    """
    print("Testing CORS preflight for PUT...")
    
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'PUT',
            'Access-Control-Request-Headers': 'content-type,x-amz-server-side-encryption,x-amz-server-side-encryption-aws-kms-key-id',
        }
        
        response = requests.options(upload_url, headers=headers)
        
        print(f"PUT Preflight status: {response.status_code}")
        print(f"PUT Preflight headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"Error response: {response.text}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"[ERROR] PUT Preflight error: {e}")
        return False

def test_upload_with_put(upload_url, content_type, file_path):
    """
    Test uploading a file using presigned PUT
    """
    try:
        print(f"Testing PUT upload to: {upload_url}")
        
        # Read file content
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        headers = {
            'Content-Type': content_type,
            'Origin': 'http://localhost:3000'
        }
        
        # Make the PUT request
        response = requests.put(upload_url, data=file_content, headers=headers)
        
        print(f"PUT Upload status: {response.status_code}")
        print(f"PUT Upload headers: {dict(response.headers)}")
        
        if response.status_code in [200, 204]:
            print("[SUCCESS] PUT Upload successful!")
            return True
        else:
            print(f"[ERROR] PUT Upload failed: {response.status_code}")
            print(f"Response text: {response.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] PUT Upload error: {e}")
        return False

def create_test_csv():
    """
    Create a simple test CSV file
    """
    test_file = 'test_put.csv'
    with open(test_file, 'w') as f:
        f.write("name,value,category\n")
        f.write("Product A,100,Electronics\n")
        f.write("Product B,150,Electronics\n")
        f.write("Product C,200,Home\n")
        f.write("Product D,75,Home\n")
    
    print(f"Created test CSV: {test_file}")
    return test_file

def main():
    print("[TEST] Presigned PUT URL Testing")
    print("=" * 50)
    
    # Test parameters
    user_id = "test-put-user"
    file_name = "test_put.csv"
    
    # Step 1: Create test file
    print("\n1. Creating test CSV file...")
    test_file = create_test_csv()
    
    # Step 2: Generate presigned PUT
    print("\n2. Generating presigned PUT URL...")
    result = generate_presigned_put(user_id, file_name)
    
    if not result['success']:
        print(f"[ERROR] Failed to generate presigned PUT: {result['error']}")
        return
    
    print("[OK] Presigned PUT generated successfully")
    print(f"URL: {result['uploadUrl']}")
    
    # Step 3: Test CORS preflight for PUT
    print("\n3. Testing CORS preflight for PUT...")
    preflight_success = test_cors_preflight_put(result['uploadUrl'])
    
    # Step 4: Test PUT upload
    print("\n4. Testing PUT upload...")
    upload_success = test_upload_with_put(
        result['uploadUrl'], 
        result['contentType'], 
        test_file
    )
    
    # Step 5: Cleanup
    print("\n5. Cleaning up...")
    try:
        import os
        os.remove(test_file)
        print(f"Removed test file: {test_file}")
    except Exception as e:
        print(f"Failed to remove test file: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("RESULTS:")
    print(f"PUT CORS Preflight: {'PASS' if preflight_success else 'FAIL'}")
    print(f"PUT Upload: {'PASS' if upload_success else 'FAIL'}")
    
    if preflight_success and upload_success:
        print("\n[SUCCESS] PUT approach works! This is the solution.")
        print("Switch from presigned POST to presigned PUT in the Lambda function.")
    elif upload_success and not preflight_success:
        print("\n[PARTIAL] PUT upload works but preflight fails.")
        print("May work in browser depending on CORS behavior.")

if __name__ == "__main__":
    main()