import crypto from 'node:crypto';
import { env } from '../../infrastructure/config/env.ts';
import { AdminCatalogError } from './admin-catalog.errors.ts';

interface ErrorWithCode extends Error {
  code?: string;
}

export function jsonError(code: string, message: string, status: number): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

export function jsonOk(data: unknown = { success: true }, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

export function handleAdminApiError(error: unknown): Response {
  console.error('[Admin API Error]:', error);

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Ocurrió un error inesperado al procesar la solicitud.';
  let fields: Record<string, string> | undefined;

  if (error instanceof AdminCatalogError) {
    status = error.status;
    code = error.code;
    message = error.message;
    fields = error.fields;
  } else if (error instanceof Error) {
    const codedError = error as ErrorWithCode;
    if (codedError.code === 'ER_DUP_ENTRY') {
      status = 409;
      code = 'CONFLICT';
      message = 'Ya existe un registro con estos datos duplicados (SKU o slug).';
    } else {
      message = error.message;
    }
  }

  return new Response(
    JSON.stringify({ error: { code, message, fields } }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
}

export function validateCsrfHeader(request: Request, sessionCsrfHash: string | undefined): boolean {
  if (!sessionCsrfHash) return false;
  const token = request.headers.get('x-csrf-token') || '';
  if (!token) return false;

  const computedHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(sessionCsrfHash, 'hex')
    );
  } catch {
    return false;
  }
}

export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(env.PUBLIC_SITE_URL).origin;
  } catch {
    return false;
  }
}

export function validateAdminWriteRequest(
  request: Request,
  sessionCsrfHash: string | undefined
): Response | null {
  if (!validateRequestOrigin(request)) {
    return jsonError('ORIGIN_INVALID', 'Origen de solicitud no permitido.', 403);
  }

  if (!validateCsrfHeader(request, sessionCsrfHash)) {
    return jsonError('CSRF_INVALID', 'Token CSRF inválido.', 403);
  }

  return null;
}

export async function parseJsonBody(request: Request): Promise<unknown | Response> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return jsonError('BAD_REQUEST', 'Debe ser JSON.', 400);
  }

  try {
    return (await request.json()) as unknown;
  } catch {
    return jsonError('BAD_REQUEST', 'JSON inválido.', 400);
  }
}
