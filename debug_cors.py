#!/usr/bin/env python3
"""
Deep debug of CORS issue with S3 presigned POST
"""

import requests
import json
from test_s3_upload import generate_presigned_post

def detailed_cors_analysis(upload_url):
    """
    Analyze CORS behavior in detail
    """
    print(f"Analyzing CORS for URL: {upload_url}")
    
    # Test 1: Simple GET request to see if CORS works at all
    print("\n--- Test 1: Simple GET request ---")
    try:
        headers = {'Origin': 'http://localhost:3000'}
        response = requests.get(upload_url, headers=headers)
        print(f"GET Status: {response.status_code}")
        print(f"GET CORS Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"GET Error: {e}")
    
    # Test 2: Direct OPTIONS request
    print("\n--- Test 2: Direct OPTIONS request ---")
    try:
        response = requests.options(upload_url)
        print(f"OPTIONS Status (no headers): {response.status_code}")
        print(f"OPTIONS Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"OPTIONS Error: {e}")
    
    # Test 3: CORS preflight with minimal headers
    print("\n--- Test 3: Minimal CORS preflight ---")
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
        }
        response = requests.options(upload_url, headers=headers)
        print(f"Minimal preflight Status: {response.status_code}")
        print(f"Minimal preflight Headers: {dict(response.headers)}")
        if response.status_code != 200:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Minimal preflight Error: {e}")
    
    # Test 4: Full CORS preflight (what browser sends)
    print("\n--- Test 4: Full CORS preflight ---")
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type',
        }
        response = requests.options(upload_url, headers=headers)
        print(f"Full preflight Status: {response.status_code}")
        print(f"Full preflight Headers: {dict(response.headers)}")
        if response.status_code != 200:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Full preflight Error: {e}")
    
    # Test 5: Try different request headers
    print("\n--- Test 5: Alternative request headers ---")
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'x-amz-server-side-encryption,x-amz-server-side-encryption-aws-kms-key-id',
        }
        response = requests.options(upload_url, headers=headers)
        print(f"Alternative headers Status: {response.status_code}")
        print(f"Alternative headers Headers: {dict(response.headers)}")
        if response.status_code != 200:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Alternative headers Error: {e}")

def main():
    print("[DEBUG] Deep CORS Analysis")
    print("=" * 50)
    
    # Generate presigned POST
    result = generate_presigned_post("test-debug", "debug.csv")
    
    if not result['success']:
        print(f"[ERROR] Failed to generate presigned POST: {result['error']}")
        return
    
    upload_url = result['uploadUrl']
    fields = result['fields']
    
    print(f"Upload URL: {upload_url}")
    print(f"Fields count: {len(fields)}")
    
    detailed_cors_analysis(upload_url)

if __name__ == "__main__":
    main()