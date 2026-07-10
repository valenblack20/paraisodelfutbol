import type { Product } from './product.types';
import type { ProductRow } from './product-row.types';

export class ProductMapper {
  /**
   * Maps a single MySQL row (ProductRow) to a clean Domain Model (Product)
   */
  public static toDomain(row: ProductRow): Product {
    if (!row) {
      throw new Error('ProductMapper mapping error: Cannot map null or undefined row.');
    }

    if (row.id === undefined || row.id === null) {
      throw new Error('ProductMapper mapping error: Missing critical field "id".');
    }

    if (!row.nombre) {
      throw new Error(`ProductMapper mapping error: Missing critical field "nombre" on product ID ${row.id}.`);
    }

    if (!row.codigo_foto) {
      throw new Error(`ProductMapper mapping error: Missing critical field "codigo_foto" on product ID ${row.id}.`);
    }

    const precioMinoristaParsed = Number(row.precio_minorista);
    const precioMayoristaParsed = Number(row.precio_mayorista);

    if (isNaN(precioMinoristaParsed)) {
      throw new Error(`ProductMapper mapping error: Invalid decimal format for "precio_minorista" on product ID ${row.id}.`);
    }

    if (isNaN(precioMayoristaParsed)) {
      throw new Error(`ProductMapper mapping error: Invalid decimal format for "precio_mayorista" on product ID ${row.id}.`);
    }

    return {
      id: row.id,
      codigoFoto: row.codigo_foto,
      nombre: row.nombre,
      descripcion: row.descripcion ?? null,
      precioMinorista: precioMinoristaParsed,
      precioMayorista: precioMayoristaParsed,
      categoria: row.categoria || 'Sin Categoría',
      stock: Number(row.stock ?? 0),
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
    };
  }

  /**
   * Maps an array of database rows to an array of Domain Models
   */
  public static toDomainList(rows: ProductRow[]): Product[] {
    return rows.map((row) => this.toDomain(row));
  }
}
