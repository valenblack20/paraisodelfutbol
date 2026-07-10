// src/pages/api/admin/products/[...path].ts
// Handles all product API routes:
//   GET    /api/admin/products/{id}
//   PUT    /api/admin/products/{id}
//   PATCH  /api/admin/products/{id}/archive
//   PATCH  /api/admin/products/{id}/publication
//   PATCH  /api/admin/products/{id}/featured
import type { APIRoute } from 'astro';
import { adminCatalogService } from '../../../../modules/admin-catalog/admin-catalog.container.ts';
import { handleAdminApiError, validateCsrfHeader } from '../../../../modules/admin-catalog/admin-catalog.helper.ts';

function parsePath(path: string | undefined): { id: number; action: string | null } {
  if (!path) return { id: 0, action: null };
  const parts = path.split('/');
  const id = Number(parts[0] || '0');
  const action = parts[1] || null;
  return { id, action };
}

function jsonError(code: string, message: string, status: number): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function jsonOk(data: unknown = { success: true }, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function requireCsrf(request: Request, session: any): Response | null {
  if (!validateCsrfHeader(request, session?.csrfTokenHash)) {
    return jsonError('CSRF_INVALID', 'Token CSRF inválido.', 403);
  }
  return null;
}

async function requireJson(request: Request): Promise<{ body: any } | Response> {
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return jsonError('BAD_REQUEST', 'Debe ser JSON.', 400);
  }
  try {
    const body = await request.json();
    return { body };
  } catch {
    return jsonError('BAD_REQUEST', 'JSON inválido.', 400);
  }
}

export const GET: APIRoute = async (context) => {
  const { id, action } = parsePath(context.params.path);
  if (action !== null) return jsonError('NOT_FOUND', 'Ruta no encontrada.', 404);
  if (!id) return jsonError('BAD_REQUEST', 'ID inválido.', 400);

  try {
    const prod = await adminCatalogService.getProductById(id);
    return jsonOk(prod);
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};

export const PUT: APIRoute = async (context) => {
  const adminContext = (context.locals as any).admin;
  const { id, action } = parsePath(context.params.path);
  if (action !== null) return jsonError('NOT_FOUND', 'Ruta no encontrada.', 404);
  if (!id) return jsonError('BAD_REQUEST', 'ID inválido.', 400);

  const csrfErr = requireCsrf(context.request, adminContext.session);
  if (csrfErr) return csrfErr;

  const result = await requireJson(context.request);
  if (result instanceof Response) return result;
  const { body } = result;

  // Coerce numeric fields
  if (body.categoryId !== undefined) body.categoryId = Number(body.categoryId);
  if (body.retailPrice !== undefined) body.retailPrice = Number(body.retailPrice);
  if (body.wholesalePrice !== undefined && body.wholesalePrice !== null) body.wholesalePrice = Number(body.wholesalePrice);
  if (body.wholesaleMinimum !== undefined && body.wholesaleMinimum !== null) body.wholesaleMinimum = Number(body.wholesaleMinimum);
  if (body.expectedVersion !== undefined) body.expectedVersion = Number(body.expectedVersion);
  if (Array.isArray(body.variants)) {
    body.variants = body.variants.map((v: any) => ({
      ...v,
      stock: Number(v.stock),
      displayOrder: Number(v.displayOrder),
    }));
  }
  if (Array.isArray(body.images)) {
    body.images = body.images.map((img: any) => ({
      ...img,
      displayOrder: Number(img.displayOrder),
    }));
  }

  try {
    await adminCatalogService.updateProduct(adminContext.user.id, id, body);
    return jsonOk();
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};

export const PATCH: APIRoute = async (context) => {
  const adminContext = (context.locals as any).admin;
  const { id, action } = parsePath(context.params.path);
  if (!id) return jsonError('BAD_REQUEST', 'ID inválido.', 400);

  const csrfErr = requireCsrf(context.request, adminContext.session);
  if (csrfErr) return csrfErr;

  const result = await requireJson(context.request);
  if (result instanceof Response) return result;
  const { body } = result;

  try {
    if (action === 'archive') {
      const archived = body.archived !== undefined ? body.archived : body.archive;
      if (archived === undefined || typeof archived !== 'boolean') {
        return jsonError('VALIDATION_ERROR', 'Campo "archived" es obligatorio y debe ser boolean.', 422);
      }
      if (archived) {
        await adminCatalogService.archiveProduct(adminContext.user.id, id);
      } else {
        await adminCatalogService.restoreProduct(adminContext.user.id, id);
      }
      return jsonOk();

    } else if (action === 'publication') {
      const { published } = body;
      if (published === undefined || typeof published !== 'boolean') {
        return jsonError('VALIDATION_ERROR', 'Campo "published" es obligatorio.', 422);
      }
      await adminCatalogService.setProductPublished(adminContext.user.id, id, published);
      return jsonOk();

    } else if (action === 'featured') {
      const { featured } = body;
      if (featured === undefined || typeof featured !== 'boolean') {
        return jsonError('VALIDATION_ERROR', 'Campo "featured" es obligatorio.', 422);
      }
      await adminCatalogService.setProductFeatured(adminContext.user.id, id, featured);
      return jsonOk();

    } else {
      return jsonError('NOT_FOUND', `Acción "${action}" no reconocida.`, 404);
    }
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};
