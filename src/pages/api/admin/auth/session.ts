// src/pages/api/admin/auth/session.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const adminContext = context.locals.admin;

  if (!adminContext.authenticated || !adminContext.user || !adminContext.session) {
    return new Response(JSON.stringify({ authenticated: false, displayName: null, email: null, expiresAt: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(
    JSON.stringify({
      authenticated: true,
      displayName: adminContext.user.displayName,
      email: adminContext.user.email,
      expiresAt: adminContext.session.expiresAt
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};
