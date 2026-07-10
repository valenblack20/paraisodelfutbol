import type { APIRoute } from 'astro';
import { adminCatalogService } from '../../../modules/admin-catalog/admin-catalog.container.ts';
import {
  handleAdminApiError,
  jsonError,
  jsonOk,
  parseJsonBody,
  validateAdminWriteRequest
} from '../../../modules/admin-catalog/admin-catalog.helper.ts';

export const GET: APIRoute = async () => {
  try {
    const list = await adminCatalogService.getCategories();
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

  const body = await parseJsonBody(context.request);
  if (body instanceof Response) return body;

  try {
    const id = await adminCatalogService.createCategory(admin.user.id, body);
    return jsonOk({ id, success: true }, 201);
  } catch (error: unknown) {
    return handleAdminApiError(error);
  }
};
