// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { authService } from './modules/auth/auth.container';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isExcluded = pathname === '/admin/login' || pathname === '/api/admin/auth/login';

  let authContext = { authenticated: false, user: null, session: null };

  // Only query and validate admin sessions for admin pages/APIs
  if (isAdminPath) {
    const sessionCookie = context.cookies.get('paraiso_admin_session');
    const token = sessionCookie?.value;

    if (token) {
      try {
        authContext = await authService.validateSession(token);
        if (!authContext.authenticated) {
          context.cookies.delete('paraiso_admin_session', { path: '/' });
        }
      } catch (error: unknown) {
        console.error('[Middleware Auth Error] Database/Service unavailable:', error);
        
        if (pathname.startsWith('/api/')) {
          return new Response(
            JSON.stringify({ 
              error: {
                code: 'DATABASE_UNAVAILABLE',
                message: 'El servicio de autenticación no está disponible temporalmente.'
              }
            }), 
            {
              status: 503,
              headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
            }
          );
        } else {
          return new Response(
            `<!DOCTYPE html>
             <html lang="es">
             <head>
               <meta charset="utf-8">
               <meta name="viewport" content="width=device-width, initial-scale=1.0">
               <title>Servicio No Disponible - El Paraíso del Fútbol</title>
               <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;850;900&display=swap" rel="stylesheet">
               <style>
                 body {
                   background-color: #030303;
                   color: #f5f5f5;
                   font-family: 'Outfit', sans-serif;
                   min-height: 100vh;
                   display: flex;
                   align-items: center;
                   justify-content: center;
                   margin: 0;
                   padding: 20px;
                   box-sizing: border-box;
                 }
                 .container {
                   max-width: 500px;
                   text-align: center;
                   background-color: #090909;
                   border: 1px solid #1a1a1a;
                   padding: 40px;
                   border-radius: 24px;
                   box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                 }
                 h1 {
                   font-size: 24px;
                   font-weight: 900;
                   color: #ffffff;
                   text-transform: uppercase;
                   letter-spacing: 1px;
                   margin-bottom: 16px;
                 }
                 p {
                   font-size: 14px;
                   color: #a3a3a3;
                   line-height: 1.6;
                   margin-bottom: 24px;
                 }
                 .btn {
                   display: inline-block;
                   background-color: #74ACDF;
                   color: #030303;
                   text-decoration: none;
                   font-size: 12px;
                   font-weight: 850;
                   text-transform: uppercase;
                   letter-spacing: 1px;
                   padding: 12px 24px;
                   border-radius: 12px;
                   transition: background-color 0.2s;
                 }
                 .btn:hover {
                   background-color: #5591c8;
                 }
               </style>
             </head>
             <body>
               <div class="container">
                 <h1>Servicio Temporalmente No Disponible</h1>
                 <p>No se pudo conectar con la base de datos de administración en este momento. Por favor, intenta de nuevo más tarde.</p>
                 <a href="/" class="btn">Ir al Inicio</a>
               </div>
             </body>
             </html>`,
            {
              status: 503,
              headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
            }
          );
        }
      }
    }
  }

  // Attach auth context to locals
  (context.locals as any).admin = authContext;

  // Route protection logic
  if (isAdminPath && !isExcluded) {
    if (!authContext.authenticated) {
      if (pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'No autorizado. Inicie sesión.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
      } else {
        return context.redirect('/admin/login');
      }
    }
  }

  // Process the request
  const response = await next();

  // Inject Security Headers for administration routes
  if (isAdminPath) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'same-origin');
    response.headers.set('X-Frame-Options', 'DENY');
    
    // Hardened CSP without 'unsafe-eval'
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; frame-ancestors 'none'; connect-src 'self';"
    );
  }

  return response;
});
