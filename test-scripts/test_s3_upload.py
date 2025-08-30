#!/usr/bin/env python3
"""
Local S3 upload testing script to replicate the Lambda function behavior
and test the upload flow without Amplify deployments.
"""

import boto3
import json
import uuid
import requests
import os
from botocore.exceptions import ClientError

# Configuration - match your Lambda function
BUCKET_NAME = 'chartz-datasets'
EXPIRATION_TIME = 3600  # 1 hour
KMS_KEY_ID = 'arn:aws:kms:eu-west-2:252326958099:key/602a7058-adf6-48c5-80bf-39ea7956742f'

def generate_presigned_post(user_id, file_name, file_type='text/csv'):
    """
    Generate a presigned POST URL for S3 upload with KMS encryption
    """
    try:
        # Initialize S3 client
        s3_client = boto3.client('s3', region_name='eu-west-2')
        
        # Generate unique file key
        file_id = str(uuid.uuid4())
        safe_file_name = file_name.replace(' ', '_').replace('/', '_')
        s3_key = f"{user_id}/{file_id}_{safe_file_name}"
        
        print(f"Generating presigned POST for: {s3_key}")
        
        # Generate pre-signed POST for KMS encryption
        presigned_post = s3_client.generate_presigned_post(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Fields={
                'Content-Type': file_type,
                'x-amz-server-side-encryption': 'aws:kms',
                'x-amz-server-side-encryption-aws-kms-key-id': KMS_KEY_ID,
                'x-amz-meta-user-id': user_id,
                'x-amz-meta-original-name': file_name,
                'x-amz-meta-file-id': file_id
            },
            Conditions=[
                {'Content-Type': file_type},
                {'x-amz-server-side-encryption': 'aws:kms'},
                {'x-amz-server-side-encryption-aws-kms-key-id': KMS_KEY_ID},
                ['starts-with', '$x-amz-meta-user-id', user_id],
                ['starts-with', '$x-amz-meta-original-name', ''],
                ['starts-with', '$x-amz-meta-file-id', '']
            ],
            ExpiresIn=EXPIRATION_TIME
        )
        
        return {
            'success': True,
            'uploadUrl': presigned_post['url'],
            'fields': presigned_post['fields'],
            'fileId': file_id,
            's3Key': s3_key,
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

def test_upload_with_presigned_post(upload_url, fields, file_path):
    """
    Test uploading a file using the presigned POST data
    """
    try:
        print(f"Testing upload to: {upload_url}")
        print(f"Fields: {json.dumps(fields, indent=2)}")
        
        # Prepare the form data
        files = {'file': open(file_path, 'rb')}
        
        # Make the POST request
        response = requests.post(upload_url, data=fields, files=files)
        
        files['file'].close()
        
        print(f"Upload response status: {response.status_code}")
        print(f"Upload response headers: {dict(response.headers)}")
        
        if response.status_code in [200, 204]:
            print("[SUCCESS] Upload successful!")
            return True
        else:
            print(f"[ERROR] Upload failed: {response.status_code}")
            print(f"Response text: {response.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Upload error: {e}")
        return False

def create_test_csv():
    """
    Create a simple test CSV file
    """
    test_file = 'test_data.csv'
    with open(test_file, 'w') as f:
        f.write("name,value,category\n")
        f.write("Product A,100,Electronics\n")
        f.write("Product B,150,Electronics\n")
        f.write("Product C,200,Home\n")
        f.write("Product D,75,Home\n")
    
    print(f"Created test CSV: {test_file}")
    return test_file

def test_s3_permissions():
    """
    Test basic S3 and KMS permissions
    """
    try:
        s3_client = boto3.client('s3', region_name='eu-west-2')
        
        # Test bucket access
        print("Testing bucket access...")
        s3_client.head_bucket(Bucket=BUCKET_NAME)
        print("[OK] Bucket access OK")
        
        # Test KMS key access
        print("Testing KMS key access...")
        kms_client = boto3.client('kms', region_name='eu-west-2')
        kms_client.describe_key(KeyId=KMS_KEY_ID)
        print("[OK] KMS key access OK")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Permissions error: {e}")
        return False

def main():
    print("[TEST] S3 Upload Flow Testing Script")
    print("=" * 50)
    
    # Test parameters
    user_id = "test-user-123"
    file_name = "test_data.csv"
    
    # Step 1: Test permissions
    print("\n1. Testing AWS permissions...")
    if not test_s3_permissions():
        print("[ERROR] Permission test failed. Check AWS credentials and policies.")
        return
    
    # Step 2: Create test file
    print("\n2. Creating test CSV file...")
    test_file = create_test_csv()
    
    # Step 3: Generate presigned POST
    print("\n3. Generating presigned POST URL...")
    result = generate_presigned_post(user_id, file_name)
    
    if not result['success']:
        print(f"[ERROR] Failed to generate presigned POST: {result['error']}")
        return
    
    print("[OK] Presigned POST generated successfully")
    
    # Step 4: Test upload
    print("\n4. Testing file upload...")
    upload_success = test_upload_with_presigned_post(
        result['uploadUrl'], 
        result['fields'], 
        test_file
    )
    
    # Step 5: Cleanup
    print("\n5. Cleaning up...")
    try:
        os.remove(test_file)
        print(f"Removed test file: {test_file}")
    except Exception as e:
        print(f"Failed to remove test file: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    if upload_success:
        print("[SUCCESS] S3 upload test completed successfully!")
        print(f"File uploaded to: {result['s3Key']}")
    else:
        print("[ERROR] S3 upload test failed")
        print("Check the error messages above for troubleshooting")

if __name__ == "__main__":
    # Check if AWS credentials are configured
    try:
        boto3.Session().get_credentials()
        main()
    except Exception as e:
        print(f"[ERROR] AWS credentials not configured: {e}")
        print("Please configure AWS credentials using:")
        print("- aws configure")
        print("- Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)")
        print("- IAM role (if running on EC2)")