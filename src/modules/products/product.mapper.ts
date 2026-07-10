import type { Product } from './product.types';
import type { ProductRow } from './product-row.types';

export class ProductMapper {
  /**
   * Maps a database joined row (ProductRow) to a clean Domain Model (Product)
   */
  public static toDomain(row: ProductRow): Product {
    if (!row) {
      throw new Error('ProductMapper mapping error: Cannot map null or undefined row.');
    }

    // Critical validations
    if (row.id === undefined || row.id === null) {
      throw new Error('ProductMapper mapping error: Missing critical field "id".');
    }
    if (!row.slug) {
      throw new Error(`ProductMapper mapping error: Missing critical field "slug" on product ID ${row.id}.`);
    }
    if (!row.name) {
      throw new Error(`ProductMapper mapping error: Missing critical field "name" on product ID ${row.id}.`);
    }
    if (!row.primary_image_path) {
      throw new Error(`ProductMapper mapping error: Missing critical field "primary_image_path" on product ID ${row.id}.`);
    }
    if (row.category_id === undefined || row.category_id === null) {
      throw new Error(`ProductMapper mapping error: Missing critical category ID on product ID ${row.id}.`);
    }

    const retailPriceParsed = Number(row.retail_price);
    const wholesalePriceParsed = row.wholesale_price !== null ? Number(row.wholesale_price) : null;
    const wholesaleMinimumParsed = Number(row.wholesale_minimum ?? 6);
    const stockParsed = Number(row.stock ?? 0);

    // Business Invariant validations (checks retail_price >= 0, etc.)
    if (isNaN(retailPriceParsed) || retailPriceParsed < 0) {
      throw new Error(`ProductMapper mapping error: Invalid retail_price ${row.retail_price} on product ID ${row.id}.`);
    }
    if (wholesalePriceParsed !== null && (isNaN(wholesalePriceParsed) || wholesalePriceParsed < 0)) {
      throw new Error(`ProductMapper mapping error: Invalid wholesale_price ${row.wholesale_price} on product ID ${row.id}.`);
    }
    if (isNaN(wholesaleMinimumParsed) || wholesaleMinimumParsed < 1) {
      throw new Error(`ProductMapper mapping error: Invalid wholesale_minimum ${row.wholesale_minimum} on product ID ${row.id}.`);
    }
    if (isNaN(stockParsed) || stockParsed < 0) {
      throw new Error(`ProductMapper mapping error: Invalid stock ${row.stock} on product ID ${row.id}.`);
    }

    return {
      id: row.id,
      slug: row.slug,
      sku: row.sku ?? null,
      name: row.name,
      description: row.description ?? null,
      retailPrice: retailPriceParsed,
      wholesalePrice: wholesalePriceParsed,
      wholesaleMinimum: wholesaleMinimumParsed,
      stock: stockParsed,
      primaryImagePath: row.primary_image_path,
      featured: Boolean(row.featured),
      published: Boolean(row.published),
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      category: {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
        productType: row.category_product_type,
        scope: row.category_scope,
      },
    };
  }

  /**
   * Maps an array of database rows to an array of Domain Models
   */
  public static toDomainList(rows: ProductRow[]): Product[] {
    return rows.map((row) => this.toDomain(row));
  }
}
