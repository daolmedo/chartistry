import { notFound } from 'next/navigation';
import { getAllLandingPages, getLandingPageBySlug } from '@/lib/landing-pages';
import TableOfContents from '@/app/components/blog/TableOfContents';
import Navigation from '@/app/components/landing/Navigation';
import Link from 'next/link';
import { ArrowLeft, Tag, User } from 'lucide-react';

interface LandingPageProps {
  params: {
    'landing-slug': string;
  };
}

// Generate static params for all landing pages
export async function generateStaticParams() {
  const pages = await getAllLandingPages();

  // TODO: Add your programmatic landing page slugs here
  // Example:
  // const chartTypes = ['pie-chart', 'bar-chart'];
  // const generatorSlugs = chartTypes.map(type => ({
  //   'landing-slug': `${type}-generator`
  // }));

  return pages.map((page) => ({
    'landing-slug': page.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: LandingPageProps) {
  const page = await getLandingPageBySlug(params['landing-slug']);

  if (!page) {
    return {
      title: 'Page Not Found | chartz.ai',
      description: 'The page you are looking for could not be found.',
    };
  }

  return {
    title: page.metaTitle || `${page.title} | chartz.ai`,
    description: page.metaDescription || page.description,
    keywords: page.keywords,
    openGraph: {
      title: page.title,
      description: page.description,
      type: 'website',
      images: page.ogImage ? [{ url: page.ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: page.ogImage ? [page.ogImage] : undefined,
    },
  };
}

export default async function LandingPage({ params }: LandingPageProps) {
  const page = await getLandingPageBySlug(params['landing-slug']);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        {/* Back to home link */}
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>

        <div className="lg:flex lg:gap-8">
          {/* Article */}
          <article className="lg:flex-1 lg:max-w-4xl">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 lg:p-12">
                {/* Page meta */}
                <div className="mb-6">
                  {/* Category badge */}
                  {page.category && (
                    <div className="flex items-center gap-3 mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Tag className="w-3 h-3 mr-1" />
                        {page.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
                    {page.title}
                  </h1>

                  {/* Description */}
                  {page.description && (
                    <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                      {page.description}
                    </p>
                  )}

                  {/* Author bio */}
                  {page.author && (
                    <div className="mb-6">
                      <div className="flex items-center">
                        <img
                          src="/DO-Profile.jpg"
                          alt={page.author}
                          className="w-12 h-12 rounded-full object-cover mr-4"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{page.author}</h3>
                          <p className="text-gray-500 text-sm">
                            Co-Founder of Chartz
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Meta divider */}
                  <div className="pb-6 border-b border-gray-200"></div>
                </div>

                {/* Page content */}
                <div
                  className="prose prose-lg prose-blue max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4 prose-p:leading-relaxed prose-ul:mb-4 prose-ol:mb-4 prose-li:mb-1 prose-img:rounded-lg prose-img:shadow-md prose-img:my-6 prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:p-3 prose-td:border prose-td:border-gray-300 prose-td:p-3"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />

                {/* Keywords/Tags */}
                {page.keywords && page.keywords.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Related Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {page.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-2">Ready to Create Your Own Charts?</h3>
              <p className="text-blue-100 mb-6">
                Transform your data into beautiful visualizations with AI-powered chart creation.
              </p>
              <Link
                href="https://docs.google.com/forms/d/e/1FAIpQLSeEwhkaizkqAtdbbyV39yke7BV0kFOT1uaqpCodb61oDt-hpA/viewform?pli=1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                Join Waiting List
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </article>

          {/* Table of Contents Sidebar - Hidden on mobile */}
          <aside className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <TableOfContents content={page.content} />
          </aside>
        </div>
      </div>
    </div>
  );
}
