// src/modules/admin-catalog/admin-catalog.repository.ts
import type { 
  AdminCategory, 
  AdminProduct, 
  CreateCategoryCommand, 
  UpdateCategoryCommand,
  CreateProductCommand,
  UpdateProductCommand,
  ProductFilter,
  PagedResult
} from './admin-catalog.types';
import type mysql from 'mysql2/promise';

export interface AdminCatalogRepository {
  // Connection management
  getConnection(): Promise<mysql.PoolConnection>;

  // Categories
  listCategories(): Promise<AdminCategory[]>;
  findCategoryById(id: number): Promise<AdminCategory | null>;
  findCategoryBySlug(slug: string): Promise<AdminCategory | null>;
  createCategory(cmd: CreateCategoryCommand): Promise<number>;
  updateCategory(cmd: UpdateCategoryCommand): Promise<void>;
  setCategoryActive(id: number, active: boolean): Promise<void>;
  countProductsByCategoryId(categoryId: number): Promise<number>;

  // Products
  listProducts(filter: ProductFilter): Promise<PagedResult<AdminProduct>>;
  findProductForAdmin(id: number): Promise<AdminProduct | null>;
  findProductBySlug(slug: string): Promise<AdminProduct | null>;
  
  createProduct(cmd: CreateProductCommand, connection: mysql.PoolConnection): Promise<number>;
  updateProduct(cmd: UpdateProductCommand, connection: mysql.PoolConnection): Promise<void>;
  
  replaceProductVariants(
    productId: number, 
    variants: CreateProductCommand['variants'], 
    connection: mysql.PoolConnection
  ): Promise<void>;
  
  replaceProductImages(
    productId: number, 
    images: CreateProductCommand['images'], 
    connection: mysql.PoolConnection
  ): Promise<void>;

  updateProductTotalStock(productId: number, totalStock: number, connection: mysql.PoolConnection): Promise<void>;
  updateProductPrimaryImage(productId: number, primaryImagePath: string | null, connection: mysql.PoolConnection): Promise<void>;

  setProductPublished(id: number, published: boolean): Promise<void>;
  setProductFeatured(id: number, featured: boolean): Promise<void>;
  archiveProduct(id: number): Promise<void>;
  restoreProduct(id: number): Promise<void>;

  // Audit Logs
  createAuditLog(
    adminUserId: number | null,
    action: string,
    entityType: string,
    entityId: number | null,
    metadataJson: any,
    connection?: mysql.PoolConnection
  ): Promise<void>;
}
