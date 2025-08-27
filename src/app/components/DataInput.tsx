'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { demoDataList, demoDataKeys } from '../constants/mockData';

interface DataInputProps {
  csv: string;
  setCsv: (csv: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export default function DataInput({
  csv,
  setCsv,
  prompt,
  setPrompt,
  onGenerate,
  isLoading
}: DataInputProps) {
  const [selectedDemo, setSelectedDemo] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string>('');
  
  const { currentUser } = useAuth();

  const handleDemoChange = useCallback((demoKey: string) => {
    if (demoKey && demoDataList[demoKey as keyof typeof demoDataList]) {
      const demo = demoDataList[demoKey as keyof typeof demoDataList];
      setCsv(demo.csv);
      setPrompt(demo.input);
      setSelectedDemo(demoKey);
    }
  }, [setCsv, setPrompt]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsv(content);
        setSelectedDemo('');
      };
      reader.readAsText(file);
    }
  }, [setCsv]);

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

      const { uploadUrl, fileId, s3Key } = await uploadResponse.json();

      // Step 2: Upload file directly to S3 using pre-signed URL
      const uploadRequest = new XMLHttpRequest();
      
      uploadRequest.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      uploadRequest.onload = () => {
        if (uploadRequest.status === 200) {
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
          throw new Error(`Upload failed with status: ${uploadRequest.status}`);
        }
      };

      uploadRequest.onerror = () => {
        throw new Error('Upload failed due to network error');
      };

      uploadRequest.open('PUT', uploadUrl);
      uploadRequest.setRequestHeader('Content-Type', file.type);
      uploadRequest.setRequestHeader('x-amz-server-side-encryption', 'aws:kms');
      uploadRequest.setRequestHeader('x-amz-server-side-encryption-aws-kms-key-id', 'arn:aws:kms:eu-west-2:252326958099:key/602a7058-adf6-48c5-80bf-39ea7956742f');
      uploadRequest.send(file);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    }
  }, [currentUser, setCsv]);

  const handleS3FileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
        setUploadError('Please select a CSV file');
        return;
      }
      uploadToS3(file);
    }
    // Reset the input so the same file can be selected again
    event.target.value = '';
  }, [uploadToS3]);

  const canGenerate = csv.trim() && prompt.trim() && !isLoading;

  return (
    <div className="w-80 bg-gradient-to-br from-gray-50 to-white border-r border-gray-200 p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Chart Generation</h2>
          <p className="text-sm text-gray-600">Upload your data and describe the chart you want</p>
        </div>


        {/* Demo Data Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Demo Data
          </label>
          <select
            value={selectedDemo}
            onChange={(e) => handleDemoChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
          >
            <option value="">Select demo data...</option>
            {demoDataKeys.map((key) => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload Options */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Upload CSV File
          </label>
          
          {/* Local File Upload (for immediate use) */}
          <div className="space-y-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 file:shadow-sm"
            />
            <p className="text-xs text-gray-500">For immediate use (not saved)</p>
          </div>

          {/* S3 Upload (for saving to cloud) */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleS3FileUpload}
                disabled={uploadStatus === 'uploading'}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:shadow-sm disabled:opacity-50"
              />
              {uploadStatus === 'uploading' && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading... {uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Save to your datasets</p>
              {uploadStatus === 'success' && (
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Saved!</span>
                </div>
              )}
            </div>
            
            {/* Upload Progress Bar */}
            {uploadStatus === 'uploading' && (
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            
            {/* Upload Error */}
            {uploadStatus === 'error' && uploadError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {uploadError}
              </div>
            )}
          </div>
        </div>

        {/* CSV Data Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            CSV Data
          </label>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="Enter CSV data here..."
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono shadow-sm"
          />
        </div>

        {/* Prompt Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Chart Description
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what kind of chart you want..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
          />
        </div>

        {/* Generate Button */}
        <div className="pt-4">
          <button
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`w-full py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
              canGenerate
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : (
              'Generate Chart'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}