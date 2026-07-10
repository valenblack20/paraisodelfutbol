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

  for (const field of ['categoryId', 'retailPrice', 'wholesalePrice', 'wholesaleMinimum']) {
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

export const GET: APIRoute = async (context) => {
  const url = new URL(context.request.url);

  try {
    const list = await adminCatalogService.getProducts({
      search: url.searchParams.get('search') || undefined,
      categoryId: url.searchParams.has('categoryId')
        ? Number(url.searchParams.get('categoryId'))
        : undefined,
      published: url.searchParams.has('published')
        ? url.searchParams.get('published') === 'true'
        : undefined,
      archived: url.searchParams.has('archived')
        ? url.searchParams.get('archived') === 'true'
        : undefined,
      featured: url.searchParams.has('featured')
        ? url.searchParams.get('featured') === 'true'
        : undefined,
      lowStock: url.searchParams.has('lowStock')
        ? url.searchParams.get('lowStock') === 'true'
        : undefined,
      page: url.searchParams.has('page')
        ? Number(url.searchParams.get('page'))
        : undefined,
      pageSize: url.searchParams.has('pageSize')
        ? Number(url.searchParams.get('pageSize'))
        : undefined
    });
    return jsonOk(list);
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};

export const POST: APIRoute = async (context) => {
  const admin = context.locals.admin;
  if (!admin.authenticated || !admin.user || !admin.session) {
    return jsonError('UNAUTHORIZED', 'No autorizado.', 401);
  }

  const securityError = validateAdminWriteRequest(
    context.request,
    admin.session.csrfTokenHash
  );
  if (securityError) return securityError;

  const parsedBody = await parseJsonBody(context.request);
  if (parsedBody instanceof Response) return parsedBody;

  try {
    const id = await adminCatalogService.createProduct(
      admin.user.id,
      coerceProductPayload(parsedBody)
    );
    return jsonOk({ id, success: true }, 201);
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};
