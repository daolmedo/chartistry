import Link from 'next/link';
import { BlogPost } from '@/lib/blog';
import { Calendar, Clock } from 'lucide-react';

interface RecentPostsProps {
  posts: BlogPost[];
  currentSlug: string;
}

export default function RecentPosts({ posts, currentSlug }: RecentPostsProps) {
  const filteredPosts = posts.filter(post => post.slug !== currentSlug).slice(0, 3);

  if (filteredPosts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 bg-gray-50 rounded-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Posts</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {filteredPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {post.ogImage && (
              <div className="h-48 overflow-hidden">
                <img
                  src={post.ogImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                {post.readingTime && (
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {post.readingTime} min
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}