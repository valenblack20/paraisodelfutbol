// src/pages/api/admin/auth/login.ts
import type { APIRoute } from 'astro';
import { authService, sessionService } from '../../../../modules/auth/auth.container';
import { AuthenticationError, RateLimitError } from '../../../../modules/auth/auth.errors';
import { env } from '../../../../infrastructure/config/env';

export const POST: APIRoute = async (context) => {
  // Validate Origin / Referer against PUBLIC_SITE_URL
  const origin = context.request.headers.get('origin');
  const referer = context.request.headers.get('referer');
  const siteUrl = new URL(env.PUBLIC_SITE_URL);
  
  let hasValidOrigin = false;
  try {
    if (origin) {
      const originUrl = new URL(origin);
      hasValidOrigin = originUrl.hostname === siteUrl.hostname;
    } else if (referer) {
      const refererUrl = new URL(referer);
      hasValidOrigin = refererUrl.hostname === siteUrl.hostname;
    } else {
      hasValidOrigin = !import.meta.env.PROD;
    }
  } catch {
    hasValidOrigin = false;
  }

  if (!hasValidOrigin) {
    return new Response(JSON.stringify({ error: 'Origen no autorizado.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate Content-Type
  const contentType = context.request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Formato de contenido inválido. Debe ser JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await context.request.json();
    const { email, password } = body;

    // Validate inputs presence and size
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return new Response(JSON.stringify({ error: 'Email y contraseña son requeridos.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (email.length > 190 || password.length > 255) {
      return new Response(JSON.stringify({ error: 'Entrada demasiado larga.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine client IP safely based on TRUST_PROXY
    let clientIp = context.clientAddress;
    if (env.AUTH.trustProxy) {
      const xForwardedFor = context.request.headers.get('x-forwarded-for');
      if (xForwardedFor) {
        clientIp = xForwardedFor.split(',')[0].trim();
      }
    }

    // Attempt login
    const result = await authService.login(email, password, clientIp);

    // Set secure HttpOnly session cookie
    const cookieOptions = sessionService.getCookieOptions(env.AUTH.sessionHours, env.AUTH.cookieSecure);
    context.cookies.set('paraiso_admin_session', result.token, cookieOptions);

    // Return safe user info along with the raw CSRF token
    return new Response(
      JSON.stringify({
        success: true,
        displayName: result.user.displayName,
        csrfToken: result.csrfToken
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: unknown) {
    if (error instanceof RateLimitError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (error instanceof AuthenticationError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.error('[API Login] Unexpected login error:', error);
    return new Response(JSON.stringify({ error: 'Ocurrió un error inesperado al procesar el acceso.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
