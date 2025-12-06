import { Pool, neonConfig } from '@neondatabase/serverless';

// Configure Neon to use WebSockets for browser environments
neonConfig.fetchConnectionCache = true;

// Use environment variable or fallback to default
const connectionString = import.meta.env.VITE_DATABASE_URL || 'postgresql://neondb_owner:npg_biOZXrSJ2e4t@ep-dawn-forest-aheclqkg-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

export const pool = new Pool({ connectionString });
