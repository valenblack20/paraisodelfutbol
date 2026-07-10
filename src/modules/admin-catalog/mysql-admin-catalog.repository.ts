// src/modules/admin-catalog/mysql-admin-catalog.repository.ts
import type { AdminCatalogRepository } from './admin-catalog.repository';
import type {
  AdminCategory,
  AdminProduct,
  CreateCategoryCommand,
  UpdateCategoryCommand,
  CreateProductCommand,
  UpdateProductCommand,
  ProductFilter,
  PagedResult,
  AdminProductVariant,
  AdminProductImage
} from './admin-catalog.types';
import { VersionConflictError } from './admin-catalog.errors';
import type mysql from 'mysql2/promise';

export class MySqlAdminCatalogRepository implements AdminCatalogRepository {
  private pool: mysql.Pool;

  constructor(pool: mysql.Pool) {
    this.pool = pool;
  }

  public async getConnection(): Promise<mysql.PoolConnection> {
    return await this.pool.getConnection();
  }

  // === Categories ===

  public async listCategories(): Promise<AdminCategory[]> {
    const [rows] = await this.pool.execute(
      `SELECT c.id, c.name, c.slug, c.product_type as productType, c.scope, c.active, c.display_order as displayOrder,
              c.created_at, c.updated_at, COUNT(p.id) as productCount
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.archived = FALSE
       GROUP BY c.id
       ORDER BY c.display_order ASC, c.name ASC`
    );
    return (rows as any[]).map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      productType: row.productType,
      scope: row.scope,
      active: Boolean(row.active),
      displayOrder: row.displayOrder,
      productCount: Number(row.productCount || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  public async findCategoryById(id: number): Promise<AdminCategory | null> {
    const [rows] = await this.pool.execute(
      `SELECT id, name, slug, product_type as productType, scope, active, display_order as displayOrder, created_at, updated_at
       FROM categories
       WHERE id = ?`,
      [id]
    );
    const list = rows as any[];
    if (list.length === 0) return null;
    const row = list[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      productType: row.productType,
      scope: row.scope,
      active: Boolean(row.active),
      displayOrder: row.displayOrder,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  public async findCategoryBySlug(slug: string): Promise<AdminCategory | null> {
    const [rows] = await this.pool.execute(
      `SELECT id, name, slug, product_type as productType, scope, active, display_order as displayOrder, created_at, updated_at
       FROM categories
       WHERE slug = ?`,
      [slug]
    );
    const list = rows as any[];
    if (list.length === 0) return null;
    const row = list[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      productType: row.productType,
      scope: row.scope,
      active: Boolean(row.active),
      displayOrder: row.displayOrder,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  public async createCategory(cmd: CreateCategoryCommand): Promise<number> {
    const [result] = await this.pool.execute(
      `INSERT INTO categories (name, slug, product_type, scope, active, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cmd.name, cmd.slug, cmd.productType, cmd.scope, cmd.active ? 1 : 0, cmd.displayOrder]
    );
    return (result as any).insertId;
  }

  public async updateCategory(cmd: UpdateCategoryCommand): Promise<void> {
    await this.pool.execute(
      `UPDATE categories
       SET name = ?, slug = ?, product_type = ?, scope = ?, active = ?, display_order = ?
       WHERE id = ?`,
      [cmd.name, cmd.slug, cmd.productType, cmd.scope, cmd.active ? 1 : 0, cmd.displayOrder, cmd.id]
    );
  }

  public async setCategoryActive(id: number, active: boolean): Promise<void> {
    await this.pool.execute(
      `UPDATE categories SET active = ? WHERE id = ?`,
      [active ? 1 : 0, id]
    );
  }

  public async countProductsByCategoryId(categoryId: number): Promise<number> {
    const [rows] = await this.pool.execute(
      `SELECT COUNT(*) as cnt FROM products WHERE category_id = ? AND archived = FALSE`,
      [categoryId]
    );
    return (rows as any[])[0].cnt || 0;
  }

  // === Products ===

  public async listProducts(filter: ProductFilter): Promise<PagedResult<AdminProduct>> {
    const page = Math.max(1, filter.page || 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const params: any[] = [];
    let whereClauses = ['1=1'];

    if (filter.search) {
      whereClauses.push('(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
      const lk = `%${filter.search}%`;
      params.push(lk, lk, lk);
    }
    if (filter.categoryId !== undefined) {
      whereClauses.push('p.category_id = ?');
      params.push(filter.categoryId);
    }
    if (filter.published !== undefined) {
      whereClauses.push('p.published = ?');
      params.push(filter.published ? 1 : 0);
    }
    if (filter.archived !== undefined) {
      whereClauses.push('p.archived = ?');
      params.push(filter.archived ? 1 : 0);
    } else {
      whereClauses.push('p.archived = FALSE');
    }
    if (filter.featured !== undefined) {
      whereClauses.push('p.featured = ?');
      params.push(filter.featured ? 1 : 0);
    }
    if (filter.lowStock) {
      whereClauses.push('p.stock <= 5');
    }

    const whereStr = whereClauses.join(' AND ');

    // Total Count
    const [countRows] = await this.pool.execute(
      `SELECT COUNT(*) as total FROM products p WHERE ${whereStr}`,
      params
    );
    const total = (countRows as any[])[0].total || 0;

    // Items Query
    const queryParams = [...params];
    queryParams.push(pageSize, offset);

    const [rows] = await this.pool.execute(
      `SELECT p.id, p.category_id as categoryId, c.name as categoryName, p.slug, p.sku, p.name, 
              p.description, p.retail_price as retailPrice, p.wholesale_price as wholesalePrice, 
              p.wholesale_minimum as wholesaleMinimum, p.stock, p.featured, p.published, p.version, 
              p.archived, p.archived_at as archivedAt, p.created_at, p.updated_at
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${whereStr}
       ORDER BY p.updated_at DESC, p.id DESC
       LIMIT ? OFFSET ?`,
      queryParams
    );

    const items = (rows as any[]).map(row => ({
      id: row.id,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      slug: row.slug,
      sku: row.sku,
      name: row.name,
      description: row.description,
      retailPrice: Number(row.retailPrice),
      wholesalePrice: row.wholesalePrice ? Number(row.wholesalePrice) : null,
      wholesaleMinimum: row.wholesaleMinimum ? Number(row.wholesaleMinimum) : null,
      stock: Number(row.stock || 0),
      featured: Boolean(row.featured),
      published: Boolean(row.published),
      version: row.version,
      archived: Boolean(row.archived),
      archivedAt: row.archivedAt,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return { items, total, page, pageSize };
  }

  public async findProductForAdmin(id: number): Promise<AdminProduct | null> {
    const [rows] = await this.pool.execute(
      `SELECT p.id, p.category_id as categoryId, c.name as categoryName, p.slug, p.sku, p.name, 
              p.description, p.retail_price as retailPrice, p.wholesale_price as wholesalePrice, 
              p.wholesale_minimum as wholesaleMinimum, p.stock, p.featured, p.published, p.version, 
              p.archived, p.archived_at as archivedAt, p.created_at, p.updated_at
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    const list = rows as any[];
    if (list.length === 0) return null;
    const row = list[0];

    // Fetch Variants
    const [varRows] = await this.pool.execute(
      `SELECT id, size_code as sizeCode, stock, sku, active, display_order as displayOrder
       FROM product_variants
       WHERE product_id = ?
       ORDER BY display_order ASC, size_code ASC`,
      [id]
    );

    const variants = (varRows as any[]).map(v => ({
      id: v.id,
      productId: id,
      sizeCode: v.sizeCode,
      stock: Number(v.stock),
      sku: v.sku,
      active: Boolean(v.active),
      displayOrder: v.displayOrder
    }));

    // Fetch Images
    const [imgRows] = await this.pool.execute(
      `SELECT id, image_path as imagePath, alt_text as altText, is_primary as isPrimary, display_order as displayOrder
       FROM product_images
       WHERE product_id = ?
       ORDER BY display_order ASC, id ASC`,
      [id]
    );

    const images = (imgRows as any[]).map(img => ({
      id: img.id,
      productId: id,
      imagePath: img.imagePath,
      altText: img.altText,
      isPrimary: Boolean(img.isPrimary),
      displayOrder: img.displayOrder
    }));

    return {
      id: row.id,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      slug: row.slug,
      sku: row.sku,
      name: row.name,
      description: row.description,
      retailPrice: Number(row.retailPrice),
      wholesalePrice: row.wholesalePrice ? Number(row.wholesalePrice) : null,
      wholesaleMinimum: row.wholesaleMinimum ? Number(row.wholesaleMinimum) : null,
      stock: Number(row.stock || 0),
      featured: Boolean(row.featured),
      published: Boolean(row.published),
      version: row.version,
      archived: Boolean(row.archived),
      archivedAt: row.archivedAt,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      variants,
      images
    };
  }

  public async findProductBySlug(slug: string): Promise<AdminProduct | null> {
    const [rows] = await this.pool.execute(
      `SELECT id, category_id as categoryId, slug, sku, name, description, retail_price as retailPrice, 
              wholesale_price as wholesalePrice, wholesale_minimum as wholesaleMinimum, stock, 
              featured, published, version, archived, archived_at as archivedAt
       FROM products
       WHERE slug = ?`,
      [slug]
    );
    const list = rows as any[];
    if (list.length === 0) return null;
    return this.findProductForAdmin(list[0].id);
  }

  public async createProduct(cmd: CreateProductCommand, connection: mysql.PoolConnection): Promise<number> {
    const [result] = await connection.execute(
      `INSERT INTO products (category_id, slug, sku, name, description, retail_price, wholesale_price, wholesale_minimum, featured, published, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        cmd.categoryId,
        cmd.slug,
        cmd.sku,
        cmd.name,
        cmd.description,
        cmd.retailPrice,
        cmd.wholesalePrice,
        cmd.wholesaleMinimum,
        cmd.featured ? 1 : 0,
        cmd.published ? 1 : 0
      ]
    );
    return (result as any).insertId;
  }

  public async updateProduct(cmd: UpdateProductCommand, connection: mysql.PoolConnection): Promise<void> {
    const [result] = await connection.execute(
      `UPDATE products
       SET category_id = ?, slug = ?, sku = ?, name = ?, description = ?, retail_price = ?, 
           wholesale_price = ?, wholesale_minimum = ?, featured = ?, published = ?, version = version + 1
       WHERE id = ? AND version = ?`,
      [
        cmd.categoryId,
        cmd.slug,
        cmd.sku,
        cmd.name,
        cmd.description,
        cmd.retailPrice,
        cmd.wholesalePrice,
        cmd.wholesaleMinimum,
        cmd.featured ? 1 : 0,
        cmd.published ? 1 : 0,
        cmd.id,
        cmd.expectedVersion
      ]
    );

    if ((result as any).affectedRows === 0) {
      throw new VersionConflictError();
    }
  }

  public async replaceProductVariants(
    productId: number,
    variants: CreateProductCommand['variants'],
    connection: mysql.PoolConnection
  ): Promise<void> {
    // Delete existing variants
    await connection.execute(
      'DELETE FROM product_variants WHERE product_id = ?',
      [productId]
    );

    // Insert new ones
    if (variants.length > 0) {
      for (const v of variants) {
        await connection.execute(
          `INSERT INTO product_variants (product_id, size_code, stock, sku, active, display_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [productId, v.sizeCode, v.stock, v.sku, v.active ? 1 : 0, v.displayOrder]
        );
      }
    }
  }

  public async replaceProductImages(
    productId: number,
    images: CreateProductCommand['images'],
    connection: mysql.PoolConnection
  ): Promise<void> {
    // Delete existing images
    await connection.execute(
      'DELETE FROM product_images WHERE product_id = ?',
      [productId]
    );

    // Insert new ones
    if (images.length > 0) {
      for (const img of images) {
        await connection.execute(
          `INSERT INTO product_images (product_id, image_path, alt_text, is_primary, display_order)
           VALUES (?, ?, ?, ?, ?)`,
          [productId, img.imagePath, img.altText, img.isPrimary ? 1 : 0, img.displayOrder]
        );
      }
    }
  }

  public async updateProductTotalStock(productId: number, totalStock: number, connection: mysql.PoolConnection): Promise<void> {
    await connection.execute(
      'UPDATE products SET stock = ? WHERE id = ?',
      [totalStock, productId]
    );
  }

  public async updateProductPrimaryImage(productId: number, primaryImagePath: string | null, connection: mysql.PoolConnection): Promise<void> {
    await connection.execute(
      'UPDATE products SET primary_image_path = ? WHERE id = ?',
      [primaryImagePath, productId]
    );
  }

  public async setProductPublished(id: number, published: boolean): Promise<void> {
    await this.pool.execute(
      'UPDATE products SET published = ?, version = version + 1 WHERE id = ?',
      [published ? 1 : 0, id]
    );
  }

  public async setProductFeatured(id: number, featured: boolean): Promise<void> {
    await this.pool.execute(
      'UPDATE products SET featured = ?, version = version + 1 WHERE id = ?',
      [featured ? 1 : 0, id]
    );
  }

  public async archiveProduct(id: number): Promise<void> {
    await this.pool.execute(
      'UPDATE products SET archived = TRUE, published = FALSE, archived_at = NOW(), version = version + 1 WHERE id = ?',
      [id]
    );
  }

  public async restoreProduct(id: number): Promise<void> {
    await this.pool.execute(
      'UPDATE products SET archived = FALSE, archived_at = NULL, version = version + 1 WHERE id = ?',
      [id]
    );
  }

  // === Audit Logs ===

  public async createAuditLog(
    adminUserId: number | null,
    action: string,
    entityType: string,
    entityId: number | null,
    metadataJson: any,
    connection?: mysql.PoolConnection
  ): Promise<void> {
    const conn = connection || this.pool;
    const metaStr = metadataJson ? JSON.stringify(metadataJson) : null;
    await conn.execute(
      `INSERT INTO admin_audit_log (admin_user_id, action, entity_type, entity_id, metadata_json)
       VALUES (?, ?, ?, ?, ?)`,
      [adminUserId, action, entityType, entityId, metaStr]
    );
  }
}
