// src/modules/admin-catalog/admin-catalog.service.ts
import type { AdminCatalogRepository } from './admin-catalog.repository.ts';
import { 
  CategoryInputSchema, 
  CreateProductInputSchema, 
  UpdateProductInputSchema 
} from './admin-catalog.schemas.ts';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError, 
  DatabaseUnavailableError 
} from './admin-catalog.errors.ts';
import type { 
  AdminCategory, 
  AdminProduct, 
  CreateCategoryCommand, 
  UpdateCategoryCommand, 
  CreateProductCommand, 
  UpdateProductCommand, 
  ProductFilter, 
  PagedResult 
} from './admin-catalog.types.ts';

export class AdminCatalogService {
  private repository: AdminCatalogRepository;

  constructor(repository: AdminCatalogRepository) {
    this.repository = repository;
  }

  // === Categories ===

  public async getCategories(): Promise<AdminCategory[]> {
    return await this.repository.listCategories();
  }

  public async getCategoryById(id: number): Promise<AdminCategory> {
    const cat = await this.repository.findCategoryById(id);
    if (!cat) throw new NotFoundError('Categoría no encontrada.');
    return cat;
  }

  public async createCategory(adminUserId: number, input: any): Promise<number> {
    const parsed = CategoryInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError('Datos de categoría inválidos.', this.formatZodErrors(parsed.error));
    }
    const cmd = parsed.data;

    // Check unique slug
    const existing = await this.repository.findCategoryBySlug(cmd.slug);
    if (existing) {
      throw new ConflictError('Ese slug ya está siendo utilizado.');
    }

    const categoryId = await this.repository.createCategory(cmd);
    await this.repository.createAuditLog(adminUserId, 'CREATE_CATEGORY', 'category', categoryId, { name: cmd.name });
    return categoryId;
  }

  public async updateCategory(adminUserId: number, id: number, input: any): Promise<void> {
    const parsed = CategoryInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError('Datos de categoría inválidos.', this.formatZodErrors(parsed.error));
    }
    const cmd = parsed.data;

    const category = await this.repository.findCategoryById(id);
    if (!category) throw new NotFoundError('Categoría no encontrada.');

    // Check unique slug
    const existing = await this.repository.findCategoryBySlug(cmd.slug);
    if (existing && existing.id !== id) {
      throw new ConflictError('Ese slug ya está siendo utilizado.');
    }

    const updateCmd: UpdateCategoryCommand = { ...cmd, id };
    await this.repository.updateCategory(updateCmd);
    await this.repository.createAuditLog(adminUserId, 'UPDATE_CATEGORY', 'category', id, { name: cmd.name });
  }

  public async setCategoryActive(adminUserId: number, id: number, active: boolean): Promise<void> {
    const category = await this.repository.findCategoryById(id);
    if (!category) throw new NotFoundError('Categoría no encontrada.');

    await this.repository.setCategoryActive(id, active);
    await this.repository.createAuditLog(
      adminUserId, 
      active ? 'ACTIVATE_CATEGORY' : 'DEACTIVATE_CATEGORY', 
      'category', 
      id, 
      { name: category.name }
    );
  }

  // === Products ===

  public async getProducts(filter: ProductFilter): Promise<PagedResult<AdminProduct>> {
    return await this.repository.listProducts(filter);
  }

  public async getProductById(id: number): Promise<AdminProduct> {
    const prod = await this.repository.findProductForAdmin(id);
    if (!prod) throw new NotFoundError('Producto no encontrado.');
    return prod;
  }

  public async createProduct(adminUserId: number, input: any): Promise<number> {
    const parsed = CreateProductInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError('Datos de producto inválidos.', this.formatZodErrors(parsed.error));
    }
    const cmd = parsed.data;

    // Check unique slug
    const existing = await this.repository.findProductBySlug(cmd.slug);
    if (existing) {
      throw new ConflictError('Ese slug ya está siendo utilizado.');
    }

    const conn = await this.repository.getConnection();
    try {
      await conn.beginTransaction();

      // Validate category
      const category = await this.repository.findCategoryById(cmd.categoryId);
      if (!category) {
        throw new NotFoundError('La categoría especificada no existe.');
      }

      // Insert product core
      const productId = await this.repository.createProduct(cmd, conn);

      // Insert variants
      await this.repository.replaceProductVariants(productId, cmd.variants, conn);

      // Insert images
      await this.repository.replaceProductImages(productId, cmd.images, conn);

      // Sync stock and primary image path
      const activeStock = cmd.variants
        .filter(v => v.active)
        .reduce((sum, v) => sum + v.stock, 0);
      await this.repository.updateProductTotalStock(productId, activeStock, conn);

      const primaryImg = cmd.images.find(img => img.isPrimary);
      await this.repository.updateProductPrimaryImage(productId, primaryImg ? primaryImg.imagePath : null, conn);

      // Log action
      await this.repository.createAuditLog(
        adminUserId,
        'CREATE_PRODUCT',
        'product',
        productId,
        { name: cmd.name, sku: cmd.sku },
        conn
      );

      await conn.commit();
      return productId;
    } catch (error: unknown) {
      await conn.rollback();
      console.error('[AdminCatalogService] Rollback create product:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  public async updateProduct(adminUserId: number, id: number, input: any): Promise<void> {
    const parsed = UpdateProductInputSchema.safeParse({ ...input, id });
    if (!parsed.success) {
      throw new ValidationError('Datos de producto inválidos.', this.formatZodErrors(parsed.error));
    }
    const cmd = parsed.data;

    const prod = await this.repository.findProductForAdmin(id);
    if (!prod) throw new NotFoundError('Producto no encontrado.');

    // Check unique slug
    const existing = await this.repository.findProductBySlug(cmd.slug);
    if (existing && existing.id !== id) {
      throw new ConflictError('Ese slug ya está siendo utilizado.');
    }

    const conn = await this.repository.getConnection();
    try {
      await conn.beginTransaction();

      // Validate category
      const category = await this.repository.findCategoryById(cmd.categoryId);
      if (!category) {
        throw new NotFoundError('La categoría especificada no existe.');
      }

      // Update product core (checks expectedVersion and version checks)
      await this.repository.updateProduct(cmd, conn);

      // Update variants
      await this.repository.replaceProductVariants(id, cmd.variants, conn);

      // Update images
      await this.repository.replaceProductImages(id, cmd.images, conn);

      // Sync stock and primary image path
      const activeStock = cmd.variants
        .filter(v => v.active)
        .reduce((sum, v) => sum + v.stock, 0);
      await this.repository.updateProductTotalStock(id, activeStock, conn);

      const primaryImg = cmd.images.find(img => img.isPrimary);
      await this.repository.updateProductPrimaryImage(id, primaryImg ? primaryImg.imagePath : null, conn);

      // Log action
      await this.repository.createAuditLog(
        adminUserId,
        'UPDATE_PRODUCT',
        'product',
        id,
        { name: cmd.name, sku: cmd.sku },
        conn
      );

      await conn.commit();
    } catch (error: unknown) {
      await conn.rollback();
      console.error('[AdminCatalogService] Rollback update product:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  public async setProductPublished(adminUserId: number, id: number, published: boolean): Promise<void> {
    const prod = await this.repository.findProductForAdmin(id);
    if (!prod) throw new NotFoundError('Producto no encontrado.');

    await this.repository.setProductPublished(id, published);
    await this.repository.createAuditLog(
      adminUserId,
      published ? 'PUBLISH_PRODUCT' : 'UNPUBLISH_PRODUCT',
      'product',
      id,
      { name: prod.name }
    );
  }

  public async setProductFeatured(adminUserId: number, id: number, featured: boolean): Promise<void> {
    const prod = await this.repository.findProductForAdmin(id);
    if (!prod) throw new NotFoundError('Producto no encontrado.');

    await this.repository.setProductFeatured(id, featured);
    await this.repository.createAuditLog(
      adminUserId,
      featured ? 'FEATURE_PRODUCT' : 'UNFEATURE_PRODUCT',
      'product',
      id,
      { name: prod.name }
    );
  }

  public async archiveProduct(adminUserId: number, id: number): Promise<void> {
    const prod = await this.repository.findProductForAdmin(id);
    if (!prod) throw new NotFoundError('Producto no encontrado.');

    await this.repository.archiveProduct(id);
    await this.repository.createAuditLog(adminUserId, 'ARCHIVE_PRODUCT', 'product', id, { name: prod.name });
  }

  public async restoreProduct(adminUserId: number, id: number): Promise<void> {
    const prod = await this.repository.findProductForAdmin(id);
    if (!prod) throw new NotFoundError('Producto no encontrado.');

    await this.repository.restoreProduct(id);
    await this.repository.createAuditLog(adminUserId, 'RESTORE_PRODUCT', 'product', id, { name: prod.name });
  }

  // === Helper ===

  private formatZodErrors(error: any): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      fields[path] = issue.message;
    }
    return fields;
  }
}
