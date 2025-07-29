# AssetSync Backend - Development Setup Guide

This guide will help you set up the AssetSync backend for development based on the comprehensive specification in README.md.

## 🏗️ Architecture Overview

The AssetSync backend is built with:
- **Hono** - Fast web framework for the Edge
- **tRPC** - End-to-end typesafe APIs
- **Drizzle ORM** - TypeScript ORM for PostgreSQL
- **PostgreSQL** - Primary database
- **TypeScript** - Full type safety

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- pnpm (recommended) or npm

### 1. Environment Setup

```bash
# Copy environment variables
cp .env.example .env

# Update .env with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/assetsync_dev"
```

### 2. Database Setup

```bash
# Install dependencies
pnpm install

# Generate database schema
pnpm db:generate

# Run migrations (after setting up your PostgreSQL database)
pnpm db:migrate

# Optional: Open Drizzle Studio to explore your database
pnpm db:studio
```

### 3. Start Development Server

```bash
pnpm dev
```

The server will start at `http://localhost:3000`

## 📊 Database Schema

The database schema implements the full AssetSync concept with:

### Core Tables
- **users** - User accounts (personal/professional)
- **organizations** - Business entities for professional context
- **assets** - Core asset tracking with purchase info and resale planning
- **asset_valuations** - Multi-scenario valuation system (pessimistic/realistic/optimistic)
- **asset_categories** - Hierarchical categorization system

### Platform Integration
- **platforms** - Marketplace registry (Leboncoin, Vinted, eBay, etc.)
- **asset_listings** - Cross-platform listing management
- **user_platform_connections** - OAuth connections to selling platforms

### Market Data
- **market_data_sources** - Registry of data providers
- **market_data_points** - Raw market data for valuation algorithms

### Business Model
- **subscription_plans** - Freemium and professional pricing tiers
- **user_subscriptions** - Subscription tracking
- **transactions** - Revenue tracking (sales, commissions, subscriptions)

## 🔧 API Endpoints

### Health Check
```
GET /health
```

### tRPC API
```
POST /api/trpc/users.me
POST /api/trpc/users.updateProfile
POST /api/trpc/users.stats
```

More endpoints will be added as development progresses.

## 🛠️ Development Scripts

```bash
# Development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Database operations
pnpm db:generate    # Generate migrations from schema changes
pnpm db:migrate     # Apply migrations to database
pnpm db:studio      # Open Drizzle Studio
```

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `JWT_SECRET` | Secret for JWT tokens | Required |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |

## 📱 Core Features Implemented

### Phase 1 - Foundation
- ✅ Database schema with all core tables
- ✅ User management system
- ✅ Environment configuration with Hono
- ✅ tRPC API setup with type safety
- ✅ Basic user endpoints
- 🚧 Asset management endpoints (next)
- 🚧 Valuation system (next)

### Coming Next
- Asset CRUD operations
- Multi-scenario valuation engine
- Platform integrations
- Authentication system
- Market data collection

## 🎯 Project Goals

This backend implements the AssetSync concept described in README.md:
- **Personal Context**: Track belongings for resale optimization
- **Professional Context**: Manage business assets with accounting integration
- **Universal Asset Coverage**: Support all resellable categories
- **Multi-Scenario Valuation**: Pessimistic/Realistic/Optimistic estimates
- **Platform Integration**: Cross-platform selling automation

## 🔍 Database Exploration

After running `pnpm db:studio`, you can explore:
1. All table structures and relationships
2. Enum values for asset statuses, user roles, etc.
3. Indexes for performance optimization
4. Comprehensive documentation in table comments

## 🚧 Next Development Steps

For a complete breakdown of all development tasks, see **[TASKS.md](./TASKS.md)** which contains:

### Immediate Priority (Phase 1)
1. **Input Validation Infrastructure** - Drizzle-Zod integration for type-safe validation
2. **JWT Authentication System** - Complete auth with Hono JWT middleware  
3. **User Authentication Endpoints** - Registration, login, profile management
4. **Asset CRUD Operations** - Core asset management functionality

### Upcoming Phases
- **Asset Valuation System** - Multi-scenario valuation engine
- **Platform Integration** - OAuth connections and listing management
- **Business Features** - Organizations, billing, transactions
- **Advanced Features** - Real-time updates, analytics, notifications
- **Production Ready** - Security, monitoring, testing, deployment

📋 **[View Complete Task Breakdown →](./TASKS.md)**

## 📚 Learning Resources

- [Hono Documentation](https://hono.dev/)
- [tRPC Documentation](https://trpc.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

The AssetSync backend is designed to scale from personal use to enterprise deployment, following the comprehensive roadmap outlined in the main README.md.
