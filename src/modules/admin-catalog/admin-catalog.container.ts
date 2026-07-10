// src/modules/admin-catalog/admin-catalog.container.ts
import { getDatabasePool } from '../../infrastructure/database/mysql';
import { MySqlAdminCatalogRepository } from './mysql-admin-catalog.repository.ts';
import { AdminCatalogService } from './admin-catalog.service.ts';

const pool = getDatabasePool();
export const adminCatalogRepository = new MySqlAdminCatalogRepository(pool);
export const adminCatalogService = new AdminCatalogService(adminCatalogRepository);
