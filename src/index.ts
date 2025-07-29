import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { env } from 'hono/adapter';
import { initDatabase } from './lib/db.js';
import { appRouter } from './routes/index.js';
import type { TRPCContext } from './lib/trpc.js';

// Define environment bindings type
type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  NODE_ENV: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('*', async (c, next) => {
  const corsMiddlewareHandler = cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  });
  return corsMiddlewareHandler(c, next);
});

// Initialize database connection middleware
app.use('*', async (c, next) => {
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  
  try {
    initDatabase(DATABASE_URL);
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
  
  await next();
});

// Health check endpoint
app.get('/health', (c) => {
  const { NODE_ENV } = env<{ NODE_ENV: string }>(c);
  
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV || 'development'
  });
});

// tRPC API routes
app.use('/api/trpc/*', async (c) => {
  const createContext = (): TRPCContext => {
    // In a real app, you'd extract the user ID from JWT token
    // For now, we'll just pass the Hono context
    return {
      c: c as any, // Type assertion to fix the compatibility issue
      userId: undefined, // TODO: Extract from Authorization header
    };
  };

  return fetchRequestHandler({
    router: appRouter,
    createContext,
    endpoint: '/api/trpc',
    req: c.req.raw,
  });
});

// Default route
app.get('/', (c) => {
  const { NODE_ENV } = env<{ NODE_ENV: string }>(c);
  
  return c.json({
    message: 'AssetSync API Server',
    version: '1.0.0',
    environment: NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      api: '/api/trpc',
    },
  });
});

// Start server
const port = parseInt(process.env.PORT || '3000');

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log('🚀 AssetSync API Server is running!');
  console.log(`📡 Server URL: http://localhost:${info.port}`);
  console.log(`🏥 Health Check: http://localhost:${info.port}/health`);
  console.log(`🔌 tRPC API: http://localhost:${info.port}/api/trpc`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
