// src/pages/api/admin/auth/logout.ts
import type { APIRoute } from 'astro';
import { authService } from '../../../../modules/auth/auth.container';

export const POST: APIRoute = async (context) => {
  const adminContext = context.locals.admin;

  if (!adminContext.authenticated || !adminContext.session) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Retrieve and validate CSRF token from request headers
  const csrfToken = context.request.headers.get('x-csrf-token') || '';
  const validCsrf = authService.validateCsrf(csrfToken, adminContext.session.csrfTokenHash);

  if (!validCsrf) {
    return new Response(JSON.stringify({ error: 'Token CSRF inválido o faltante.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Delete session server-side
    await authService.logout(
      context.cookies.get('paraiso_admin_session')?.value || '',
      csrfToken
    );
  } catch (err) {
    console.error('[API Logout] Error destroying session:', err);
  } finally {
    // Clean cookie
    context.cookies.delete('paraiso_admin_session', { path: '/' });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
