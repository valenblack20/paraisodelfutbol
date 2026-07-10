// src/modules/admin-catalog/admin-catalog.types.ts

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  productType: string;
  scope: string;
  active: boolean;
  displayOrder: number;
  productCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdminProductVariant {
  id?: number;
  productId?: number;
  sizeCode: string;
  stock: number;
  sku: string;
  active: boolean;
  displayOrder: number;
}

export interface AdminProductImage {
  id?: number;
  productId?: number;
  imagePath: string;
  altText: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface AdminProduct {
  id: number;
  categoryId: number;
  categoryName?: string;
  slug: string;
  sku: string;
  name: string;
  description: string | null;
  retailPrice: number;
  wholesalePrice: number | null;
  wholesaleMinimum: number | null;
  stock: number;
  featured: boolean;
  published: boolean;
  version: number;
  archived: boolean;
  archivedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  variants?: AdminProductVariant[];
  images?: AdminProductImage[];
}

export interface CreateCategoryCommand {
  name: string;
  slug: string;
  productType: string;
  scope: string;
  active: boolean;
  displayOrder: number;
}

export interface UpdateCategoryCommand {
  id: number;
  name: string;
  slug: string;
  productType: string;
  scope: string;
  active: boolean;
  displayOrder: number;
}

export interface CreateProductCommand {
  categoryId: number;
  slug: string;
  sku: string;
  name: string;
  description: string | null;
  retailPrice: number;
  wholesalePrice: number | null;
  wholesaleMinimum: number | null;
  featured: boolean;
  published: boolean;
  variants: Omit<AdminProductVariant, 'id' | 'productId'>[];
  images: Omit<AdminProductImage, 'id' | 'productId'>[];
}

export interface UpdateProductCommand {
  id: number;
  categoryId: number;
  slug: string;
  sku: string;
  name: string;
  description: string | null;
  retailPrice: number;
  wholesalePrice: number | null;
  wholesaleMinimum: number | null;
  featured: boolean;
  published: boolean;
  expectedVersion: number;
  variants: Omit<AdminProductVariant, 'id' | 'productId'>[];
  images: Omit<AdminProductImage, 'id' | 'productId'>[];
}

export interface ProductFilter {
  search?: string;
  categoryId?: number;
  published?: boolean;
  archived?: boolean;
  featured?: boolean;
  lowStock?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
