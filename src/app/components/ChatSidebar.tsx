'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatSidebarProps {
  onGenerateChart: (message: string) => void;
  isGenerating: boolean;
}

export default function ChatSidebar({ onGenerateChart, isGenerating }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    onGenerateChart(inputValue);
    setInputValue('');
  };

  const addAssistantMessage = (content: string) => {
    const assistantMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'assistant',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Chart Assistant</h2>
        <p className="text-sm text-gray-600">Describe your data and get beautiful visualizations</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">Start by describing your data or asking for a specific chart type.</p>
            <p className="text-xs mt-2">Examples:</p>
            <ul className="text-xs mt-1 space-y-1">
              <li>• "Show sales data for the last 6 months"</li>
              <li>• "Create a bar chart with categories A, B, C"</li>
              <li>• "Visualize temperature trends over time"</li>
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg ${
              message.sender === 'user'
                ? 'bg-blue-100 ml-4'
                : 'bg-white border border-gray-200 mr-4'
            }`}
          >
            <p className="text-sm text-gray-800">{message.content}</p>
            <p className="text-xs text-gray-500 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </motion.div>
        ))}

        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-gray-200 mr-4 p-3 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-600">Generating chart...</p>
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe your chart..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isGenerating}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}