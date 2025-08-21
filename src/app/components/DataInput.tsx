'use client';

import { useState, useCallback } from 'react';
import { demoDataList, demoDataKeys } from '../constants/mockData';

interface DataInputProps {
  csv: string;
  setCsv: (csv: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
  showApiConfig: boolean;
  setShowApiConfig: (show: boolean) => void;
}

export default function DataInput({
  csv,
  setCsv,
  prompt,
  setPrompt,
  onGenerate,
  isLoading,
  apiKey,
  setApiKey,
  showApiConfig,
  setShowApiConfig
}: DataInputProps) {
  const [selectedDemo, setSelectedDemo] = useState<string>('');

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

  const canGenerate = csv.trim() && prompt.trim() && apiKey.trim() && !isLoading;

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Chart Generation</h2>
        </div>

        {/* API Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              API Configuration
            </label>
            <button
              onClick={() => setShowApiConfig(!showApiConfig)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {showApiConfig ? 'Hide' : 'Configure'}
            </button>
          </div>
          
          {showApiConfig && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <p className="text-xs text-gray-500">
                API key is required for chart generation. It will be sent to your Lambda function.
              </p>
            </div>
          )}
        </div>

        {/* Demo Data Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Demo Data
          </label>
          <select
            value={selectedDemo}
            onChange={(e) => handleDemoChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">Select demo data...</option>
            {demoDataKeys.map((key) => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Upload CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Generate Button */}
        <div className="pt-4">
          <button
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              canGenerate
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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

        {/* Status Messages */}
        {!apiKey && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Please configure your OpenAI API key to generate charts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}