# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- **Development server**: `npm run dev` - Starts Next.js development server on http://localhost:3000
- **Build**: `npm run build` - Creates production build
- **Production server**: `npm run start` - Starts production server (requires build first)
- **Linting**: `npm run lint` - Runs Next.js ESLint configuration

## Architecture Overview

### Project Structure
This is a **Next.js 14 App Router** project with **AWS Amplify** backend integration for AI-powered chart generation.

**Frontend Stack:**
- Next.js 14 with App Router (`src/app/` directory structure)
- TypeScript with strict configuration
- Tailwind CSS for styling
- Visx for data visualization components
- Framer Motion for animations
- Geist font family (locally loaded)

**Backend Stack:**
- AWS Amplify with API Gateway
- PostgreSQL database (AWS RDS) for data storage
- Lambda functions:
  - `chartgenerator` - AI chart generation using LangGraph
  - `customers` - User profile management (create, get, update)
  - `datasets` - CSV file upload, S3 storage, and database ingestion
  - `stripecheckout` - Payment processing (Stripe integration)

### Key Directories
- `src/app/` - Next.js App Router pages and components
  - `api/generate-chart/route.ts` - API route that proxies to AWS Lambda
  - `lib/api.ts` - Client-side API utilities and types
  - `components/` - React components (currently empty)
- `amplify/` - AWS Amplify configuration and Lambda functions
  - `backend/function/chartgenerator/` - Lambda function for chart generation
  - `backend/function/customers/` - Lambda function for user management
  - `backend/function/datasets/` - Lambda function for CSV upload and ingestion
  - `backend/function/stripecheckout/` - Lambda function for payment processing
- `database_schema.sql` - PostgreSQL schema for user profiles, datasets, and charts
- `migration_remove_monitoring.sql` - Migration script to simplify existing database

### API Flow

**Chart Generation:**
1. Frontend calls `/api/generate-chart` with user message
2. Next.js API route forwards to AWS API Gateway (`chartistryapi`)
3. API Gateway triggers Lambda function (`chartgenerator`)
4. Lambda uses Langgraph to generate chart code
5. Response flows back through the chain

**Dataset Management:**
1. Frontend requests upload URL from `datasets` lambda
2. Lambda generates presigned S3 URL and creates database record
3. Frontend uploads CSV directly to S3 using presigned URL
4. Frontend triggers ingestion via `datasets` lambda
5. Lambda downloads CSV from S3, creates dynamic table, and populates data

**User Management:**
- `customers` lambda handles user profile CRUD operations
- Integrates with authentication system for user identification

### Configuration Files
- `amplifyconfiguration.json` - AWS Amplify configuration (API Gateway endpoint)
- `aws-exports.js` - Additional AWS configuration
- TypeScript path aliases: `@/*` maps to `./src/*`
- Tailwind configured for `src/` directory structure

### Development Notes
- Amplify is configured for SSR in the API route
- CORS is handled in the API route OPTIONS method
- Error handling includes both client and server-side error types
- Database uses PostgreSQL with dynamic table creation for CSV data
- S3 integration for file storage with presigned URLs

### Lambda Debugging Commands

To view real-time execution logs for the Lambda functions:

**Windows (PowerShell):**
```powershell
# Chart generation lambda logs
powershell -Command "aws logs tail '/aws/lambda/chartgenerator-dev' --region eu-west-2 --since 5m"

# Payment processing lambda logs  
powershell -Command "aws logs tail '/aws/lambda/stripecheckoutchartz-dev' --region eu-west-2 --since 5m"

# User management lambda logs
powershell -Command "aws logs tail '/aws/lambda/customerschartz-dev' --region eu-west-2 --since 5m"

# Dataset upload/ingestion lambda logs
powershell -Command "aws logs tail '/aws/lambda/datasets-dev' --region eu-west-2 --since 10m"
```

**Unix/Linux/MacOS:**
```bash
# Chart generation lambda logs
aws logs tail /aws/lambda/chartgenerator-dev --region eu-west-2 --since 5m

# Payment processing lambda logs  
aws logs tail /aws/lambda/stripecheckoutchartz-dev --region eu-west-2 --since 5m

# User management lambda logs
aws logs tail /aws/lambda/customerschartz-dev --region eu-west-2 --since 5m

# Dataset upload/ingestion lambda logs
aws logs tail /aws/lambda/datasets-dev --region eu-west-2 --since 5m
```

Use `--since` parameter to control time range (e.g., `1h`, `30m`, `5m`)

## Blog System & Programmatic SEO

### Blog Architecture Overview

The blog system implements a hybrid approach combining traditional markdown posts with programmatically generated SEO content:

**Blog Structure:**
- `src/app/blog/` - Next.js App Router pages for blog functionality
- `content/blog/` - Content repository with posts, templates, and data
- `src/lib/blog.ts` - Core blog logic and template processing engine

### Directory Structure

```
src/app/blog/
├── page.tsx                    # Main blog listing page
├── [slug]/page.tsx             # Dynamic blog post pages (handles both regular and generated posts)
├── category/[category]/page.tsx # Category-based post filtering
└── tag/[tag]/page.tsx          # Tag-based post filtering

content/blog/
├── posts/                     # Regular markdown blog posts
├── templates/                 # SEO content templates
├── vchart-specs/              # VChart TypeScript specifications
└── chart-data.json            # Centralized data for template generation
```

### Programmatic SEO Implementation

The blog system generates hundreds of SEO-optimized pages using templates and data:

#### 1. Template System
Two main templates drive pSEO content generation:

**Chart Guide Template (`chart-guide-template.md`)**
- Generates guides like "How to Create Pie Charts with AI"
- URL pattern: `/blog/how-to-create-{chartType}-charts`
- Covers 10+ chart types (pie, bar, line, scatter, etc.)

**Competitor Tutorial Template (`competitor-tutorial-template.md`)**
- Generates comparison content like "How to Create Pie Charts in Tableau"
- URL pattern: `/blog/how-to-create-{chartType}-in-{competitor}`
- Covers 3 competitors × 7 chart types = 21 generated posts per competitor

#### 2. Data-Driven Content Generation

**Central Data File (`chart-data.json`)**
Contains structured data for template variables:
- `chartDescriptions` - Technical definitions for each chart type
- `chartUseCases` - Business use cases and applications
- `chartWhenToUse` - Detailed guidance on appropriate usage
- `chartExamples` - Practical examples with titles, descriptions, and prompts
- `competitorInfo` - Competitor details (name, cost, type)
- `competitorSteps` - Step-by-step instructions for each tool
- `competitorComplexity` - Detailed explanations of why each tool is complex

#### 3. Template Processing Engine

**Variable Processing (`src/lib/blog.ts:251-379`)**
Templates support multiple variable sources:
- `parameter` - Direct input values (e.g., chartType: "pie")
- `lookup` - Data from chart-data.json (e.g., descriptions, use cases)
- `transform` - Modified input values (e.g., "pie" → "Pie Chart")
- `static` - Fixed values

**Dynamic URL Generation**
- Regular posts: Loaded from filesystem
- Generated posts: Created on-demand from templates
- Static generation: All possible URLs pre-generated in `generateStaticParams()`

#### 4. SEO Optimization Features

**Metadata Generation**
- Dynamic titles: "How to Create {ChartType} in {Competitor} | chartz.ai"
- Optimized descriptions leveraging chart use cases and competitor pain points
- OpenGraph images mapped to chart types
- Structured schema markup for rich snippets

**Content Quality**
- 1000+ word articles with comprehensive coverage
- Step-by-step tutorials for traditional tools vs AI approach
- Real-world examples with specific use cases
- Professional formatting with headings, lists, and CTAs

**Internal Linking**
- Automated cross-references between chart types
- Category and tag-based navigation
- Related posts suggestions in sidebars

### URL Strategy

**Generated URLs cover key search intents:**
- `/blog/how-to-create-pie-charts` - Generic chart creation
- `/blog/how-to-create-pie-chart-in-tableau` - Tool-specific tutorials
- `/blog/how-to-create-donut-chart-in-powerbi` - Alternative tools
- `/blog/category/chart-tutorials` - Category aggregation
- `/blog/tag/tableau` - Tag-based filtering

**Total SEO Footprint:**
- 10 chart types × 1 guide each = 10 generic guides
- 3 competitors × 7 chart types = 21 competitor tutorials
- Manual posts + category/tag pages
- **Total: 100+ indexed pages** from minimal template investment

### Technical Implementation

**Static Generation at Build Time**
```typescript
// generateStaticParams() in [slug]/page.tsx:14-44
// Pre-generates all possible blog post URLs including:
// - Regular markdown posts
// - Chart guide posts (10 chart types)
// - Competitor tutorial posts (3 × 7 = 21 combinations)
```

**Runtime Template Processing**
```typescript
// generatePostFromTemplate() in blog.ts:251-379
// Dynamically processes templates with:
// - Variable substitution from chart-data.json
// - Markdown to HTML conversion
// - SEO metadata generation
// - Reading time calculation
```

**Content Caching Strategy**
- Static generation ensures fast page loads
- Generated content cached in memory during build
- No database queries for template-based posts

### Content Strategy

**Competitive Advantage Focus**
- Positions chartz.ai as simpler alternative to complex tools
- Emphasizes speed (30 seconds vs hours)
- Highlights cost savings (vs expensive licensing)
- Demonstrates accessibility (plain English vs technical complexity)

**Educational Value**
- Comprehensive tutorials for traditional tools
- Clear explanations of when to use each chart type
- Best practices and common pitfalls
- Real-world examples with specific business scenarios

This pSEO implementation enables the blog to compete for thousands of long-tail keywords while maintaining high content quality and user value.