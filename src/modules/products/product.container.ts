import { getDatabasePool } from '../../infrastructure/database/mysql';
import { MySqlProductRepository } from './mysql-product.repository';
import { ProductService } from './product.service';

// Initialize pool and wire layers together
const pool = getDatabasePool();
const productRepository = new MySqlProductRepository(pool);

export const productService = new ProductService(productRepository);
