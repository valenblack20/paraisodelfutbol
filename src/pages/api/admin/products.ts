// src/pages/api/admin/products.ts
import type { APIRoute } from 'astro';
import { adminCatalogService } from '../../../modules/admin-catalog/admin-catalog.container.ts';
import { handleAdminApiError, validateCsrfHeader } from '../../../modules/admin-catalog/admin-catalog.helper.ts';

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);
  const search = url.searchParams.get('search') || undefined;
  const categoryIdStr = url.searchParams.get('categoryId');
  const publishedStr = url.searchParams.get('published');
  const archivedStr = url.searchParams.get('archived');
  const featuredStr = url.searchParams.get('featured');
  const lowStockStr = url.searchParams.get('lowStock');
  const pageStr = url.searchParams.get('page');
  const pageSizeStr = url.searchParams.get('pageSize');

  const categoryId = categoryIdStr ? Number(categoryIdStr) : undefined;
  const published = publishedStr ? publishedStr === 'true' : undefined;
  const archived = archivedStr ? archivedStr === 'true' : undefined;
  const featured = featuredStr ? featuredStr === 'true' : undefined;
  const lowStock = lowStockStr ? lowStockStr === 'true' : undefined;
  const page = pageStr ? Number(pageStr) : undefined;
  const pageSize = pageSizeStr ? Number(pageSizeStr) : undefined;

  try {
    const list = await adminCatalogService.getProducts({
      search,
      categoryId,
      published,
      archived,
      featured,
      lowStock,
      page,
      pageSize
    });
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

  const contentType = context.request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return new Response(JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Debe ser JSON.' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  try {
    const body = await context.request.json();

    // Enforce explicit types parsed from client inputs
    if (body.categoryId !== undefined) body.categoryId = Number(body.categoryId);
    if (body.retailPrice !== undefined) body.retailPrice = Number(body.retailPrice);
    if (body.wholesalePrice !== undefined && body.wholesalePrice !== null) body.wholesalePrice = Number(body.wholesalePrice);
    if (body.wholesaleMinimum !== undefined && body.wholesaleMinimum !== null) body.wholesaleMinimum = Number(body.wholesaleMinimum);
    
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

    const id = await adminCatalogService.createProduct(adminContext.user.id, body);
    return new Response(JSON.stringify({ id, success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};
