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

function parseId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function requireAdmin(context: Parameters<APIRoute>[0]): Response | null {
  const admin = context.locals.admin;
  if (!admin.authenticated || !admin.user || !admin.session) {
    return jsonError('UNAUTHORIZED', 'No autorizado.', 401);
  }
  return null;
}

export const PUT: APIRoute = async (context) => {
  const authError = requireAdmin(context);
  if (authError) return authError;

  const id = parseId(context.params.id);
  if (!id) return jsonError('BAD_REQUEST', 'ID inválido.', 400);

  const admin = context.locals.admin;
  const securityError = validateAdminWriteRequest(
    context.request,
    admin.session?.csrfTokenHash
  );
  if (securityError) return securityError;

  const body = await parseJsonBody(context.request);
  if (body instanceof Response) return body;

  try {
    await adminCatalogService.updateCategory(admin.user!.id, id, body);
    return jsonOk();
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};

export const PATCH: APIRoute = async (context) => {
  const authError = requireAdmin(context);
  if (authError) return authError;

  const id = parseId(context.params.id);
  if (!id) return jsonError('BAD_REQUEST', 'ID inválido.', 400);

  const admin = context.locals.admin;
  const securityError = validateAdminWriteRequest(
    context.request,
    admin.session?.csrfTokenHash
  );
  if (securityError) return securityError;

  const body = await parseJsonBody(context.request);
  if (body instanceof Response) return body;
  if (!isRecord(body) || typeof body.active !== 'boolean') {
    return jsonError(
      'VALIDATION_ERROR',
      'Campo "active" es obligatorio y debe ser boolean.',
      422
    );
  }

  try {
    await adminCatalogService.setCategoryActive(admin.user!.id, id, body.active);
    return jsonOk();
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};
