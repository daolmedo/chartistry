import { BlogPost } from '@/lib/blog';
import BlogCard from './BlogCard';

interface BlogListProps {
  posts: BlogPost[];
  showFeatured?: boolean;
  className?: string;
}

export default function BlogList({ posts, showFeatured = true, className = '' }: BlogListProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
        <p className="text-gray-500">Check back soon for new content!</p>
      </div>
    );
  }

  const featuredPosts = showFeatured ? posts.filter(post => post.featured) : [];
  const regularPosts = showFeatured ? posts.filter(post => !post.featured) : posts;

  return (
    <div className={className}>
      {/* Featured posts */}
      {featuredPosts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Articles</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {featuredPosts.map((post) => (
              <BlogCard key={post.slug} post={post} featured={true} />
            ))}
          </div>
        </section>
      )}

      {/* Regular posts */}
      {regularPosts.length > 0 && (
        <section>
          {featuredPosts.length > 0 && (
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Latest Articles</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}