import type { Pool } from 'mysql2/promise';
import type { ProductRepository } from './product.repository';
import type { Product } from './product.types';
import type { ProductRow } from './product-row.types';
import { ProductMapper } from './product.mapper';

export class MySqlProductRepository implements ProductRepository {
  constructor(private pool: Pool) {}

  public async findCatalogProducts(): Promise<Product[]> {
    const sql = `
      SELECT id, codigo_foto, nombre, descripcion, precio_minorista, precio_mayorista, categoria, stock, created_at 
      FROM camisetas 
      ORDER BY id ASC
    `;
    const [rows] = await this.pool.execute<ProductRow[]>(sql);
    return ProductMapper.toDomainList(rows);
  }

  public async findById(id: number): Promise<Product | null> {
    const sql = `
      SELECT id, codigo_foto, nombre, descripcion, precio_minorista, precio_mayorista, categoria, stock, created_at 
      FROM camisetas 
      WHERE id = ? 
      LIMIT 1
    `;
    const [rows] = await this.pool.execute<ProductRow[]>(sql, [id]);
    if (rows.length === 0) {
      return null;
    }
    return ProductMapper.toDomain(rows[0]);
  }
}
