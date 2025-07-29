import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from 'hono';

// Define the environment bindings type
interface Bindings {
  DATABASE_URL: string;
  JWT_SECRET: string;
  NODE_ENV: string;
}

// Define the tRPC context type
export interface TRPCContext {
  c: Context<{ Bindings: Bindings }>;
  userId?: string;
}

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        code: error.code,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure that requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
