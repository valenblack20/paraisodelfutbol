// src/pages/api/admin/products/[id]/featured.ts
import type { APIRoute } from 'astro';
import { adminCatalogService } from '../../../../modules/admin-catalog/admin-catalog.container';
import { handleAdminApiError, validateCsrfHeader } from '../../../../modules/admin-catalog/admin-catalog.helper';

export const PATCH: APIRoute = async (context) => {
  const adminContext = (context.locals as any).admin;
  const idStr = context.params.id;
  const id = Number(idStr || '0');

  if (!validateCsrfHeader(context.request, adminContext.session?.csrfTokenHash)) {
    return new Response(JSON.stringify({ error: { code: 'CSRF_INVALID', message: 'Token CSRF inválido.' } }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  const contentType = context.request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return new Response(JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Debe ser JSON.' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  try {
    const body = await context.request.json();
    const { featured } = body;
    if (featured === undefined || typeof featured !== 'boolean') {
      return new Response(JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Campo "featured" es obligatorio.' } }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }

    await adminCatalogService.setProductFeatured(adminContext.user.id, id, featured);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};
