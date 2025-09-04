import Link from 'next/link';
import { BlogPost } from '@/lib/blog';
import { Calendar, Clock, Tag, User } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const CardWrapper = featured ? 'div' : 'div';
  
  return (
    <CardWrapper className={`
      bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden 
      hover:shadow-md transition-shadow duration-300 group
      ${featured ? 'lg:col-span-2' : ''}
    `}>
      {/* Featured image */}
      {post.ogImage && (
        <div className={`overflow-hidden ${featured ? 'h-64' : 'h-48'}`}>
          <img
            src={post.ogImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className={`p-6 ${featured ? 'lg:p-8' : ''}`}>
        {/* Category badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`
            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
            bg-blue-50 text-blue-700 border border-blue-200
          `}>
            <Tag className="w-3 h-3 mr-1" />
            {post.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
          {post.featured && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
              Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`
          font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors
          ${featured ? 'text-2xl lg:text-3xl' : 'text-xl'}
        `}>
          <Link href={`/blog/${post.slug}`} className="block">
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className={`
          text-gray-600 mb-4 line-clamp-3
          ${featured ? 'text-lg' : 'text-base'}
        `}>
          {post.excerpt}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${tag}`}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </Link>
            ))}
            {post.tags.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs text-gray-500">
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Meta information */}
        <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {post.author}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
          
          {post.readingTime && (
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {post.readingTime} min read
            </div>
          )}
        </div>

        {/* Read more link */}
        <div className="mt-4">
          <Link 
            href={`/blog/${post.slug}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group"
          >
            Read full article
            <svg 
              className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </CardWrapper>
  );
}