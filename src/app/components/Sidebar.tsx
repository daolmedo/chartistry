'use client';

import { useState } from 'react';

interface SidebarProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function Sidebar({ onSendMessage, isLoading }: SidebarProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Chart Generator</h2>
        <p className="text-sm text-gray-600">Ask me to create a pie chart for you</p>
      </div>
      
      <div className="flex-1 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Describe your chart
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Create a pie chart showing market share of different browsers"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Generating...' : 'Generate Chart'}
          </button>
        </form>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>💡 Try asking for:</p>
          <ul className="mt-1 space-y-1">
            <li>• Sales by region</li>
            <li>• Budget breakdown</li>
            <li>• Survey results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}