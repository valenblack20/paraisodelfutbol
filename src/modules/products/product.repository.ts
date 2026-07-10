import type { ProductSummary, ProductDetail } from './product.types';

export interface ProductRepository {
  findCatalogProducts(): Promise<ProductSummary[]>;
  findById(id: number): Promise<ProductDetail | null>;
  findPublicBySlug(slug: string): Promise<ProductDetail | null>;
}
