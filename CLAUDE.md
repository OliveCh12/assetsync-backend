# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AssetSync is a comprehensive asset management platform that tracks resale value of personal and business assets. The backend is built with modern TypeScript technologies focusing on type safety and scalability.

## Tech Stack

- **Framework**: Hono (Fast web framework) with TypeScript
- **Database**: PostgreSQL 17.5 with Drizzle ORM
- **Validation**: Zod with drizzle-zod integration (57 validation schemas)
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Runtime**: Node.js with tsx for development

## Development Commands

### Database Operations
- `pnpm db:generate` - Generate Drizzle migrations from schema changes
- `pnpm db:migrate` - Apply pending migrations to database
- `pnpm db:studio` - Open Drizzle Studio for database exploration
- `pnpm db:seed` - Seed database with initial data
- `pnpm db:seed:reset` - Reset and reseed database

### Development
- `pnpm dev` - Start development server with hot reload (port 3001)
- `pnpm build` - Build TypeScript to dist/
- `pnpm start` - Start production server from dist/

### Verification Scripts
- `tsx scripts/verify-validation.ts` - Verify validation schema setup
- `tsx scripts/test-schemas.ts` - Test schema imports
- `tsx scripts/test-db-connection.ts` - Test database connection

## Database Architecture

### Core Tables
- **users** - User accounts supporting personal/professional contexts
- **organizations** - Business entities for professional asset management
- **assets** - Central asset tracking with purchase info and resale planning
- **asset_valuations** - Multi-scenario valuation system (pessimistic/realistic/optimistic)
- **asset_categories** - Hierarchical categorization for all asset types

### Business Logic Tables

- **platforms** - Marketplace integrations (Leboncoin, Vinted, eBay, etc.)
- **asset_listings** - Cross-platform listing management
- **subscription_plans** - Freemium and professional pricing tiers
- **transactions** - Revenue tracking for sales and commissions

### Database Schema Location

- Main schema: `src/lib/db.ts` (comprehensive with relations)
- Migrations: `src/migrations/` (auto-generated)
- Configuration: `drizzle.config.ts`

## API Architecture

### Route Structure

- **Base API**: `/api/v1/`
- **Auth routes**: `/api/v1/auth/` (register, login, logout, refresh, password reset)
- **Asset routes**: `/api/v1/assets/` 
- **User routes**: `/api/v1/users/`
- **Category routes**: `/api/v1/categories`

### Authentication

- JWT-based with access/refresh token pattern
- Middleware: `src/middleware/auth.ts`
- Auth utilities: `src/lib/auth/jwt.ts`, `src/lib/auth/passwords.ts`
- Session storage in database for enhanced security

### Request Validation

- All endpoints use Zod validation via `@hono/zod-validator`
- Schema definitions: `src/lib/validation/schemas.ts` (57 schemas)
- Custom validators: `src/lib/validation/index.ts`

## Key Implementation Patterns

### Database Queries

```typescript
import { getDatabase } from '../lib/db.js';
import { users, assets } from '../lib/db.js';
import { eq, and, gt } from 'drizzle-orm';

const db = getDatabase();
const user = await db.select().from(users).where(eq(users.email, email));
```

### Route Handler Pattern

```typescript
import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

app.post('/endpoint', zValidator('json', schema), async (c) => {
  const data = c.req.valid('json');
  // Handle request
});
```

### Authentication Middleware Usage

```typescript
import { authMiddleware } from '../middleware/auth.js';

// Protect routes
app.use('/protected/*', authMiddleware);

// Access user context
const userId = c.get('userId');
const user = c.get('user');
```

## Environment Configuration

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `FRONTEND_URL` - CORS origin (default: http://localhost:3000)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)

## Project Status

### Completed Features

- ✅ Complete database schema (19 tables, all relationships)
- ✅ Drizzle ORM setup with migrations
- ✅ Input validation infrastructure (57 Zod schemas)
- ✅ JWT authentication system
- ✅ User authentication routes (register, login, logout, password reset)
- ✅ Authentication middleware with role-based access
- ✅ Basic API structure with error handling

### Current Development Phase

Focus on core asset management functionality:

- Asset CRUD operations
- Asset valuation system implementation
- Category management
- Platform integration setup

### Architecture Highlights

1. **Type Safety**: Full TypeScript with Drizzle for compile-time SQL validation
2. **Validation**: Comprehensive Zod schemas for all database operations
3. **Security**: JWT auth, password hashing, session management, CORS configured
4. **Database Design**: Supports both personal and professional use cases with proper relations
5. **Scalability**: Organized for multi-tenant professional organizations

## Important File Locations

- Main entry: `src/index.ts`
- Database schema: `src/lib/db.ts`
- Route modules: `src/routes/`
- Authentication: `src/lib/auth/` and `src/middleware/auth.ts`
- Validation: `src/lib/validation/`
- Seeding: `src/lib/seed/`

## Development Notes

- Use ESM imports (`.js` extensions required)
- Database initialization required before server start
- All routes return JSON with consistent structure
- Error handling via Hono's HTTPException
- Soft deletes implemented where appropriate (deletedAt timestamps)

## Essential documentation for the project

- [Drizzle ORM](https://orm.drizzle.team/llms-full.txt)
- [Hono](https://hono.dev/llms-full.txt)



## Testing Approach

When implementing tests:

- Use the validation schemas in `src/lib/validation/`
- Test database operations with proper cleanup
- Mock external services (email, payment processors)
- Test authentication flows thoroughly
- Verify proper error responses

This backend implements a sophisticated asset management system designed to scale from personal use to enterprise deployment.