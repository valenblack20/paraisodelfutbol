import type { APIRoute } from 'astro';
import { adminCatalogService } from '../../../../modules/admin-catalog/admin-catalog.container.ts';
import {
  handleAdminApiError,
  jsonError,
  jsonOk,
  parseJsonBody,
  validateAdminWriteRequest
} from '../../../../modules/admin-catalog/admin-catalog.helper.ts';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePath(path: string | undefined): { id: number; action: string | null; valid: boolean } {
  if (!path) return { id: 0, action: null, valid: false };

  const parts = path.split('/').filter(Boolean);
  if (parts.length < 1 || parts.length > 2) {
    return { id: 0, action: null, valid: false };
  }

  const id = Number(parts[0]);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { id: 0, action: null, valid: false };
  }

  return {
    id,
    action: parts.length === 2 ? parts[1] : null,
    valid: true
  };
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
  const parsed = parsePath(context.params.path);
  if (!parsed.valid || parsed.action !== null) {
    return jsonError('NOT_FOUND', 'Ruta no encontrada.', 404);
  }

  try {
    const product = await adminCatalogService.getProductById(parsed.id);
    return jsonOk(product);
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};

export const PUT: APIRoute = async (context) => {
  const authError = requireAuthenticatedAdmin(context);
  if (authError) return authError;

  const parsed = parsePath(context.params.path);
  if (!parsed.valid || parsed.action !== null) {
    return jsonError('NOT_FOUND', 'Ruta no encontrada.', 404);
  }

  const admin = context.locals.admin;
  const securityError = validateAdminWriteRequest(
    context.request,
    admin.session?.csrfTokenHash
  );
  if (securityError) return securityError;

  const parsedBody = await parseJsonBody(context.request);
  if (parsedBody instanceof Response) return parsedBody;

  try {
    await adminCatalogService.updateProduct(
      admin.user!.id,
      parsed.id,
      coerceProductPayload(parsedBody)
    );
    return jsonOk();
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};

export const PATCH: APIRoute = async (context) => {
  const authError = requireAuthenticatedAdmin(context);
  if (authError) return authError;

  const parsed = parsePath(context.params.path);
  const allowedActions = new Set(['archive', 'publication', 'featured']);
  if (!parsed.valid || !parsed.action || !allowedActions.has(parsed.action)) {
    return jsonError('NOT_FOUND', 'Ruta no encontrada.', 404);
  }

  const admin = context.locals.admin;
  const securityError = validateAdminWriteRequest(
    context.request,
    admin.session?.csrfTokenHash
  );
  if (securityError) return securityError;

  const parsedBody = await parseJsonBody(context.request);
  if (parsedBody instanceof Response) return parsedBody;
  if (!isRecord(parsedBody)) {
    return jsonError('VALIDATION_ERROR', 'El cuerpo de la solicitud es inválido.', 422);
  }

  try {
    if (parsed.action === 'archive') {
      const archived = parsedBody.archived ?? parsedBody.archive;
      if (typeof archived !== 'boolean') {
        return jsonError(
          'VALIDATION_ERROR',
          'Campo "archived" es obligatorio y debe ser boolean.',
          422
        );
      }

      if (archived) {
        await adminCatalogService.archiveProduct(admin.user!.id, parsed.id);
      } else {
        await adminCatalogService.restoreProduct(admin.user!.id, parsed.id);
      }
      return jsonOk();
    }

    if (parsed.action === 'publication') {
      if (typeof parsedBody.published !== 'boolean') {
        return jsonError(
          'VALIDATION_ERROR',
          'Campo "published" es obligatorio y debe ser boolean.',
          422
        );
      }
      await adminCatalogService.setProductPublished(
        admin.user!.id,
        parsed.id,
        parsedBody.published
      );
      return jsonOk();
    }

    if (typeof parsedBody.featured !== 'boolean') {
      return jsonError(
        'VALIDATION_ERROR',
        'Campo "featured" es obligatorio y debe ser boolean.',
        422
      );
    }
    await adminCatalogService.setProductFeatured(
      admin.user!.id,
      parsed.id,
      parsedBody.featured
    );
    return jsonOk();
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};
