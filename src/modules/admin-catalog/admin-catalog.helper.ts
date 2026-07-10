import crypto from 'node:crypto';
import { AdminCatalogError } from './admin-catalog.errors.ts';

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
    // Check for MySQL duplicate key errors
    if ((error as any).code === 'ER_DUP_ENTRY') {
      status = 409;
      code = 'CONFLICT';
      message = 'Ya existe un registro con estos datos duplicados (SKU o Slug).';
    } else {
      message = error.message;
    }
  }

  return new Response(
    JSON.stringify({
      error: { code, message, fields }
    }),
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
  
  // Hash token to compare timing-safely
  const computedHash = crypto.createHash('sha256').update(token).digest('hex');
  
  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(sessionCsrfHash, 'hex'));
  } catch {
    return false;
  }
}
