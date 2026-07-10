// src/pages/api/admin/products/[id].ts
import type { APIRoute } from 'astro';
import { adminCatalogService } from '../../../../modules/admin-catalog/admin-catalog.container';
import { handleAdminApiError, validateCsrfHeader } from '../../../../modules/admin-catalog/admin-catalog.helper';

export const GET: APIRoute = async (context) => {
  const idStr = context.params.id;
  const id = Number(idStr || '0');

  try {
    const prod = await adminCatalogService.getProductById(id);
    return new Response(JSON.stringify(prod), {
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

export const PUT: APIRoute = async (context) => {
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

    // Parse explicitly
    if (body.categoryId !== undefined) body.categoryId = Number(body.categoryId);
    if (body.retailPrice !== undefined) body.retailPrice = Number(body.retailPrice);
    if (body.wholesalePrice !== undefined && body.wholesalePrice !== null) body.wholesalePrice = Number(body.wholesalePrice);
    if (body.wholesaleMinimum !== undefined && body.wholesaleMinimum !== null) body.wholesaleMinimum = Number(body.wholesaleMinimum);
    if (body.expectedVersion !== undefined) body.expectedVersion = Number(body.expectedVersion);
    
    if (Array.isArray(body.variants)) {
      body.variants = body.variants.map((v: any) => ({
        ...v,
        stock: Number(v.stock),
        displayOrder: Number(v.displayOrder)
      }));
    }
    if (Array.isArray(body.images)) {
      body.images = body.images.map((img: any) => ({
        ...img,
        displayOrder: Number(img.displayOrder)
      }));
    }

    await adminCatalogService.updateProduct(adminContext.user.id, id, body);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};
