import { notFound } from 'next/navigation';
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/blog';
import TableOfContents from '@/app/components/blog/TableOfContents';
import RecentPosts from '@/app/components/blog/RecentPosts';
import Navigation from '@/app/components/landing/Navigation';
import Link from 'next/link';
import { Calendar, Clock, User, Tag, ArrowLeft } from 'lucide-react';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  
  // Include programmatic SEO chart guide slugs
  const chartTypes = ['pie', 'bar', 'line', 'scatter', 'area', 'column', 'donut', 'heatmap', 'funnel', 'gauge'];
  const chartGuideSlugs = chartTypes.map(type => ({
    slug: `how-to-create-${type}-charts`
  }));

  // Include competitor tutorial slugs
  const competitors = ['tableau', 'powerbi', 'looker-studio'];
  const competitorChartTypes = ['pie-chart', 'donut-chart', 'stacked-bar-chart', 'heat-map', 'scatter-plot'];
  const competitorTutorialSlugs: Array<{slug: string}> = [];

  competitors.forEach(competitor => {
    competitorChartTypes.forEach(chartType => {
      competitorTutorialSlugs.push({
        slug: `how-to-create-${chartType}-in-${competitor}`
      });
    });
  });

  // Include dashboard tutorial slugs
  const dashboardTools = ['tableau', 'powerbi', 'looker-studio', 'excel', 'sql', 'python', 'r'];
  const dashboardTutorialSlugs = dashboardTools.map(tool => ({
    slug: `how-to-create-dashboard-in-${tool}`
  }));

  return [
    ...posts.map((post) => ({
      slug: post.slug,
    })),
    ...chartGuideSlugs,
    ...competitorTutorialSlugs,
    ...dashboardTutorialSlugs,
  ];
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Blog Post Not Found | chartz.ai',
      description: 'The blog post you are looking for could not be found.',
    };
  }

  return {
    title: post.metaTitle || `${post.title} | chartz.ai Blog`,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      images: post.ogImage ? [{ url: post.ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.ogImage ? [post.ogImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const recentPosts = await getAllBlogPosts().then(posts => posts.slice(0, 5));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        {/* Back to blog link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Blog
        </Link>

        <div className="lg:flex lg:gap-8">
          {/* Article */}
          <article className="lg:flex-1 lg:max-w-4xl">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Featured image */}
              {post.ogImage && (
                <div className="h-64 lg:h-80 overflow-hidden">
                  <img
                    src={post.ogImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-8 lg:p-12">
                {/* Article meta */}
                <div className="mb-6">
                  {/* Category badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <Link
                      href={`/blog/category/${post.category}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {post.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Link>
                    {post.featured && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                    {post.title}
                  </h1>

                  {/* Excerpt */}
                  <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Meta information */}
                  <div className="flex items-center justify-between pb-6 border-b border-gray-200">
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {post.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      {post.readingTime && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {post.readingTime} min read
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Article content */}
                <div 
                  className="prose prose-lg prose-blue max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4 prose-p:leading-relaxed prose-ul:mb-4 prose-ol:mb-4 prose-li:mb-1 prose-img:rounded-lg prose-img:shadow-md prose-img:my-6"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/blog/tag/${tag}`}
                          className="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Author bio (if needed) */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{post.author}</h3>
                      <p className="text-gray-500 text-sm">
                        Content creator at chartz.ai, passionate about making data visualization accessible to everyone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Related posts CTA */}
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

            {/* Recent Posts */}
            <RecentPosts posts={recentPosts} currentSlug={post.slug} />
          </article>

          {/* Table of Contents Sidebar - Hidden on mobile */}
          <aside className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <TableOfContents content={post.content} />
          </aside>
        </div>
      </div>
    </div>
  );
}