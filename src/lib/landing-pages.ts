import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkBreaks from 'remark-breaks';

// Types
export interface LandingPage {
  slug: string;
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  updatedAt: string;
  author?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  keywords?: string[];
  category?: string;
}

export interface LandingTemplate {
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

export interface GeneratedLandingPage extends LandingPage {
  templateName: string;
  variables: Record<string, any>;
  isGenerated: true;
}

// Paths
const LANDING_PAGES_PATH = path.join(process.cwd(), 'content/landing-pages/pages');
const LANDING_TEMPLATES_PATH = path.join(process.cwd(), 'content/landing-pages/templates');
const LANDING_DATA_PATH = path.join(process.cwd(), 'content/landing-pages/landing-data.json');

// Reserved route names that should not be used for landing pages
const RESERVED_ROUTES = [
  'app',
  'blog',
  'login',
  'api',
  'app-mock',
  '_next',
  'fonts',
  'images',
  'admin',
  'dashboard'
];

// Utility functions
function processMarkdown(content: string): string {
  const processedHtml = remark()
    .use(remarkBreaks)
    .use(html, { sanitize: false, allowDangerousHtml: true })
    .processSync(content);

  let htmlString = processedHtml.toString();

  // Remove the first H1 heading to avoid duplication
  htmlString = htmlString.replace(/^<h1[^>]*>.*?<\/h1>\s*/i, '');

  return htmlString;
}

// Cache for generated landing page metadata
let cachedGeneratedLandingPagesMetadata: LandingPage[] | null = null;

// Reset cache for development
export function resetGeneratedLandingPagesCache(): void {
  cachedGeneratedLandingPagesMetadata = null;
}

// Get metadata for generated landing pages (lightweight version for listing)
export function getGeneratedLandingPagesMetadata(): LandingPage[] {
  if (cachedGeneratedLandingPagesMetadata) {
    return cachedGeneratedLandingPagesMetadata;
  }

  const generatedPages: LandingPage[] = [];

  // TODO: Add your programmatic landing page generation logic here
  // Example patterns:
  // - Chart type landing pages: `${chartType}-generator`
  // - Alternative pages: `${competitor}-alternative`
  // - Feature pages: `${feature}-tool`

  cachedGeneratedLandingPagesMetadata = generatedPages;
  return generatedPages;
}

// Get all landing pages (including generated ones)
export async function getAllLandingPages(): Promise<LandingPage[]> {
  const regularPages: LandingPage[] = [];

  // Get regular markdown landing pages
  if (fs.existsSync(LANDING_PAGES_PATH)) {
    const files = fs.readdirSync(LANDING_PAGES_PATH);
    const pages = await Promise.all(
      files
        .filter((file) => file.endsWith('.md'))
        .map(async (file) => {
          const slug = file.replace('.md', '');
          return await getLandingPageBySlug(slug);
        })
        .filter(Boolean)
    );
    regularPages.push(...pages.filter((page): page is LandingPage => page !== null));
  }

  // Get lightweight metadata for generated pages
  const generatedPages = getGeneratedLandingPagesMetadata();

  // Combine all pages and filter out reserved routes
  const allPages = [...regularPages, ...generatedPages].filter(
    page => !RESERVED_ROUTES.includes(page.slug)
  );

  return allPages.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

// Get single landing page by slug
export async function getLandingPageBySlug(slug: string): Promise<LandingPage | null> {
  // Check if slug is a reserved route
  if (RESERVED_ROUTES.includes(slug)) {
    return null;
  }

  try {
    const fullPath = path.join(LANDING_PAGES_PATH, `${slug}.md`);

    if (!fs.existsSync(fullPath)) {
      // Try generated pages
      return await getGeneratedLandingPageBySlug(slug);
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const processedContent = processMarkdown(content);

    return {
      slug,
      title: data.title,
      description: data.description,
      content: processedContent,
      publishedAt: data.publishedAt,
      updatedAt: data.updatedAt,
      author: data.author,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      ogImage: data.ogImage,
      keywords: data.keywords || [],
      category: data.category,
    };
  } catch (error) {
    console.error(`Error reading landing page ${slug}:`, error);
    return null;
  }
}

// Template processing functions
export function loadLandingData(): any {
  try {
    if (!fs.existsSync(LANDING_DATA_PATH)) {
      return {};
    }
    const landingDataContents = fs.readFileSync(LANDING_DATA_PATH, 'utf8');
    return JSON.parse(landingDataContents);
  } catch (error) {
    console.error('Error loading landing data:', error);
    return {};
  }
}

export function getLandingTemplate(templateName: string): LandingTemplate | null {
  try {
    const fullPath = path.join(LANDING_TEMPLATES_PATH, `${templateName}.md`);

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
    console.error(`Error reading landing template ${templateName}:`, error);
    return null;
  }
}

// Generate landing page from template
export async function generateLandingPageFromTemplate(
  templateName: string,
  variables: Record<string, any>
): Promise<GeneratedLandingPage | null> {
  const template = getLandingTemplate(templateName);
  if (!template) return null;

  const landingData = loadLandingData();
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
        const lookupData = landingData[variable.lookup || ''] || {};
        const keyValue = variable.keyParam ? variables[variable.keyParam] : (variable.key || variables[variable.name]);

        if (variable.subKey || variable.subKeyParam) {
          const keyData = lookupData[keyValue] || {};
          const subKeyValue = variable.subKeyParam ? variables[variable.subKeyParam] : variable.subKey;
          value = keyData[subKeyValue] || '';
        } else {
          value = lookupData[keyValue] || '';
        }
        break;
      case 'static':
        value = variable.value || '';
        break;
      case 'custom_section':
        const sectionName = variable.name.replace('customSection:', '');
        value = getCustomSectionContent(templateName, sectionName, variables, landingData);
        break;
    }

    const placeholder = `{${variable.name}}`;
    generatedContent = generatedContent.replace(new RegExp(placeholder, 'g'), value);
  }

  // Process custom section placeholders
  const customSectionPattern = /\{customSection:([^}]+)\}/g;
  generatedContent = generatedContent.replace(customSectionPattern, (match, sectionName) => {
    return getCustomSectionContent(templateName, sectionName, variables, landingData);
  });

  // Extract title from content (first H1)
  const titleMatch = generatedContent.match(/^# (.+)$/m);
  generatedTitle = titleMatch ? titleMatch[1] : variables.title || 'Landing Page';

  // Generate slug based on template type
  if (templateName === 'chart-type-landing-template') {
    generatedSlug = `${variables.chartType}-generator`;
  } else if (templateName === 'alternative-landing-template') {
    generatedSlug = `${variables.competitor}-alternative`;
  } else {
    generatedSlug = variables.slug || 'landing-page';
  }

  // Check if slug is reserved
  if (RESERVED_ROUTES.includes(generatedSlug)) {
    console.error(`Cannot generate landing page with reserved slug: ${generatedSlug}`);
    return null;
  }

  // Process markdown to HTML
  const processedContent = processMarkdown(generatedContent);

  // Generate SEO meta
  const metaTitle = variables.metaTitle || `${generatedTitle} | chartz.ai`;
  const metaDescription = variables.metaDescription || variables.description || 'Create stunning visualizations with AI-powered chart generation.';
  const ogImage = variables.ogImage || '/landing/images/default.png';

  return {
    slug: generatedSlug,
    title: generatedTitle,
    description: variables.description || metaDescription,
    content: processedContent,
    publishedAt: variables.publishedAt || '2024-01-15',
    updatedAt: variables.updatedAt || '2024-01-15',
    metaTitle,
    metaDescription,
    ogImage,
    keywords: variables.keywords || [],
    category: variables.category,
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
    case 'display_name':
      const displayMap: Record<string, string> = {
        'tableau': 'Tableau',
        'powerbi': 'Power BI',
        'looker-studio': 'Looker Studio',
        'excel': 'Microsoft Excel',
      };
      return displayMap[input] || input;
    default:
      return input;
  }
}

// Get custom section content with fallback hierarchy
function getCustomSectionContent(
  templateName: string,
  sectionName: string,
  variables: Record<string, any>,
  landingData: any
): string {
  const customSections = landingData.customSections || {};
  const templateSections = customSections[templateName] || {};
  const sections = templateSections.sections || {};
  const section = sections[sectionName] || {};

  let content = '';

  // Try specific override or default
  if (section.overrides && variables.chartType && section.overrides[variables.chartType]) {
    content = section.overrides[variables.chartType];
  } else if (section.default) {
    content = section.default;
  } else {
    content = `**Section ${sectionName} not configured**`;
  }

  // Process any variable placeholders in the custom section content
  content = processVariablesInContent(content, variables, landingData);

  return content;
}

// Process variable placeholders in content
function processVariablesInContent(
  content: string,
  variables: Record<string, any>,
  landingData: any
): string {
  return content.replace(/\{([^}]+)\}/g, (match, varName) => {
    if (variables[varName] !== undefined) {
      return variables[varName];
    }
    if (landingData[varName]) {
      const key = variables[varName] || varName;
      return landingData[varName][key] || match;
    }
    return match;
  });
}

// Get generated landing page by slug
export async function getGeneratedLandingPageBySlug(slug: string): Promise<GeneratedLandingPage | null> {
  // Check if slug is reserved
  if (RESERVED_ROUTES.includes(slug)) {
    return null;
  }

  // TODO: Add your slug pattern matching logic here
  // Example patterns:
  // - const chartGeneratorMatch = slug.match(/^(.+)-generator$/);
  // - const alternativeMatch = slug.match(/^(.+)-alternative$/);
  // Then call generateLandingPageFromTemplate with appropriate template and variables

  return null;
}
