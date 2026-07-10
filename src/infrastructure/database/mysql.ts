import mysql from 'mysql2/promise';
import { env } from '../config/env';

let pool: mysql.Pool | null = null;

/**
 * Returns the singleton database pool instance, initializing it lazily if needed.
 */
export function getDatabasePool(): mysql.Pool {
  if (!pool) {
    const sslConfig = env.DB.ssl ? { rejectUnauthorized: false } : undefined;
    
    pool = mysql.createPool({
      host: env.DB.host,
      port: env.DB.port,
      user: env.DB.user,
      password: env.DB.password,
      database: env.DB.database,
      waitForConnections: true,
      connectionLimit: env.DB.connectionLimit,
      queueLimit: 0,
      charset: 'utf8mb4',
      decimalNumbers: true,
      timezone: 'Z', // UTC timezone
      ssl: sslConfig,
    });
  }
  return pool;
}

/**
 * Closes the database pool if it exists.
 */
export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
