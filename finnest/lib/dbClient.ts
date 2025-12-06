import { Pool, neonConfig } from '@neondatabase/serverless';

// Configure Neon to use WebSockets for browser environments
neonConfig.fetchConnectionCache = true;

// WARNING: Exposing the connection string in the frontend is a security risk.
// In a production app, you should use a backend API to handle database connections.
const connectionString = 'postgresql://neondb_owner:npg_biOZXrSJ2e4t@ep-dawn-forest-aheclqkg-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const pool = new Pool({ connectionString });
