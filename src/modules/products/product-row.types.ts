import type { RowDataPacket } from 'mysql2';

export interface ProductRow extends RowDataPacket {
  id: number;
  codigo_foto: string;
  nombre: string;
  descripcion: string | null;
  precio_minorista: string | number; // DECIMAL fields are often fetched as string or number depending on parser
  precio_mayorista: string | number; // DECIMAL fields are often fetched as string or number depending on parser
  categoria: string;
  stock: number;
  created_at?: Date;
}
