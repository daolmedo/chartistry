import { getAllBlogPosts, getAllCategories, getAllTags } from '@/lib/blog';
import BlogList from '@/app/components/blog/BlogList';
import BlogSidebar from '@/app/components/blog/BlogSidebar';
import Navigation from '@/app/components/landing/Navigation';
import Link from 'next/link';
import { PenTool } from 'lucide-react';

export const metadata = {
  title: 'Blog - Data Visualization Tips, Tutorials & AI Insights | chartz.ai',
  description: 'Discover the latest in data visualization, AI-powered chart creation, tutorials, and industry insights. Learn how to create better charts with chartz.ai.',
  openGraph: {
    title: 'Data Visualization Blog | chartz.ai',
    description: 'Expert insights on data visualization, AI-powered chart creation, and industry best practices.',
    type: 'website',
  },
};

export default async function BlogPage() {
  const [posts, categories, tags] = await Promise.all([
    getAllBlogPosts(),
    getAllCategories(),
    getAllTags(),
  ]);

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
                <PenTool className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Data Visualization Blog</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover expert insights, tutorials, and the latest trends in AI-powered data visualization. 
              Learn how to create stunning charts and transform your data into compelling stories.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Main content */}
          <main className="lg:col-span-8">
            <BlogList posts={posts} showFeatured={true} />
          </main>

          {/* Sidebar */}
          <aside className="mt-12 lg:mt-0 lg:col-span-4">
            <BlogSidebar
              recentPosts={posts.slice(0, 5)}
              categories={categories}
              tags={tags}
            />
          </aside>
        </div>
      </div>

      {/* CTA Section */}
      <section className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Create Amazing Charts?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already creating beautiful visualizations with AI. 
              Turn your data into insights in seconds.
            </p>
            <Link
              href="https://docs.google.com/forms/d/e/1FAIpQLSeEwhkaizkqAtdbbyV39yke7BV0kFOT1uaqpCodb61oDt-hpA/viewform?pli=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
            >
              Join Waiting List
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}