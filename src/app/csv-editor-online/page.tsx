'use client';

import { useState, useRef } from 'react';
import Navigation from '../components/landing/Navigation';

export default function CSVEditorPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV file
  const parseCSV = (text: string): { headers: string[], data: string[][] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], data: [] };

    const parseRow = (row: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);

      return result.map(cell => cell.trim());
    };

    const headers = parseRow(lines[0]);
    const data = lines.slice(1).map(line => parseRow(line));

    return { headers, data };
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, data } = parseCSV(text);
      setHeaders(headers);
      setData(data);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Edit cell value
  const handleCellEdit = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };

  // Edit header
  const handleHeaderEdit = (colIndex: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[colIndex] = value;
    setHeaders(newHeaders);
  };

  // Add row
  const addRow = () => {
    const newRow = new Array(headers.length).fill('');
    setData([...data, newRow]);
  };

  // Delete row
  const deleteRow = (rowIndex: number) => {
    setData(data.filter((_, i) => i !== rowIndex));
  };

  // Add column
  const addColumn = () => {
    setHeaders([...headers, `Column ${headers.length + 1}`]);
    setData(data.map(row => [...row, '']));
  };

  // Delete column
  const deleteColumn = (colIndex: number) => {
    setHeaders(headers.filter((_, i) => i !== colIndex));
    setData(data.map(row => row.filter((_, i) => i !== colIndex)));
  };

  // Download CSV
  const downloadCSV = () => {
    const escapeCSVCell = (cell: string): string => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    };

    const csvContent = [
      headers.map(escapeCSVCell).join(','),
      ...data.map(row => row.map(escapeCSVCell).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'edited-data.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear data
  const clearData = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      setHeaders([]);
      setData([]);
      setFileName('');
    }
  };

  // Create new CSV from scratch
  const createNew = () => {
    setHeaders(['Column 1', 'Column 2', 'Column 3']);
    setData([
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ]);
    setFileName('new-data.csv');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navigation />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Free Online CSV Editor
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload, edit, and download your CSV files instantly. No registration required.
              All processing happens in your browser - your data never leaves your device.
            </p>
          </div>

          {/* Upload Section */}
          {headers.length === 0 ? (
            <div className="max-w-3xl mx-auto">
              <div
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Upload your CSV file
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Drag and drop your file here, or click to browse
                    </p>
                  </div>

                  <div className="flex items-center justify-center space-x-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Choose File
                    </button>
                    <button
                      onClick={createNew}
                      className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-lg font-semibold border border-gray-300 transition-colors shadow-sm"
                    >
                      Create New CSV
                    </button>
                  </div>

                  <p className="text-xs text-gray-500">
                    CSV files only • Maximum 10MB • 100% secure and private
                  </p>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">100% Private</h3>
                  <p className="text-sm text-gray-600">Your files are processed locally in your browser. Nothing is uploaded to our servers.</p>
                </div>

                <div className="text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                  <p className="text-sm text-gray-600">Edit your CSV files instantly with no waiting for uploads or downloads.</p>
                </div>

                <div className="text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Easy to Use</h3>
                  <p className="text-sm text-gray-600">Intuitive interface makes editing CSV files as simple as using a spreadsheet.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Editor Section */
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-semibold text-gray-900">{fileName}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {data.length} rows × {headers.length} columns
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={addRow}
                      className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-colors shadow-sm"
                    >
                      + Add Row
                    </button>
                    <button
                      onClick={addColumn}
                      className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-colors shadow-sm"
                    >
                      + Add Column
                    </button>
                    <button
                      onClick={downloadCSV}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Download CSV
                    </button>
                    <button
                      onClick={clearData}
                      className="px-4 py-2 text-sm bg-white hover:bg-red-50 text-red-600 rounded-lg border border-red-300 transition-colors shadow-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                      <tr>
                        <th className="w-16 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200">
                          #
                        </th>
                        {headers.map((header, colIndex) => (
                          <th
                            key={colIndex}
                            className="group relative px-3 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider border-b border-r border-gray-200 min-w-40"
                          >
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                value={header}
                                onChange={(e) => handleHeaderEdit(colIndex, e.target.value)}
                                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 font-medium"
                              />
                              <button
                                onClick={() => deleteColumn(colIndex)}
                                className="ml-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                                title="Delete column"
                              >
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {data.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={`group ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                        >
                          <td className="px-3 py-2 text-sm text-gray-500 border-b border-r border-gray-200 font-mono text-center">
                            <div className="flex items-center justify-between">
                              <span className="flex-1">{rowIndex + 1}</span>
                              <button
                                onClick={() => deleteRow(rowIndex)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                                title="Delete row"
                              >
                                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          {row.map((cell, colIndex) => (
                            <td
                              key={colIndex}
                              className="px-3 py-2 text-sm text-gray-900 border-b border-r border-gray-200"
                            >
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleCellEdit(rowIndex, colIndex, e.target.value)}
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">How to use:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Click any cell to edit its contents</li>
                      <li>• Click column headers to rename them</li>
                      <li>• Hover over rows/columns to see delete buttons</li>
                      <li>• Click "Download CSV" when you're done editing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p>
              Part of <a href="/" className="text-blue-600 hover:text-blue-700 font-semibold">chartz.ai</a> -
              Create beautiful charts from your data with AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
