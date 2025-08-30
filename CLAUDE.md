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
  - `chartgenerator` - AI chart generation using Anthropic Claude SDK
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
4. Lambda uses Anthropic Claude SDK to generate chart code
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