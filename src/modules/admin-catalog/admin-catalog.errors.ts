// src/modules/admin-catalog/admin-catalog.errors.ts

export class AdminCatalogError extends Error {
  public code: string;
  public status: number;
  public fields?: Record<string, string>;

  constructor(message: string, code: string, status: number = 400, fields?: Record<string, string>) {
    super(message);
    this.name = 'AdminCatalogError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export class ValidationError extends AdminCatalogError {
  constructor(message: string, fields: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 422, fields);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AdminCatalogError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AdminCatalogError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class VersionConflictError extends AdminCatalogError {
  constructor(message: string = 'El producto fue modificado por otra sesión. Recargá los datos antes de volver a guardar.') {
    super(message, 'VERSION_CONFLICT', 409);
    this.name = 'VersionConflictError';
  }
}

export class DatabaseUnavailableError extends AdminCatalogError {
  constructor(message: string = 'La base de datos del catálogo no está disponible.') {
    super(message, 'DATABASE_UNAVAILABLE', 503);
    this.name = 'DatabaseUnavailableError';
  }
}
