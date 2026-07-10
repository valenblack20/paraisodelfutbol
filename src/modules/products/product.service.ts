import type { ProductRepository } from './product.repository';
import type { ProductSummary, ProductDetail } from './product.types';

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  /**
   * Retrieves the full catalog of public products
   */
  public async getCatalog(): Promise<ProductSummary[]> {
    try {
      return await this.productRepository.findCatalogProducts();
    } catch (error) {
      console.error('[ProductService] Error fetching catalog:', error);
      // Return empty array to keep UI safe instead of crashing
      return [];
    }
  }

  /**
   * Retrieves a single public product by its unique slug
   */
  public async getPublicProductBySlug(slug: string): Promise<ProductDetail | null> {
    // Validate slug
    if (!slug || typeof slug !== 'string') {
      return null;
    }
    
    const trimmedSlug = slug.trim();
    if (trimmedSlug.length === 0 || trimmedSlug.length > 180) {
      return null;
    }

    // URL friendly regex validation (alphanumeric and dashes)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(trimmedSlug)) {
      return null;
    }

    try {
      return await this.productRepository.findPublicBySlug(trimmedSlug);
    } catch (error) {
      console.error(`[ProductService] Error fetching product by slug "${trimmedSlug}":`, error);
      throw new Error('La base de datos del catálogo no está disponible.');
    }
  }
}
