import type { Pool } from 'mysql2/promise';
import type { ProductRepository } from './product.repository';
import type { ProductSummary, ProductDetail } from './product.types';
import type { ProductRow, ProductImageRow, ProductVariantRow } from './product-row.types';
import { ProductMapper } from './product.mapper';

export class MySqlProductRepository implements ProductRepository {
  constructor(private pool: Pool) {}

  private getSelectFields(): string {
    return `
      p.id,
      p.category_id,
      p.slug,
      p.sku,
      p.name,
      p.description,
      p.retail_price,
      p.wholesale_price,
      p.wholesale_minimum,
      p.stock,
      p.primary_image_path,
      p.featured,
      p.published,
      p.created_at,
      p.updated_at,
      c.name AS category_name,
      c.slug AS category_slug,
      c.product_type AS category_product_type,
      c.scope AS category_scope
    `;
  }

  public async findCatalogProducts(): Promise<ProductSummary[]> {
    const sql = `
      SELECT ${this.getSelectFields()}
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.published = 1 AND c.active = 1 AND p.archived = FALSE
      ORDER BY 
        p.featured DESC,
        c.display_order ASC,
        p.created_at DESC,
        p.id DESC
    `;
    const [rows] = await this.pool.execute<ProductRow[]>(sql);
    return ProductMapper.toSummaryList(rows);
  }

  public async findById(id: number): Promise<ProductDetail | null> {
    const sql = `
      SELECT ${this.getSelectFields()}
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
      LIMIT 1
    `;
    const [rows] = await this.pool.execute<ProductRow[]>(sql, [id]);
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];

    // Load images
    const [imageRows] = await this.pool.execute<ProductImageRow[]>(
      `SELECT id, product_id, image_path, alt_text, display_order, is_primary 
       FROM product_images 
       WHERE product_id = ? 
       ORDER BY display_order ASC, id ASC`,
      [row.id]
    );

    // Load active variants
    const [variantRows] = await this.pool.execute<ProductVariantRow[]>(
      `SELECT id, product_id, size_code, sku, stock, active, display_order 
       FROM product_variants 
       WHERE product_id = ? AND active = 1 
       ORDER BY display_order ASC, size_code ASC`,
      [row.id]
    );

    return ProductMapper.toDetail(row, imageRows, variantRows);
  }

  public async findPublicBySlug(slug: string): Promise<ProductDetail | null> {
    const sql = `
      SELECT ${this.getSelectFields()}
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.published = 1 AND c.active = 1 AND p.archived = FALSE
      LIMIT 1
    `;
    const [rows] = await this.pool.execute<ProductRow[]>(sql, [slug]);
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];

    // Load images
    const [imageRows] = await this.pool.execute<ProductImageRow[]>(
      `SELECT id, product_id, image_path, alt_text, display_order, is_primary 
       FROM product_images 
       WHERE product_id = ? 
       ORDER BY display_order ASC, id ASC`,
      [row.id]
    );

    // Load active variants
    const [variantRows] = await this.pool.execute<ProductVariantRow[]>(
      `SELECT id, product_id, size_code, sku, stock, active, display_order 
       FROM product_variants 
       WHERE product_id = ? AND active = 1 
       ORDER BY display_order ASC, size_code ASC`,
      [row.id]
    );

    return ProductMapper.toDetail(row, imageRows, variantRows);
  }
}
