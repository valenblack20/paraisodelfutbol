import type { Pool } from 'mysql2/promise';
import type { ProductRepository } from './product.repository';
import type { Product } from './product.types';
import type { ProductRow } from './product-row.types';
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

  public async findCatalogProducts(): Promise<Product[]> {
    const sql = `
      SELECT ${this.getSelectFields()}
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.published = 1 AND c.active = 1
      ORDER BY 
        p.featured DESC,
        c.display_order ASC,
        p.created_at DESC,
        p.id DESC
    `;
    const [rows] = await this.pool.execute<ProductRow[]>(sql);
    return ProductMapper.toDomainList(rows);
  }

  public async findById(id: number): Promise<Product | null> {
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
    return ProductMapper.toDomain(rows[0]);
  }

  public async findBySlug(slug: string): Promise<Product | null> {
    const sql = `
      SELECT ${this.getSelectFields()}
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?
      LIMIT 1
    `;
    const [rows] = await this.pool.execute<ProductRow[]>(sql, [slug]);
    if (rows.length === 0) {
      return null;
    }
    return ProductMapper.toDomain(rows[0]);
  }
}
