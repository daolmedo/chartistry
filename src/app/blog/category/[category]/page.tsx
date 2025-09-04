import { notFound } from 'next/navigation';
import { getBlogPostsByCategory, getAllCategories, getAllTags, getAllBlogPosts } from '@/lib/blog';
import BlogList from '@/app/components/blog/BlogList';
import BlogSidebar from '@/app/components/blog/BlogSidebar';
import Navigation from '@/app/components/landing/Navigation';
import Link from 'next/link';
import { Tag } from 'lucide-react';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

// Generate static params for all categories
export async function generateStaticParams() {
  const categories = await getAllCategories();
  
  return categories.map((category) => ({
    category: category,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps) {
  const categoryName = params.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return {
    title: `${categoryName} Articles | chartz.ai Blog`,
    description: `Explore all articles about ${categoryName.toLowerCase()}. Learn about data visualization, AI-powered charts, and industry insights.`,
    openGraph: {
      title: `${categoryName} Articles | chartz.ai Blog`,
      description: `Discover expert articles about ${categoryName.toLowerCase()} and data visualization.`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const [posts, categories, tags, recentPosts] = await Promise.all([
    getBlogPostsByCategory(params.category),
    getAllCategories(),
    getAllTags(),
    getAllBlogPosts().then(posts => posts.slice(0, 5)),
  ]);

  // If no posts found for this category, show 404
  if (!posts || posts.length === 0) {
    notFound();
  }

  const categoryName = params.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Page header */}
          <div className="py-12 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">{categoryName}</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore all articles about {categoryName.toLowerCase()}. 
              {posts.length} article{posts.length !== 1 ? 's' : ''} found.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Main content */}
          <main className="lg:col-span-8">
            <BlogList posts={posts} showFeatured={false} />
          </main>

          {/* Sidebar */}
          <aside className="mt-12 lg:mt-0 lg:col-span-4">
            <BlogSidebar
              recentPosts={recentPosts}
              categories={categories}
              tags={tags}
              currentCategory={params.category}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}