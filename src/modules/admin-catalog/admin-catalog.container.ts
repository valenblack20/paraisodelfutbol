// src/modules/admin-catalog/admin-catalog.container.ts
import { getDatabasePool } from '../../infrastructure/database/mysql';
import { MySqlAdminCatalogRepository } from './mysql-admin-catalog.repository';
import { AdminCatalogService } from './admin-catalog.service';

const pool = getDatabasePool();
export const adminCatalogRepository = new MySqlAdminCatalogRepository(pool);
export const adminCatalogService = new AdminCatalogService(adminCatalogRepository);
