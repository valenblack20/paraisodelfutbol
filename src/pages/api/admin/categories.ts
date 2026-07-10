// src/pages/api/admin/categories.ts
import type { APIRoute } from 'astro';
import { adminCatalogService } from '../../../modules/admin-catalog/admin-catalog.container';
import { handleAdminApiError, validateCsrfHeader } from '../../../modules/admin-catalog/admin-catalog.helper';

export const GET: APIRoute = async (context) => {
  try {
    const list = await adminCatalogService.getCategories();
    return new Response(JSON.stringify(list), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};

export const POST: APIRoute = async (context) => {
  const adminContext = (context.locals as any).admin;

  if (!validateCsrfHeader(context.request, adminContext.session?.csrfTokenHash)) {
    return new Response(JSON.stringify({ error: { code: 'CSRF_INVALID', message: 'Token CSRF inválido.' } }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  // Validate JSON Content-Type
  const contentType = context.request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return new Response(JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Debe ser JSON.' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  try {
    const body = await context.request.json();
    const id = await adminCatalogService.createCategory(adminContext.user.id, body);
    return new Response(JSON.stringify({ id, success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};
