'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.png" alt="chartz.ai logo" className="w-8 h-8 rounded-lg" />
              <span className="text-2xl font-bold">chartz.ai</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Transform your data into beautiful, interactive charts with the power of AI. 
              The fastest way to create stunning data visualizations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors scroll-smooth" onClick={(e) => {
                e.preventDefault();
                document.querySelector('[data-section="demo"]')?.scrollIntoView({ behavior: 'smooth' });
              }}>Features</a></li>
              <li><Link href="/csv-editor-online" className="hover:text-white transition-colors">CSV Editor</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><a href="mailto:d.olmedo@chartz.ai" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">© 2025 chartz.ai. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}