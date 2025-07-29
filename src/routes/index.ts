import { router } from '../lib/trpc.js';
import { usersRouter } from './users.js';

export const appRouter = router({
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
