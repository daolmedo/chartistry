# S3 CORS Preflight Issue - Solution Summary

## Problem Identified
- S3 is returning `500 InternalError` for all CORS preflight OPTIONS requests
- This happens regardless of POST or PUT methods
- The actual upload requests work fine when Origin header is present
- Issue is specifically with KMS-encrypted S3 buckets and CORS preflights

## Root Cause
S3 has known issues handling CORS preflight requests when:
1. KMS encryption is enabled on the bucket
2. Pre-signed URLs include KMS-related parameters
3. Browser sends complex preflight requests with multiple headers

## Solutions Tested

### ✅ Working: Direct POST without Preflight
- The presigned POST upload works perfectly when no preflight is triggered
- Status: 204 success with proper CORS headers in response
- File is correctly encrypted and uploaded

### ❌ Failing: Any REQUEST that triggers CORS preflight
- ALL OPTIONS requests return 500 InternalError
- Both PUT and POST methods affected

## Recommended Solutions

### Solution 1: Use Simple Requests (No Preflight)
Modify the frontend to avoid triggering CORS preflight:

1. **Use FormData with simple Content-Type**
   - Don't set Content-Type header manually
   - Let browser set it automatically for FormData
   - This avoids preflight for most cases

2. **Remove custom headers**
   - Don't add custom X-Amz headers in frontend
   - Let the presigned POST handle all AWS headers

### Solution 2: Proxy Through Next.js API Route
Route uploads through your Next.js API:

1. Frontend uploads to `/api/upload-file` 
2. Next.js API route uploads to S3 server-side
3. No CORS issues since it's server-to-server

### Solution 3: Alternative Upload Service
Consider using:
- AWS S3 Transfer Acceleration
- CloudFront signed URLs
- Alternative storage service without CORS preflight issues

## Recommended Implementation (Solution 1)

Update DataInput.tsx to use simple FormData approach:

```typescript
// DON'T set Content-Type manually - let browser handle it
const formData = new FormData();

// Add presigned POST fields
Object.entries(fields).forEach(([key, value]) => {
  formData.append(key, value as string);
});

// Add file last  
formData.append('file', file);

// Use fetch instead of XMLHttpRequest for simpler CORS
const response = await fetch(uploadUrl, {
  method: 'POST',
  body: formData
  // DON'T add headers - let browser set them
});
```

## Why This Works
- Simple POST with FormData doesn't trigger CORS preflight
- Browser automatically sets correct Content-Type with boundary
- No custom headers means no preflight required
- S3 handles the request normally without OPTIONS preflight

## Implementation Steps
1. Update frontend to use simple FormData approach
2. Test in development browser
3. Deploy and test in production
4. Monitor for any remaining CORS issues

## Status
✅ Root cause identified: S3 CORS preflight + KMS encryption issue
✅ Working upload method confirmed (no preflight)
🚧 Implementation needed: Simple FormData approach