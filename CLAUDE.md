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
- Lambda function (`chartgenerator`) for AI chart generation
- Anthropic Claude SDK integration (in Lambda)

### Key Directories
- `src/app/` - Next.js App Router pages and components
  - `api/generate-chart/route.ts` - API route that proxies to AWS Lambda
  - `lib/api.ts` - Client-side API utilities and types
  - `components/` - React components (currently empty)
- `amplify/` - AWS Amplify configuration and Lambda functions
  - `backend/function/chartgenerator/` - Lambda function for chart generation

### API Flow
1. Frontend calls `/api/generate-chart` with user message
2. Next.js API route forwards to AWS API Gateway (`chartistryapi`)
3. API Gateway triggers Lambda function (`chartgenerator`)
4. Lambda uses Anthropic Claude SDK to generate chart code
5. Response flows back through the chain

### Configuration Files
- `amplifyconfiguration.json` - AWS Amplify configuration (API Gateway endpoint)
- `aws-exports.js` - Additional AWS configuration
- TypeScript path aliases: `@/*` maps to `./src/*`
- Tailwind configured for `src/` directory structure

### Development Notes
- Amplify is configured for SSR in the API route
- CORS is handled in the API route OPTIONS method
- Error handling includes both client and server-side error types
- The Lambda function appears to be a stub implementation (incomplete)