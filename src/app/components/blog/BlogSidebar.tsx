import Link from 'next/link';
import { BlogPost } from '@/lib/blog';
import { Calendar, Tag, TrendingUp } from 'lucide-react';

interface BlogSidebarProps {
  recentPosts?: BlogPost[];
  categories?: string[];
  tags?: string[];
  currentCategory?: string;
  currentTag?: string;
}

export default function BlogSidebar({ 
  recentPosts = [], 
  categories = [], 
  tags = [],
  currentCategory,
  currentTag
}: BlogSidebarProps) {
  return (
    <aside className="space-y-8">
      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Articles</h3>
        <div className="relative">
          <input
            type="search"
            placeholder="Search blog posts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Recent Posts
          </h3>
          <div className="space-y-4">
            {recentPosts.slice(0, 5).map((post) => (
              <article key={post.slug} className="group">
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h4>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Tag className="w-5 h-5 mr-2" />
            Categories
          </h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/blog/category/${category}`}
                className={`
                  block px-3 py-2 rounded-lg text-sm transition-colors
                  ${currentCategory === category 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Popular Tags */}
      {tags.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 15).map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${tag}`}
                className={`
                  inline-block px-3 py-1 text-sm rounded-full transition-colors
                  ${currentTag === tag
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter Signup */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
        <p className="text-blue-100 mb-4 text-sm">
          Get the latest articles about data visualization and AI delivered to your inbox.
        </p>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/70 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            Subscribe
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Ready to Create Charts?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Try chartz.ai and turn your data into beautiful visualizations with AI.
        </p>
        <Link
          href="https://docs.google.com/forms/d/e/1FAIpQLSeEwhkaizkqAtdbbyV39yke7BV0kFOT1uaqpCodb61oDt-hpA/viewform?pli=1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Join Waiting List
        </Link>
      </div>
    </aside>
  );
}