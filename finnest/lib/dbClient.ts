import { neon } from '@neondatabase/serverless';

// Use environment variable or fallback to default
const connectionString = import.meta.env.VITE_DATABASE_URL || 'postgresql://neondb_owner:npg_biOZXrSJ2e4t@ep-dawn-forest-aheclqkg-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Use HTTP-based SQL function (more reliable in browsers than WebSocket Pool)
export const sql = neon(connectionString);

// Wrapper to match pool.query() interface
export const pool = {
  query: async (text: string, params?: any[]) => {
    try {
      const rows = await sql(text, params || []);
      return { rows };
    } catch (error) {
      console.error('[DB] Query error:', error);
      throw error;
    }
  }
};
