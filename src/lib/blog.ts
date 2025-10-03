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
  source: 'parameter' | 'lookup' | 'transform' | 'static' | 'custom_section';
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
    .use(html, { sanitize: false, allowDangerousHtml: true }) // Allow all HTML including dangerous
    .processSync(content);

  let htmlString = processedHtml.toString();

  // Remove the first H1 heading to avoid duplication (since we display the title separately)
  htmlString = htmlString.replace(/^<h1[^>]*>.*?<\/h1>\s*/i, '');

  return htmlString;
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

// Cache for generated post metadata to avoid expensive regeneration
let cachedGeneratedPostsMetadata: BlogPost[] | null = null;

// Reset cache for development
export function resetGeneratedPostsCache(): void {
  cachedGeneratedPostsMetadata = null;
}

// Get metadata for generated posts (lightweight version for listing)
export function getGeneratedPostsMetadata(): BlogPost[] {
  if (cachedGeneratedPostsMetadata) {
    return cachedGeneratedPostsMetadata;
  }

  const competitors = ['tableau', 'powerbi', 'looker-studio', 'excel'];
  const competitorChartTypes = ['pie-chart', 'donut-chart', 'stacked-bar-chart', 'heat-map', 'scatter-plot', 'line-chart', 'histogram-chart'];
  const generatedPosts: BlogPost[] = [];

  // Generate competitor chart tutorial posts
  for (const competitor of competitors) {
    for (const chartType of competitorChartTypes) {
      const slug = `how-to-create-${chartType}-in-${competitor}`;
      const chartTypeDisplay = transformValue(chartType, 'title_case');
      const competitorDisplay = transformValue(competitor, 'display_name');

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

      generatedPosts.push({
        slug,
        title: `How to Create ${chartTypeDisplay} in ${competitorDisplay} | chartz.ai`,
        excerpt: `Learn how to create ${chartTypeDisplay.toLowerCase()} in ${competitorDisplay}. Compare traditional methods vs AI-powered chart creation with chartz.ai.`,
        content: '', // Empty for metadata-only
        publishedAt: '2024-01-15',
        updatedAt: '2024-01-15',
        author: 'chartz.ai team',
        category: 'Chart Tutorials',
        tags: [competitor, chartType.replace('-chart', ''), 'tutorial'],
        featured: false,
        ogImage: `/blog/images/${chartImageMap[chartType] || 'pie-chart.png'}`,
        readingTime: 8
      });
    }
  }

  // Generate dashboard tutorial posts
  const dashboardTools = ['tableau', 'powerbi', 'looker-studio', 'excel', 'sql', 'python', 'r'];
  for (const tool of dashboardTools) {
    const slug = `how-to-create-dashboard-in-${tool}`;
    const toolDisplay = transformValue(tool, 'display_name');

    generatedPosts.push({
      slug,
      title: `How to Create a Dashboard in ${toolDisplay} | chartz.ai`,
      excerpt: `Learn how to build dashboards in ${toolDisplay}. Discover why AI-powered dashboard creation with chartz.ai is faster and simpler.`,
      content: '', // Empty for metadata-only
      publishedAt: '2025-10-03',
      updatedAt: '2025-10-03',
      author: 'chartz.ai team',
      category: 'Dashboard Tutorials',
      tags: [tool, 'dashboard', 'tutorial'],
      featured: false,
      ogImage: '/blog/images/dashboard.png',
      readingTime: 10
    });
  }

  // Add chart guide posts
  const chartTypes = ['pie', 'bar', 'line', 'scatter', 'area', 'column', 'donut', 'heatmap', 'funnel', 'gauge', 'histogram'];
  for (const chartType of chartTypes) {
    const slug = `how-to-create-${chartType}-charts`;
    const chartTypeDisplay = transformValue(chartType, 'capitalize');

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

    generatedPosts.push({
      slug,
      title: `How to Create ${chartTypeDisplay} Charts with AI | chartz.ai`,
      excerpt: `Discover how to create stunning ${chartTypeDisplay.toLowerCase()} charts using AI. Learn best practices, use cases, and get instant results with chartz.ai.`,
      content: '', // Empty for metadata-only
      publishedAt: '2024-01-10',
      updatedAt: '2024-01-10',
      author: 'chartz.ai team',
      category: 'Chart Creation',
      tags: [chartType, 'ai', 'tutorial'],
      featured: false,
      ogImage: `/blog/images/${chartImageMap[chartType] || 'pie-chart.png'}`,
      readingTime: 6
    });
  }

  cachedGeneratedPostsMetadata = generatedPosts;
  return generatedPosts;
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

  // Get lightweight metadata for generated posts (no content generation)
  const generatedPosts = getGeneratedPostsMetadata();

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

    // Process blog blocks in regular posts
    const contentWithBlocks = processBlocks(content);

    const processedContent = processMarkdown(contentWithBlocks);
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

// Get all available categories (optimized)
export async function getAllCategories(): Promise<string[]> {
  const allPosts = await getAllBlogPosts();
  const categories = new Set(allPosts.map(post => post.category).filter(Boolean));
  return Array.from(categories).sort();
}

// Get all available tags (optimized)
export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllBlogPosts();
  const tags = new Set(allPosts.flatMap(post => post.tags || []).filter(Boolean));
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
      case 'custom_section':
        const sectionName = variable.name.replace('customSection:', '');
        value = getCustomSectionContent(templateName, sectionName, variables, chartData);
        break;
    }

    // No special handling needed - all variables use standard processing

    // Replace all occurrences of the variable in content
    const placeholder = `{${variable.name}}`;
    generatedContent = generatedContent.replace(new RegExp(placeholder, 'g'), value);
  }

  // Process custom section placeholders (e.g., {customSection:stepByStepGuide})
  const customSectionPattern = /\{customSection:([^}]+)\}/g;
  generatedContent = generatedContent.replace(customSectionPattern, (match, sectionName) => {
    return getCustomSectionContent(templateName, sectionName, variables, chartData);
  });

  // Extract title from content (first H1)
  const titleMatch = generatedContent.match(/^# (.+)$/m);
  generatedTitle = titleMatch ? titleMatch[1] : `${variables.chartTypeDisplay || variables.chartType} Chart Guide`;

  // Generate slug based on template type
  if (templateName === 'competitor-tutorial-template') {
    generatedSlug = `how-to-create-${variables.chartType}-in-${variables.competitor}`;
  } else if (templateName === 'dashboard-tutorial-template') {
    generatedSlug = `how-to-create-dashboard-in-${variables.tool}`;
  } else {
    generatedSlug = `how-to-create-${variables.chartType}-charts`;
  }

  // Process blog blocks before markdown conversion
  generatedContent = processBlocks(generatedContent, variables);

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
  } else if (templateName === 'dashboard-tutorial-template') {
    metaTitle = `How to Create a Dashboard in ${variables.toolDisplay || variables.tool} | chartz.ai`;
    metaDescription = `Learn how to build dashboards in ${variables.toolDisplay || variables.tool}. Discover why AI-powered dashboard creation with chartz.ai is faster and simpler.`;
    ogImage = '/blog/images/dashboard.png';
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

  // Set dates based on template type
  let publishedAt, updatedAt;
  if (templateName === 'dashboard-tutorial-template') {
    publishedAt = '2025-10-03';
    updatedAt = '2025-10-03';
  } else if (templateName === 'competitor-tutorial-template') {
    publishedAt = '2024-01-15';
    updatedAt = '2024-01-15';
  } else {
    // chart-guide-template
    publishedAt = '2024-01-10';
    updatedAt = '2024-01-10';
  }

  return {
    slug: generatedSlug,
    title: generatedTitle,
    excerpt: `Complete guide to creating ${variables.chartTypeDisplay || variables.chartType} charts with AI-powered data visualization.`,
    content: processedContent,
    publishedAt,
    updatedAt,
    author: 'chartz.ai Team',
    category: 'chart-tutorials',
    tags: ['charts', 'AI', 'tutorial', variables.chartType || variables.tool],
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
    case 'display_name':
      // Map competitor/tool keys to display names
      const competitorDisplayMap: Record<string, string> = {
        'tableau': 'Tableau',
        'powerbi': 'Power BI',
        'looker-studio': 'Looker Studio',
        'excel': 'Microsoft Excel',
        'sql': 'SQL',
        'python': 'Python',
        'r': 'R'
      };
      return competitorDisplayMap[input] || input;
    default:
      return input;
  }
}

// Get custom section content with fallback hierarchy
function getCustomSectionContent(
  templateName: string,
  sectionName: string,
  variables: Record<string, any>,
  chartData: any
): string {
  const customGuides = chartData.customGuides || {};
  const templateGuides = customGuides[templateName] || {};
  const sections = templateGuides.sections || {};
  const section = sections[sectionName] || {};

  // Priority order: specific override -> competitor default -> template default
  const competitor = variables.competitor;
  const chartType = variables.chartType;

  let content = '';

  // 1. Try specific override (competitor + chartType)
  if (section.overrides && section.overrides[competitor] && section.overrides[competitor][chartType]) {
    content = section.overrides[competitor][chartType];
  }
  // 2. Try competitor default
  else if (section.overrides && section.overrides[competitor] && section.overrides[competitor].default) {
    content = section.overrides[competitor].default;
  }
  // 3. Use template default
  else if (section.default) {
    content = section.default;
  }
  // 4. Fallback message
  else {
    content = `**Section ${sectionName} not found**\n\nPlease configure this section in customGuides.${templateName}.sections.${sectionName}`;
  }

  // Process any variable placeholders in the custom section content
  content = processVariablesInContent(content, variables, chartData);

  return content;
}

// Process variable placeholders in content
function processVariablesInContent(
  content: string,
  variables: Record<string, any>,
  chartData: any
): string {
  // Replace all {variableName} placeholders
  return content.replace(/\{([^}]+)\}/g, (match, varName) => {
    // First check if it's a direct variable
    if (variables[varName] !== undefined) {
      return variables[varName];
    }

    // Check if it's competitorSteps - special nested lookup
    if (varName === 'competitorSteps') {
      const competitor = variables.competitor;
      const chartType = variables.chartType;
      const steps = chartData.competitorSteps?.[competitor]?.[chartType];
      if (steps) return steps;
    }

    // Check if it's any other chartData lookup
    // Try direct lookup first
    if (chartData[varName]) {
      const key = variables[varName] || varName;
      return chartData[varName][key] || match;
    }

    // Keep the placeholder if we can't resolve it
    return match;
  });
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

  // Check if it's a dashboard tutorial (e.g., "how-to-create-dashboard-in-sql")
  const dashboardMatch = slug.match(/^how-to-create-dashboard-in-(.+)$/);
  if (dashboardMatch) {
    const tool = dashboardMatch[1];
    return await generatePostFromTemplate('dashboard-tutorial-template', {
      tool,
      toolDisplay: transformValue(tool, 'display_name')
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

// Blog block processing functions
function processBlocks(content: string, variables: Record<string, any> = {}): string {
  const chartData = loadChartData();

  // Process combined Why Chartz blocks with features: {whyChartzSection:dataVisualization}
  content = content.replace(/\{whyChartzSection:([^}:]+)(?::([^}]+))?\}/g, (match, blockType, featuresParam) => {
    const block = chartData.blogBlocks?.whyChartzBlocks?.[blockType];
    if (!block) return match;

    const selectedVariation = selectVariation(block.variations, 'random');

    // Get 3 random features (or specified features)
    const allFeatures = Object.keys(chartData.blogBlocks?.featureBlocks || {});
    let selectedFeatures;

    if (featuresParam && featuresParam !== 'random') {
      // Parse specific features: "feature1,feature2,feature3"
      selectedFeatures = featuresParam.split(',').slice(0, 3);
    } else {
      // Select 3 random features
      const shuffled = allFeatures.sort(() => 0.5 - Math.random());
      selectedFeatures = shuffled.slice(0, 3);
    }

    // Generate feature blocks as markdown
    const featureBlocksMarkdown = selectedFeatures.map((featureType: string) => {
      const feature = chartData.blogBlocks?.featureBlocks?.[featureType];
      if (!feature) return '';

      const selectedFeatureVariation = selectFeatureVariation(feature.variations, 'random');
      if (!selectedFeatureVariation) return '';

      const benefitsList = selectedFeatureVariation.benefits.map((benefit: string) => `- ${benefit}`).join('\n');
      const imageMarkdown = feature.image ? `\n![${feature.imageAlt || feature.title}](${feature.image})\n` : '';

      return `
### ${feature.icon} ${feature.title}
${imageMarkdown}
#### ${selectedFeatureVariation.headline}

${selectedFeatureVariation.description}

${benefitsList}
`;
    }).join('\n');

    return `
## ${block.title}

${block.intro}

**${selectedVariation}**

${featureBlocksMarkdown}
`;
  });

  // Keep individual Why Chartz blocks for backward compatibility: {whyChartzBlock:dataVisualization}
  content = content.replace(/\{whyChartzBlock:([^}:]+)(?::([^}]+))?\}/g, (match, blockType, variation) => {
    const block = chartData.blogBlocks?.whyChartzBlocks?.[blockType];
    if (!block) return match;

    const selectedVariation = selectVariation(block.variations, variation);

    return `
### ${block.title}

${block.intro}

${selectedVariation}
`;
  });

  // Process feature blocks: {featureBlock:zeroLearningCurve:1}
  content = content.replace(/\{featureBlock:([^}:]+)(?::([^}]+))?\}/g, (match, featureType, variation) => {
    const feature = chartData.blogBlocks?.featureBlocks?.[featureType];
    if (!feature) return match;

    const selectedVariation = selectFeatureVariation(feature.variations, variation);
    if (!selectedVariation) return match;

    const benefitsList = selectedVariation.benefits.map((benefit: string) => `- ${benefit}`).join('\n');
    const imageMarkdown = feature.image ? `\n![${feature.imageAlt || feature.title}](${feature.image})\n` : '';

    return `
#### ${feature.icon} ${feature.title}
${imageMarkdown}
##### ${selectedVariation.headline}

${selectedVariation.description}

${benefitsList}
`;
  });

  // Process variable-based blocks: {whyChartzBlock:${useCase}}
  content = content.replace(/\{whyChartzBlock:\$\{([^}]+)\}(?::([^}]+))?\}/g, (match, variableName, variation) => {
    const blockType = variables[variableName];
    if (!blockType) return match;

    const block = chartData.blogBlocks?.whyChartzBlocks?.[blockType];
    if (!block) return match;

    const selectedVariation = selectVariation(block.variations, variation);

    return `
### ${block.title}

${block.intro}

${selectedVariation}
`;
  });

  // Process variable-based feature blocks: {featureBlock:${feature}:random}
  content = content.replace(/\{featureBlock:\$\{([^}]+)\}(?::([^}]+))?\}/g, (match, variableName, variation) => {
    const featureType = variables[variableName];
    if (!featureType) return match;

    const feature = chartData.blogBlocks?.featureBlocks?.[featureType];
    if (!feature) return match;

    const selectedVariation = selectFeatureVariation(feature.variations, variation);
    if (!selectedVariation) return match;

    const benefitsList = selectedVariation.benefits.map((benefit: string) => `- ${benefit}`).join('\n');
    const imageMarkdown = feature.image ? `\n![${feature.imageAlt || feature.title}](${feature.image})\n` : '';

    return `
#### ${feature.icon} ${feature.title}
${imageMarkdown}
##### ${selectedVariation.headline}

${selectedVariation.description}

${benefitsList}
`;
  });

  return content;
}

function selectVariation(variations: string[], variationParam?: string): string {
  if (!variations || variations.length === 0) return '';

  if (!variationParam || variationParam === 'random') {
    // Select random variation
    return variations[Math.floor(Math.random() * variations.length)];
  }

  // Select specific variation by index
  const index = parseInt(variationParam);
  if (!isNaN(index) && index >= 0 && index < variations.length) {
    return variations[index];
  }

  // Default to first variation
  return variations[0];
}

function selectFeatureVariation(variations: any[], variationParam?: string): any {
  if (!variations || variations.length === 0) return null;

  if (!variationParam || variationParam === 'random') {
    // Select random variation
    return variations[Math.floor(Math.random() * variations.length)];
  }

  // Select specific variation by index
  const index = parseInt(variationParam);
  if (!isNaN(index) && index >= 0 && index < variations.length) {
    return variations[index];
  }

  // Default to first variation
  return variations[0];
}

