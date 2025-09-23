import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkBreaks from 'remark-breaks';

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
  keyParam?: string;
  subKey?: string;
  subKeyParam?: string;
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
const VCHART_SPECS_PATH = path.join(process.cwd(), 'content/blog/vchart-specs');

// Utility functions
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function processMarkdown(content: string): string {
  const processedHtml = remark()
    .use(remarkBreaks) // Preserve line breaks
    .use(html, { sanitize: false }) // Allow all HTML but keep it simple
    .processSync(content);
  return processedHtml.toString();
}

// Load VChart specification from TypeScript file
async function loadVChartSpec(chartType: string): Promise<string> {
  try {
    const specFilePath = path.join(VCHART_SPECS_PATH, `${chartType}.ts`);
    
    if (!fs.existsSync(specFilePath)) {
      return `// VChart specification for ${chartType} not found`;
    }

    // Read the TypeScript file content
    const fileContent = fs.readFileSync(specFilePath, 'utf8');
    
    // Extract the codeString export using regex
    const codeStringMatch = fileContent.match(/export const codeString = `([\s\S]*?)`/);
    
    if (codeStringMatch) {
      return codeStringMatch[1];
    }
    
    // Fallback: try to extract just the spec object
    const specMatch = fileContent.match(/export const spec = ({[\s\S]*?});/);
    if (specMatch) {
      return `const spec = ${specMatch[1]};`;
    }
    
    return `// Unable to parse VChart specification for ${chartType}`;
  } catch (error) {
    console.error(`Error loading VChart spec for ${chartType}:`, error);
    return `// Error loading VChart specification for ${chartType}`;
  }
}

// Get all blog posts (including generated posts)
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const regularPosts: BlogPost[] = [];
  
  // Get regular markdown posts
  if (fs.existsSync(BLOG_POSTS_PATH)) {
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
    regularPosts.push(...posts.filter((post): post is BlogPost => post !== null));
  }

  // Get generated competitor tutorial posts
  const competitors = ['tableau', 'powerbi', 'looker-studio'];
  const competitorChartTypes = ['pie-chart', 'donut-chart', 'stacked-bar-chart', 'heat-map', 'scatter-plot', 'line-chart', 'histogram-chart'];
  const generatedPosts: BlogPost[] = [];
  
  for (const competitor of competitors) {
    for (const chartType of competitorChartTypes) {
      const slug = `how-to-create-${chartType}-in-${competitor}`;
      const post = await getGeneratedPostBySlug(slug);
      if (post) {
        generatedPosts.push(post);
      }
    }
  }

  // Combine all posts and sort by publishedAt date (newest first)
  const allPosts = [...regularPosts, ...generatedPosts];
  return allPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
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
export async function generatePostFromTemplate(
  templateName: string,
  variables: Record<string, any>
): Promise<GeneratedPost | null> {
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
        
        // Determine the key value (use keyParam to reference a parameter, or key for static)
        const keyValue = variable.keyParam ? variables[variable.keyParam] : (variable.key || variables[variable.name]);
        
        if (variable.subKey || variable.subKeyParam) {
          // Handle nested lookup (e.g., competitorInfo.tableau.displayName)
          const keyData = lookupData[keyValue] || {};
          const subKeyValue = variable.subKeyParam ? variables[variable.subKeyParam] : variable.subKey;
          value = keyData[subKeyValue] || '';
          
          // Debug logging
          console.log(`Lookup debug: lookup=${variable.lookup}, keyValue=${keyValue}, subKeyValue=${subKeyValue}, value=${value}`);
        } else {
          value = lookupData[keyValue] || '';
          
          // Debug logging
          console.log(`Lookup debug: lookup=${variable.lookup}, keyValue=${keyValue}, value=${value}`);
        }
        break;
      case 'static':
        value = variable.value || '';
        break;
    }

    // No special handling needed - all variables use standard processing

    // Replace all occurrences of the variable in content
    const placeholder = `{${variable.name}}`;
    generatedContent = generatedContent.replace(new RegExp(placeholder, 'g'), value);
  }

  // Extract title from content (first H1)
  const titleMatch = generatedContent.match(/^# (.+)$/m);
  generatedTitle = titleMatch ? titleMatch[1] : `${variables.chartTypeDisplay || variables.chartType} Chart Guide`;

  // Generate slug based on template type
  if (templateName === 'competitor-tutorial-template') {
    generatedSlug = `how-to-create-${variables.chartType}-in-${variables.competitor}`;
  } else {
    generatedSlug = `how-to-create-${variables.chartType}-charts`;
  }

  // Process markdown to HTML
  const processedContent = processMarkdown(generatedContent);
  const readingTime = calculateReadingTime(generatedContent);

  // Generate SEO meta
  let metaTitle, metaDescription, ogImage;
  
  if (templateName === 'competitor-tutorial-template') {
    metaTitle = `How to Create ${variables.chartTypeDisplay} in ${chartData.competitorInfo?.[variables.competitor]?.displayName || variables.competitor} | chartz.ai`;
    metaDescription = `Learn how to create ${variables.chartTypeDisplay} charts in ${chartData.competitorInfo?.[variables.competitor]?.displayName || variables.competitor}. See why chartz.ai is faster and easier.`;
    
    // Map chart types to available images
    const chartImageMap: Record<string, string> = {
      'pie-chart': 'pie-chart.png',
      'donut-chart': 'donut-chart.png',
      'stacked-bar-chart': 'stacked-bar-chart.png',
      'heat-map': 'heatmap-chart.png',
      'scatter-plot': 'scatter-chart.png',
      'line-chart': 'line-chart.png',
      'histogram-chart': 'histogram-chart.png'
    };
    
    ogImage = `/blog/images/${chartImageMap[variables.chartType] || 'pie-chart.png'}`;
  } else {
    metaTitle = `Create ${variables.chartTypeDisplay || variables.chartType} Charts with AI | chartz.ai`;
    metaDescription = `Learn how to create beautiful ${variables.chartTypeDisplay || variables.chartType} charts using AI. Step-by-step guide with examples and best practices.`;
    
    // Map chart types to available images for regular chart guides
    const chartImageMap: Record<string, string> = {
      'pie': 'pie-chart.png',
      'donut': 'donut-chart.png',
      'bar': 'stacked-bar-chart.png',
      'heatmap': 'heatmap-chart.png',
      'scatter': 'scatter-chart.png',
      'line': 'line-chart.png',
      'histogram': 'histogram-chart.png'
    };
    
    ogImage = `/blog/images/${chartImageMap[variables.chartType] || 'pie-chart.png'}`;
  }

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
    ogImage,
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
      return input.replace(/-/g, ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    case 'chart_image':
      // Map chart types to their corresponding image filenames
      const chartImageMap: Record<string, string> = {
        'pie-chart': 'pie-chart.png',
        'donut-chart': 'donut-chart.png',
        'stacked-bar-chart': 'stacked-bar-chart.png',
        'heat-map': 'heatmap-chart.png',
        'scatter-plot': 'scatter-chart.png',
        'line-chart': 'line-chart.png',
        'histogram-chart': 'histogram-chart.png'
      };
      return chartImageMap[input] || 'pie-chart.png';
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
    return await generatePostFromTemplate('chart-guide-template', { 
      chartType,
      chartTypeDisplay: transformValue(chartType, 'capitalize')
    });
  }

  // Check if it's a competitor tutorial (e.g., "how-to-create-pie-chart-in-tableau")
  const competitorMatch = slug.match(/^how-to-create-(.+)-in-(.+)$/);
  if (competitorMatch) {
    const chartType = competitorMatch[1];
    const competitor = competitorMatch[2];
    return await generatePostFromTemplate('competitor-tutorial-template', { 
      chartType,
      competitor,
      chartTypeDisplay: transformValue(chartType, 'title_case')
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

