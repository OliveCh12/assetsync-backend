import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
