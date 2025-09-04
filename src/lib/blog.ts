import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

// Types
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  category: string;
  tags: string[];
  featured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  readingTime?: number;
}

export interface BlogTemplate {
  templateName: string;
  type: 'template';
  variables: TemplateVariable[];
  content: string;
}

export interface TemplateVariable {
  name: string;
  source: 'parameter' | 'lookup' | 'transform' | 'static';
  description?: string;
  transform?: string;
  input?: string;
  lookup?: string;
  key?: string;
  value?: string;
}

export interface GeneratedPost extends BlogPost {
  templateName: string;
  variables: Record<string, any>;
  isGenerated: true;
}

// Paths
const BLOG_POSTS_PATH = path.join(process.cwd(), 'content/blog/posts');
const BLOG_TEMPLATES_PATH = path.join(process.cwd(), 'content/blog/templates');
const BLOG_GENERATED_PATH = path.join(process.cwd(), 'content/blog/generated');
const CHART_DATA_PATH = path.join(process.cwd(), 'content/blog/chart-data.json');

// Utility functions
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function processMarkdown(content: string): string {
  const processedHtml = remark().use(html).processSync(content);
  return processedHtml.toString();
}

// Get all blog posts (regular posts only, not generated)
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  if (!fs.existsSync(BLOG_POSTS_PATH)) {
    return [];
  }

  const files = fs.readdirSync(BLOG_POSTS_PATH);
  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith('.md'))
      .map(async (file) => {
        const slug = file.replace('.md', '');
        return await getBlogPostBySlug(slug);
      })
      .filter(Boolean)
  );

  // Sort by publishedAt date (newest first)
  return posts
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

// Get featured blog posts
export async function getFeaturedBlogPosts(limit = 3): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => post.featured).slice(0, limit);
}

// Get blog posts by category
export async function getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => post.category === category);
}

// Get blog posts by tag
export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => post.tags.includes(tag));
}

// Get single blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(BLOG_POSTS_PATH, `${slug}.md`);
    
    if (!fs.existsSync(fullPath)) {
      // Try generated posts
      return await getGeneratedPostBySlug(slug);
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const processedContent = processMarkdown(content);
    const readingTime = calculateReadingTime(content);

    return {
      slug,
      title: data.title,
      excerpt: data.excerpt,
      content: processedContent,
      publishedAt: data.publishedAt,
      updatedAt: data.updatedAt,
      author: data.author,
      category: data.category,
      tags: data.tags || [],
      featured: data.featured || false,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      ogImage: data.ogImage,
      readingTime,
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

// Get all available categories
export async function getAllCategories(): Promise<string[]> {
  const allPosts = await getAllBlogPosts();
  const categories = new Set(allPosts.map(post => post.category));
  return Array.from(categories).sort();
}

// Get all available tags
export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllBlogPosts();
  const tags = new Set(allPosts.flatMap(post => post.tags));
  return Array.from(tags).sort();
}

// Template processing functions
export function loadChartData(): any {
  try {
    const chartDataContents = fs.readFileSync(CHART_DATA_PATH, 'utf8');
    return JSON.parse(chartDataContents);
  } catch (error) {
    console.error('Error loading chart data:', error);
    return {};
  }
}

export function getBlogTemplate(templateName: string): BlogTemplate | null {
  try {
    const fullPath = path.join(BLOG_TEMPLATES_PATH, `${templateName}.md`);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      templateName: data.templateName,
      type: data.type,
      variables: data.variables || [],
      content,
    };
  } catch (error) {
    console.error(`Error reading blog template ${templateName}:`, error);
    return null;
  }
}

// Generate blog post from template
export function generatePostFromTemplate(
  templateName: string,
  variables: Record<string, any>
): GeneratedPost | null {
  const template = getBlogTemplate(templateName);
  if (!template) return null;

  const chartData = loadChartData();
  let generatedContent = template.content;
  let generatedTitle = '';
  let generatedSlug = '';

  // Process variables and replace placeholders
  for (const variable of template.variables) {
    let value = '';

    switch (variable.source) {
      case 'parameter':
        value = variables[variable.name] || '';
        break;
      case 'transform':
        const input = variables[variable.input || ''] || '';
        value = transformValue(input, variable.transform || '');
        break;
      case 'lookup':
        const lookupData = chartData[variable.lookup || ''] || {};
        value = lookupData[variable.key || variables[variable.name]] || '';
        break;
      case 'static':
        value = variable.value || '';
        break;
    }

    // Replace all occurrences of the variable in content
    const placeholder = `{${variable.name}}`;
    generatedContent = generatedContent.replace(new RegExp(placeholder, 'g'), value);
  }

  // Extract title from content (first H1)
  const titleMatch = generatedContent.match(/^# (.+)$/m);
  generatedTitle = titleMatch ? titleMatch[1] : `${variables.chartTypeDisplay || variables.chartType} Chart Guide`;

  // Generate slug
  generatedSlug = `how-to-create-${variables.chartType}-charts`;

  // Process markdown to HTML
  const processedContent = processMarkdown(generatedContent);
  const readingTime = calculateReadingTime(generatedContent);

  // Generate SEO meta
  const metaTitle = `Create ${variables.chartTypeDisplay || variables.chartType} Charts with AI | chartz.ai`;
  const metaDescription = `Learn how to create beautiful ${variables.chartTypeDisplay || variables.chartType} charts using AI. Step-by-step guide with examples and best practices.`;

  return {
    slug: generatedSlug,
    title: generatedTitle,
    excerpt: `Complete guide to creating ${variables.chartTypeDisplay || variables.chartType} charts with AI-powered data visualization.`,
    content: processedContent,
    publishedAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    author: 'chartz.ai Team',
    category: 'chart-tutorials',
    tags: ['charts', 'AI', 'tutorial', variables.chartType],
    featured: false,
    metaTitle,
    metaDescription,
    readingTime,
    templateName,
    variables,
    isGenerated: true,
  };
}

function transformValue(input: string, transform: string): string {
  switch (transform) {
    case 'capitalize':
      return input.charAt(0).toUpperCase() + input.slice(1).replace(/-/g, ' ');
    case 'uppercase':
      return input.toUpperCase();
    case 'lowercase':
      return input.toLowerCase();
    case 'title_case':
      return input.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    default:
      return input;
  }
}

// Get generated post by slug
export async function getGeneratedPostBySlug(slug: string): Promise<GeneratedPost | null> {
  // Check if it's a chart guide
  const chartTypeMatch = slug.match(/^how-to-create-(.+)-charts$/);
  if (chartTypeMatch) {
    const chartType = chartTypeMatch[1];
    return generatePostFromTemplate('chart-guide-template', { 
      chartType,
      chartTypeDisplay: transformValue(chartType, 'capitalize')
    });
  }

  // Check for saved generated posts
  try {
    const fullPath = path.join(BLOG_GENERATED_PATH, `${slug}.md`);
    
    if (fs.existsSync(fullPath)) {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      const processedContent = processMarkdown(content);
      const readingTime = calculateReadingTime(content);

      return {
        slug,
        title: data.title,
        excerpt: data.excerpt,
        content: processedContent,
        publishedAt: data.publishedAt,
        updatedAt: data.updatedAt,
        author: data.author,
        category: data.category,
        tags: data.tags || [],
        featured: data.featured || false,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        ogImage: data.ogImage,
        readingTime,
        templateName: data.templateName,
        variables: data.variables || {},
        isGenerated: true,
      };
    }
  } catch (error) {
    console.error(`Error reading generated post ${slug}:`, error);
  }

  return null;
}

// Get all available chart types for programmatic SEO
export function getAvailableChartTypes(): string[] {
  const chartData = loadChartData();
  return Object.keys(chartData.chartDescriptions || {});
}

// Generate sitemap data for all posts
export async function getSitemapData(): Promise<Array<{url: string, lastModified: string}>> {
  const allPosts = await getAllBlogPosts();
  const chartTypes = getAvailableChartTypes();
  
  const sitemapData: Array<{url: string, lastModified: string}> = [];

  // Add regular blog posts
  allPosts.forEach(post => {
    sitemapData.push({
      url: `/blog/${post.slug}`,
      lastModified: post.updatedAt,
    });
  });

  // Add generated chart guide posts
  chartTypes.forEach(chartType => {
    sitemapData.push({
      url: `/blog/how-to-create-${chartType}-charts`,
      lastModified: new Date().toISOString().split('T')[0],
    });
  });

  return sitemapData;
}