export type ProductType = 'CLUB' | 'NATIONAL_TEAM' | 'OTHER';
export type ProductScope = 'NATIONAL' | 'INTERNATIONAL';

export interface Category {
  id: number;
  name: string;
  slug: string;
  productType: ProductType;
  scope: ProductScope;
}

export interface Product {
  id: number;
  slug: string;
  sku: string | null;
  name: string;
  description: string | null;
  retailPrice: number;
  wholesalePrice: number | null;
  wholesaleMinimum: number;
  stock: number;
  primaryImagePath: string;
  featured: boolean;
  published: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  category: Category;
}
