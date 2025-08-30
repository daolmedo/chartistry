#!/usr/bin/env python3
"""
Simulate browser behavior more closely to debug CORS issues
"""

import requests
import json
from test_s3_upload import generate_presigned_post, create_test_csv

def test_cors_preflight(upload_url):
    """
    Test CORS preflight request that browsers send
    """
    print("Testing CORS preflight request...")
    
    try:
        # Simulate browser preflight request
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type',
        }
        
        response = requests.options(upload_url, headers=headers)
        
        print(f"Preflight status: {response.status_code}")
        print(f"Preflight headers: {dict(response.headers)}")
        
        # Check if CORS headers are present
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        
        print(f"CORS headers: {cors_headers}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"[ERROR] Preflight error: {e}")
        return False

def test_upload_with_origin_header(upload_url, fields, file_path):
    """
    Test upload with Origin header (like browsers send)
    """
    try:
        print(f"Testing upload with Origin header...")
        
        # Add Origin header like browsers do
        headers = {
            'Origin': 'http://localhost:3000'
        }
        
        # Prepare the form data
        files = {'file': open(file_path, 'rb')}
        
        # Make the POST request with Origin header
        response = requests.post(upload_url, data=fields, files=files, headers=headers)
        
        files['file'].close()
        
        print(f"Upload with Origin - Status: {response.status_code}")
        print(f"Upload with Origin - Headers: {dict(response.headers)}")
        
        if response.status_code in [200, 204]:
            print("[SUCCESS] Upload with Origin successful!")
            return True
        else:
            print(f"[ERROR] Upload with Origin failed: {response.status_code}")
            print(f"Response text: {response.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Upload with Origin error: {e}")
        return False

def check_s3_bucket_cors():
    """
    Check the current CORS configuration of the S3 bucket
    """
    try:
        import boto3
        
        s3_client = boto3.client('s3', region_name='eu-west-2')
        
        print("Checking S3 bucket CORS configuration...")
        
        try:
            cors_response = s3_client.get_bucket_cors(Bucket='chartz-datasets')
            print("Current CORS rules:")
            print(json.dumps(cors_response['CORSRules'], indent=2))
            return True
        except s3_client.exceptions.NoSuchCORSConfiguration:
            print("[ERROR] No CORS configuration found on bucket!")
            return False
        except Exception as cors_error:
            print(f"[ERROR] Failed to get CORS config: {cors_error}")
            return False
            
    except Exception as e:
        print(f"[ERROR] CORS check error: {e}")
        return False

def main():
    print("[TEST] Browser Upload Simulation")
    print("=" * 50)
    
    # Test parameters
    user_id = "test-user-browser"
    file_name = "test_browser.csv"
    
    # Step 1: Check CORS configuration
    print("\n1. Checking S3 CORS configuration...")
    check_s3_bucket_cors()
    
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
    upload_url = result['uploadUrl']
    
    # Step 4: Test CORS preflight
    print("\n4. Testing CORS preflight...")
    preflight_success = test_cors_preflight(upload_url)
    
    # Step 5: Test upload with Origin header
    print("\n5. Testing upload with Origin header (simulating browser)...")
    upload_success = test_upload_with_origin_header(
        result['uploadUrl'], 
        result['fields'], 
        test_file
    )
    
    # Step 6: Cleanup
    print("\n6. Cleaning up...")
    try:
        import os
        os.remove(test_file)
        print(f"Removed test file: {test_file}")
    except Exception as e:
        print(f"Failed to remove test file: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("RESULTS:")
    print(f"CORS Preflight: {'PASS' if preflight_success else 'FAIL'}")
    print(f"Upload with Origin: {'PASS' if upload_success else 'FAIL'}")
    
    if not preflight_success:
        print("\n[ISSUE] CORS preflight is failing!")
        print("This is likely why browser uploads are blocked.")
        print("Check S3 bucket CORS configuration.")
    
    if preflight_success and not upload_success:
        print("\n[ISSUE] Upload fails even though CORS preflight passes.")
        print("This suggests an issue with the actual upload request.")

if __name__ == "__main__":
    main()