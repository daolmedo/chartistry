# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- **Development**: `npm run dev` - Start Next.js development server on localhost:3000
- **Build**: `npm run build` - Build the Next.js application for production
- **Start**: `npm run start` - Start the production server
- **Lint**: `npm run lint` - Run Next.js linting

## Architecture

This is a Next.js 14 application with AWS Amplify Gen 1 v6 backend integration:

### Frontend Structure
- **Framework**: Next.js 14 with App Router
- **TypeScript**: Configured with strict mode and path aliases (`"@/*": ["./src/*"]`)
- **Styling**: CSS modules (page.module.css) and global CSS
- **Fonts**: Geist font family (GeistVF.woff, GeistMonoVF.woff) loaded via next/font/local
- **Main entry point**: `src/app/page.tsx`
- **Layout**: `src/app/layout.tsx` with font configuration and metadata

### AWS Amplify Gen 1 v6 Backend
- **Environment**: Uses legacy Amplify CLI v6 (Gen 1) architecture
- **Configuration**: `amplify/cli.json`, `amplify/team-provider-info.json`
- **Current backend**: Located in `amplify/#current-cloud-backend/`
- **Source backend**: Located in `amplify/backend/`

#### API Gateway
- **REST API**: `chartistryapi` configured in `amplify/backend/api/chartistryapi/`
- **Build artifacts**: Generated in `amplify/backend/api/chartistryapi/build/`

#### Lambda Functions
- **Chart Generator**: `amplify/backend/function/chartgenerator/`
- **Handler**: `amplify/backend/function/chartgenerator/src/index.js`
- **Current implementation**: Claude Code SDK integration for AI-powered chart generation
- **Package management**: Uses yarn (yarn.lock present)
- **CORS**: Currently commented out but available for frontend integration

#### CloudFormation
- **Templates**: Auto-generated in `amplify/backend/awscloudformation/build/`
- **Function templates**: Individual CloudFormation templates per function

### Frontend-Backend Integration
- **Configuration**: `src/amplifyconfiguration.json` (Amplify v6 config format)
- **AWS Exports**: `src/aws-exports.js` (legacy format for Gen 1)
- **Type definitions**: `amplify/backend/types/amplify-dependent-resources-ref.d.ts`

### Chart Generation MVP Architecture
This application implements an AI-powered chart generation system:

#### Frontend Components
- **ChatSidebar** (`src/app/components/ChatSidebar.tsx`): Chat interface for user input
- **ChartDisplay** (`src/app/components/ChartDisplay.tsx`): Main area displaying generated charts  
- **ChartRenderer** (`src/app/components/ChartRenderer.tsx`): Dynamic React component execution system

#### AI Integration
- **Lambda Function**: Uses Claude Code SDK to generate React chart components
- **Dynamic Rendering**: Executes AI-generated React code with Visx and Framer Motion
- **API Route**: Next.js API route at `/api/generate-chart` proxies to Lambda

#### Chart Libraries
- **Visx**: Core charting primitives (scale, axis, shape, group, grid, curve, gradient, pattern, tooltip)
- **Framer Motion**: Animations and transitions for charts
- **Dynamic Execution**: AI-generated components rendered in sandboxed environment

### Setup Requirements
1. Copy `.env.local.example` to `.env.local`
2. Set `NEXT_PUBLIC_API_GATEWAY_URL` to your deployed API Gateway endpoint
3. Configure `ANTHROPIC_API_KEY` in Lambda environment variables
4. Deploy backend with `amplify push`

### Development Notes
- This is an Amplify Gen 1 project using CLI v6 - do not attempt to migrate to Gen 2 without explicit request
- Use `amplify` CLI commands for backend modifications
- Lambda function uses Claude SDK to generate chart code dynamically
- Chart components are executed in a controlled sandbox environment
- All chart code generation happens server-side for security
- Backend changes require `amplify push` to deploy
- The project structure follows Amplify Gen 1 conventions with separate current-cloud-backend and backend directories