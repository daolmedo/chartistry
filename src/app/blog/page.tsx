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

const POSTS_PER_PAGE = 6;

interface BlogPageProps {
  searchParams: { page?: string };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const [posts, categories, tags] = await Promise.all([
    getAllBlogPosts(),
    getAllCategories(),
    getAllTags(),
  ]);

  // Get current page from URL params
  const currentPage = parseInt(searchParams.page || '1', 10);

  // Separate featured and regular posts
  const featuredPosts = posts.filter(post => post.featured);
  const regularPosts = posts.filter(post => !post.featured);

  // Pagination logic for regular posts only
  const totalRegularPosts = regularPosts.length;
  const totalPages = Math.ceil(totalRegularPosts / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = regularPosts.slice(startIndex, endIndex);

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
            {/* Featured posts section */}
            {featuredPosts.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Articles</h2>
                <BlogList posts={featuredPosts} showFeatured={true} />
              </section>
            )}

            {/* Regular posts with pagination */}
            {currentPosts.length > 0 && (
              <section>
                {featuredPosts.length > 0 && (
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Latest Articles</h2>
                )}
                <BlogList posts={currentPosts} showFeatured={false} />

                {/* Simple pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                    <div className="flex flex-1 justify-between sm:hidden">
                      {currentPage > 1 ? (
                        <Link
                          href={`/blog?page=${currentPage - 1}`}
                          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Previous
                        </Link>
                      ) : (
                        <span className="relative inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                          Previous
                        </span>
                      )}

                      {currentPage < totalPages ? (
                        <Link
                          href={`/blog?page=${currentPage + 1}`}
                          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Next
                        </Link>
                      ) : (
                        <span className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                          Next
                        </span>
                      )}
                    </div>

                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">{startIndex + 1}</span>
                          {' '}-{' '}
                          <span className="font-medium">{Math.min(endIndex, totalRegularPosts)}</span>
                          {' '}of{' '}
                          <span className="font-medium">{totalRegularPosts}</span>
                          {' '}articles
                        </p>
                      </div>

                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          {currentPage > 1 ? (
                            <Link
                              href={`/blog?page=${currentPage - 1}`}
                              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            >
                              <span className="sr-only">Previous</span>
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                              </svg>
                            </Link>
                          ) : (
                            <span className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                              <span className="sr-only">Previous</span>
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                            pageNumber === currentPage ? (
                              <span
                                key={pageNumber}
                                className="relative z-10 inline-flex items-center bg-blue-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                              >
                                {pageNumber}
                              </span>
                            ) : (
                              <Link
                                key={pageNumber}
                                href={`/blog?page=${pageNumber}`}
                                className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                              >
                                {pageNumber}
                              </Link>
                            )
                          ))}

                          {currentPage < totalPages ? (
                            <Link
                              href={`/blog?page=${currentPage + 1}`}
                              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            >
                              <span className="sr-only">Next</span>
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                              </svg>
                            </Link>
                          ) : (
                            <span className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                              <span className="sr-only">Next</span>
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
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