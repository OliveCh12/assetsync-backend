/**
 * AssetSync Backend - Main Application Entry Point
 * 
 * Hono-based API server with RPC type safety for asset management platform
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
import { env } from 'hono/adapter';
import type { HonoEnv } from './lib/env.js';
import { initDatabase } from './lib/db.js';

// Import route modules
import authRoutes from './routes/auth.js';
import assetRoutes from './routes/assets.js';
import userRoutes from './routes/users.js';
import categoryRoutes from './routes/categories.js';

// Import types for better RPC support
import type { AuthRoutesType } from './routes/auth.js';
import type { AssetRoutesType } from './routes/assets.js';
import type { UserRoutesType } from './routes/users.js';
import type { CategoryRoutesType } from './routes/categories.js';

// Define environment types for type safety
type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  NODE_ENV: string;
  PORT: string;
};

// Create main Hono app with typed environment
const app = new Hono<HonoEnv>();

// Global middleware with environment-aware CORS
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', async (c, next) => {
  const { FRONTEND_URL } = env<{ FRONTEND_URL: string }>(c);
  const corsMiddleware = cors({
    origin: FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    name: 'AssetSync API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes with versioning
const api = app.basePath('/api/v1');

// Mount route modules
api.route('/auth', authRoutes);
api.route('/assets', assetRoutes);
api.route('/users', userRoutes);
api.route('/', categoryRoutes); // Categories routes are mounted at root level

// Global error handler
app.onError((err, c) => {
  console.error('Global error handler:', err);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  const { NODE_ENV } = env<{ NODE_ENV: string }>(c);
  return c.json({
    success: false,
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong',
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    message: 'The requested resource was not found',
  }, 404);
});

// Initialize database and start server
async function startServer() {
  try {
    // For Node.js, we can still access process.env directly during startup
    // The env() helper is for runtime request handling
    const DATABASE_URL = process.env.DATABASE_URL;
    const PORT = process.env.PORT || '3001';
    
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log('🔗 Connecting to database...');
    initDatabase(DATABASE_URL);
    console.log('✅ Database connected successfully');

    // Start server
    const port = parseInt(PORT);
    
    console.log(`🚀 Starting AssetSync API server on port ${port}...`);
    
    serve({
      fetch: app.fetch,
      port,
    });

    console.log(`🎉 AssetSync API is running on http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/v1`);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

// Export app type for RPC client generation
export default app;
export type AppType = typeof api;

// Export individual route types for granular RPC client generation
export type { AuthRoutesType, AssetRoutesType, UserRoutesType, CategoryRoutesType };
