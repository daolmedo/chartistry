// Updated DataInput.tsx with CORS preflight workaround
// Replace the uploadToS3 function with this implementation
/*
const uploadToS3 = useCallback(async (file: File) => {
  if (!currentUser?.uid) {
    setUploadError('User not authenticated');
    return;
  }

  setUploadStatus('uploading');
  setUploadProgress(0);
  setUploadError('');

  try {
    // Get the user's ID token for authentication
    const idToken = await currentUser.getIdToken();

    // Step 1: Get pre-signed URL from our API
    const uploadResponse = await fetch('/api/upload-dataset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        userId: currentUser.uid,
        fileName: file.name,
        fileType: file.type
      }),
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || 'Failed to get upload URL');
    }

    const { uploadUrl, fields, fileId, s3Key } = await uploadResponse.json();

    // Step 2: Upload file using simple FormData approach (no CORS preflight)
    const formData = new FormData();
    
    // Add all the fields from the presigned POST
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    
    // Add the file last
    formData.append('file', file);

    // Use fetch with simple POST - no custom headers to avoid CORS preflight
    const uploadRequest = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
      // IMPORTANT: Don't set Content-Type or other headers
      // Let the browser set them automatically to avoid CORS preflight
    });

    // Monitor upload progress (not available with fetch, use XMLHttpRequest if needed)
    setUploadProgress(100);

    if (uploadRequest.ok) {
      setUploadStatus('success');
      
      // Also read the file content for immediate use
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsv(content);
        setSelectedDemo('');
      };
      reader.readAsText(file);
    } else {
      const errorText = await uploadRequest.text();
      throw new Error(`Upload failed with status: ${uploadRequest.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('Upload error:', error);
    setUploadStatus('error');
    setUploadError(error instanceof Error ? error.message : 'Upload failed');
  }
}, [currentUser, setCsv]);

// Alternative with XMLHttpRequest for progress tracking:
const uploadToS3WithProgress = useCallback(async (file: File) => {
  if (!currentUser?.uid) {
    setUploadError('User not authenticated');
    return;
  }

  setUploadStatus('uploading');
  setUploadProgress(0);
  setUploadError('');

  try {
    // Get the user's ID token for authentication
    const idToken = await currentUser.getIdToken();

    // Step 1: Get pre-signed URL from our API
    const uploadResponse = await fetch('/api/upload-dataset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        userId: currentUser.uid,
        fileName: file.name,
        fileType: file.type
      }),
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || 'Failed to get upload URL');
    }

    const { uploadUrl, fields, fileId, s3Key } = await uploadResponse.json();

    // Step 2: Upload using XMLHttpRequest with simple FormData (no custom headers)
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      
      // Add all the fields from the presigned POST
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      // Add the file last
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      // Progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadStatus('success');
          
          // Also read the file content for immediate use
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            setCsv(content);
            setSelectedDemo('');
          };
          reader.readAsText(file);
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed due to network error'));
      };

      xhr.open('POST', uploadUrl);
      // CRITICAL: Don't set any headers - let browser handle FormData headers
      // Setting Content-Type manually will trigger CORS preflight
      xhr.send(formData);
    });

  } catch (error) {
    console.error('Upload error:', error);
    setUploadStatus('error');
    setUploadError(error instanceof Error ? error.message : 'Upload failed');
  }
}, [currentUser, setCsv]);
*/