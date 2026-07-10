export type ProductType = 'CLUB' | 'NATIONAL_TEAM' | 'OTHER';
export type ProductScope = 'NATIONAL' | 'INTERNATIONAL';

export interface Category {
  id: number;
  name: string;
  slug: string;
  productType: ProductType;
  scope: ProductScope;
}

export interface ProductImage {
  id: number;
  imagePath: string;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: number;
  sizeCode: string;
  sku: string | null;
  stock: number;
  active: boolean;
  displayOrder: number;
}

/**
 * Lightweight representation of a product for catalog cards and grids
 */
export interface ProductSummary {
  id: number;
  slug: string;
  sku: string | null;
  name: string;
  description: string | null;
  retailPrice: number;
  wholesalePrice: number | null;
  wholesaleMinimum: number;
  stock: number; // Legacy total stock cached
  primaryImagePath: string;
  featured: boolean;
  published: boolean;
  category: Category;
}

/**
 * Detailed representation of a product including variants and images
 */
export interface ProductDetail extends ProductSummary {
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt?: Date;
  updatedAt?: Date;
}
