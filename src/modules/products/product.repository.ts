import type { Product } from './product.types';

export interface ProductRepository {
  findCatalogProducts(): Promise<Product[]>;
  findById(id: number): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
}
