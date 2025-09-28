'use client';

import { useState, useEffect } from 'react';
import { BlogPost } from '@/lib/blog';
import BlogList from './BlogList';
import { useRouter, useSearchParams } from 'next/navigation';

interface ClientPaginationProps {
  posts: BlogPost[];
  postsPerPage: number;
  featuredPosts: BlogPost[];
}

export default function ClientPagination({ posts, postsPerPage, featuredPosts }: ClientPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);

  // Sync with URL params on mount and when they change
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(page);
  }, [searchParams]);

  const totalPages = Math.ceil(posts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = posts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Update URL without causing a page reload
    const newUrl = page === 1 ? '/blog' : `/blog?page=${page}`;
    router.push(newUrl, { scroll: false });
  };

  return (
    <>
      {/* Featured posts section */}
      {featuredPosts.length > 0 && (
        <section className="mb-12">
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

          {/* Client-side pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
              <div className="flex flex-1 justify-between sm:hidden">
                {currentPage > 1 ? (
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                ) : (
                  <span className="relative inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                    Previous
                  </span>
                )}

                {currentPage < totalPages ? (
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
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
                    <span className="font-medium">{Math.min(endIndex, posts.length)}</span>
                    {' '}of{' '}
                    <span className="font-medium">{posts.length}</span>
                    {' '}articles
                  </p>
                </div>

                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    {currentPage > 1 ? (
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 transition-colors"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
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
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 transition-colors"
                        >
                          {pageNumber}
                        </button>
                      )
                    ))}

                    {currentPage < totalPages ? (
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 transition-colors"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
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
    </>
  );
}