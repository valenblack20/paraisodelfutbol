import type { APIRoute } from 'astro';
import { checkDatabaseHealth } from '../../../infrastructure/database/database-health';

export const GET: APIRoute = async () => {
  const isHealthy = await checkDatabaseHealth();
  
  const status = isHealthy ? 200 : 503;
  const body = JSON.stringify({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
  });

  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
};
export const prerender = false;
