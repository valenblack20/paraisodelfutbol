// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { authService } from './modules/auth/auth.container';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // 1. Read session cookie
  const sessionCookie = context.cookies.get('paraiso_admin_session');
  const token = sessionCookie?.value;

  let authContext = { authenticated: false, user: null, session: null };

  if (token) {
    authContext = await authService.validateSession(token);
    if (!authContext.authenticated) {
      // Clear invalid cookie
      context.cookies.delete('paraiso_admin_session', { path: '/' });
    }
  }

  // Attach auth context to locals
  context.locals.admin = authContext;

  // 2. Route protection logic
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isExcluded = pathname === '/admin/login' || pathname === '/api/admin/auth/login';

  if (isAdminPath && !isExcluded) {
    if (!authContext.authenticated) {
      if (pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'No autorizado. Inicie sesión.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return context.redirect('/admin/login');
      }
    }
  }

  // 3. Process the request
  const response = await next();

  // 4. Inject Security Headers for administration routes
  if (isAdminPath) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'same-origin');
    response.headers.set('X-Frame-Options', 'DENY');
    
    // A secure CSP that allows inline styles and scripts required by Astro's SSR/ViewTransitions
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; frame-ancestors 'none'; connect-src 'self';"
    );
  }

  return response;
});
