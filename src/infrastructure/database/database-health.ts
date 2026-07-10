import { getDatabasePool } from './mysql';

/**
 * Checks the database health by executing a simple query.
 * Returns true if the query succeeds, false otherwise.
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const pool = getDatabasePool();
    // Use execute with a timeout or quick query
    const [rows] = await pool.execute('SELECT 1 AS healthy');
    return Array.isArray(rows) && rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
