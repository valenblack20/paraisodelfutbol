import type { ProductRepository } from './product.repository';
import type { Product } from './product.types';

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  /**
   * Retrieves the full catalog of products
   */
  public async getCatalog(): Promise<Product[]> {
    return this.productRepository.findCatalogProducts();
  }

  /**
   * Retrieves a single product by its database ID
   */
  public async getProductById(id: number): Promise<Product | null> {
    if (id <= 0 || isNaN(id)) {
      throw new Error(`ProductService error: Invalid product ID: ${id}`);
    }
    return this.productRepository.findById(id);
  }

  /**
   * Retrieves a single product by its unique slug
   */
  public async getProductBySlug(slug: string): Promise<Product | null> {
    if (!slug) {
      throw new Error('ProductService error: Slug is required');
    }
    return this.productRepository.findBySlug(slug);
  }
}
