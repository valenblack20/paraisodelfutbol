// src/pages/api/admin/auth/csrf.ts
import type { APIRoute } from 'astro';
import { authService } from '../../../../modules/auth/auth.container.ts';

export const GET: APIRoute = async (context) => {
  const adminContext = (context.locals as any).admin;

  if (!adminContext.authenticated || !adminContext.session) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }

  try {
    const sessionToken = context.cookies.get('paraiso_admin_session')?.value || '';
    const newCsrfToken = await authService.rotateCsrfToken(sessionToken);

    return new Response(JSON.stringify({ csrfToken: newCsrfToken }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: unknown) {
    console.error('[API CSRF] Error rotating CSRF token:', error);
    const message = error instanceof Error ? error.message : 'Error interno al rotar el token.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
};
