import type { RowDataPacket } from 'mysql2';

export interface ProductRow extends RowDataPacket {
  id: number;
  slug: string;
  sku: string | null;
  name: string;
  description: string | null;
  retail_price: string | number;
  wholesale_price: string | number | null;
  wholesale_minimum: number;
  stock: number;
  primary_image_path: string;
  featured: number | boolean;
  published: number | boolean;
  created_at?: Date;
  updated_at?: Date;
  
  // Category JOIN columns
  category_id: number;
  category_name: string;
  category_slug: string;
  category_product_type: 'CLUB' | 'NATIONAL_TEAM' | 'OTHER';
  category_scope: 'NATIONAL' | 'INTERNATIONAL';
}
