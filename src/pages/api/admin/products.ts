// src/pages/api/admin/products.ts
import type { APIRoute } from 'astro';
import { adminCatalogService } from '../../../modules/admin-catalog/admin-catalog.container.ts';
import {
  handleAdminApiError,
  jsonError,
  jsonOk,
  parseJsonBody,
  validateAdminWriteRequest
} from '../../../modules/admin-catalog/admin-catalog.helper.ts';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): unknown {
  if (value === null || value === undefined || value === '') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

function coerceProductPayload(input: unknown): unknown {
  if (!isRecord(input)) return input;

  const body: JsonRecord = { ...input };
  for (const field of ['categoryId', 'retailPrice', 'wholesalePrice', 'wholesaleMinimum', 'expectedVersion']) {
    if (field in body) body[field] = toNumber(body[field]);
  }

  if (Array.isArray(body.variants)) {
    body.variants = body.variants.map((variant) => {
      if (!isRecord(variant)) return variant;
      return {
        ...variant,
        stock: toNumber(variant.stock),
        displayOrder: toNumber(variant.displayOrder)
      };
    });
  }

  if (Array.isArray(body.images)) {
    body.images = body.images.map((image) => {
      if (!isRecord(image)) return image;
      return {
        ...image,
        displayOrder: toNumber(image.displayOrder)
      };
    });
  }

  return body;
}

function requireAuthenticatedAdmin(context: Parameters<APIRoute>[0]): Response | null {
  const admin = context.locals.admin;
  if (!admin.authenticated || !admin.user || !admin.session) {
    return jsonError('UNAUTHORIZED', 'No autorizado.', 401);
  }
  return null;
}

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
    return jsonOk(list);
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};

export const POST: APIRoute = async (context) => {
  const authError = requireAuthenticatedAdmin(context);
  if (authError) return authError;

  const admin = context.locals.admin;
  const securityError = validateAdminWriteRequest(
    context.request,
    admin.session?.csrfTokenHash
  );
  if (securityError) return securityError;

  const parsedBody = await parseJsonBody(context.request);
  if (parsedBody instanceof Response) return parsedBody;

  try {
    const id = await adminCatalogService.createProduct(
      admin.user!.id,
      coerceProductPayload(parsedBody)
    );
    return jsonOk({ id, success: true }, 201);
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};
