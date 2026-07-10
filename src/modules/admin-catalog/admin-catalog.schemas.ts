// src/modules/admin-catalog/admin-catalog.schemas.ts
import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const localImagePathRegex = /^\/Imagenes\/[a-zA-Z0-9_\-\.\/]+$/;

export const CategoryInputSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(100, 'El nombre no puede superar los 100 caracteres.'),
  slug: z.string().trim().min(1, 'El slug es obligatorio.').max(100, 'El slug no puede superar los 100 caracteres.').regex(slugRegex, 'El slug debe tener un formato URL válido (ej. "camisetas-nacionales").'),
  productType: z.string().trim().min(1, 'El tipo de producto es obligatorio.').max(50, 'El tipo de producto no puede superar los 50 caracteres.'),
  scope: z.enum(['Nacional', 'Internacional'], {
    errorMap: () => ({ message: 'El ámbito debe ser "Nacional" o "Internacional".' })
  }),
  active: z.boolean({ required_error: 'El estado activo es obligatorio.' }),
  displayOrder: z.number().int().nonnegative('El orden de visualización debe ser un número entero no negativo.')
});

export const ProductVariantInputSchema = z.object({
  sizeCode: z.string().trim().min(1, 'El código de talle es obligatorio.').max(10, 'El código de talle no puede superar los 10 caracteres.'),
  stock: z.number().int().nonnegative('El stock no puede ser negativo.'),
  sku: z.string().trim().min(1, 'El SKU de variante es obligatorio.').max(50, 'El SKU no puede superar los 50 caracteres.'),
  active: z.boolean({ required_error: 'El estado de variante activo es obligatorio.' }),
  displayOrder: z.number().int().nonnegative('El orden de talle debe ser no negativo.')
});

export const ProductImageInputSchema = z.object({
  imagePath: z.string().trim()
    .min(1, 'La ruta de imagen es obligatoria.')
    .regex(localImagePathRegex, 'La ruta de la imagen debe ser local y comenzar con "/Imagenes/".')
    .refine(path => !path.includes('..'), 'No se permiten rutas con directorios relativos (..).')
    .refine(path => !path.startsWith('http') && !path.startsWith('//'), 'No se permiten URLs externas con protocolos.'),
  altText: z.string().trim().max(255, 'El texto alternativo no puede superar los 255 caracteres.'),
  isPrimary: z.boolean({ required_error: 'Debe especificar si la imagen es la principal.' }),
  displayOrder: z.number().int().nonnegative('El orden de imagen debe ser no negativo.')
});

const BaseProductInputSchema = z.object({
  categoryId: z.number().int().positive('La categoría debe ser un ID válido.'),
  slug: z.string().trim().min(1, 'El slug es obligatorio.').max(100, 'El slug no puede superar los 100 caracteres.').regex(slugRegex, 'El slug debe tener un formato URL válido (ej. "camiseta-boca-2024").'),
  sku: z.string().trim().min(1, 'El SKU principal es obligatorio.').max(50, 'El SKU no puede superar los 50 caracteres.'),
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(255, 'El nombre no puede superar los 255 caracteres.'),
  description: z.string().trim().max(1000, 'La descripción no puede superar los 1000 caracteres.').nullable(),
  retailPrice: z.number().nonnegative('El precio minorista no puede ser negativo.'),
  wholesalePrice: z.number().nonnegative('El precio mayorista no puede ser negativo.').nullable(),
  wholesaleMinimum: z.number().int().min(1, 'El mínimo de compra mayorista debe ser al menos 1.').nullable(),
  featured: z.boolean({ required_error: 'El campo destacado es obligatorio.' }),
  published: z.boolean({ required_error: 'El campo publicado es obligatorio.' }),
  variants: z.array(ProductVariantInputSchema),
  images: z.array(ProductImageInputSchema)
});

const refineProduct = (data: any, ctx: z.RefinementCtx) => {
  // Check duplicate sizeCode
  const sizeCodes = data.variants.map((v: any) => v.sizeCode.toLowerCase());
  const uniqueSizeCodes = new Set(sizeCodes);
  if (sizeCodes.length !== uniqueSizeCodes.size) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'No se permiten talles duplicados en el mismo producto.',
      path: ['variants']
    });
  }

  // Check duplicate variant SKU
  const variantSkus = data.variants.map((v: any) => v.sku.toLowerCase());
  const uniqueSkus = new Set(variantSkus);
  if (variantSkus.length !== uniqueSkus.size) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'No se permiten SKUs duplicados en las variantes.',
      path: ['variants']
    });
  }

  // Check duplicate imagePath
  const imagePaths = data.images.map((img: any) => img.imagePath.toLowerCase());
  const uniqueImagePaths = new Set(imagePaths);
  if (imagePaths.length !== uniqueImagePaths.size) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'No se permiten rutas de imagen duplicadas.',
      path: ['images']
    });
  }

  // Check exactly one primary image when images exist
  if (data.images.length > 0) {
    const primaryCount = data.images.filter((img: any) => img.isPrimary).length;
    if (primaryCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe haber exactamente una imagen marcada como principal.',
        path: ['images']
      });
    }
  }
};

export const CreateProductInputSchema = BaseProductInputSchema.superRefine(refineProduct);

export const UpdateProductInputSchema = BaseProductInputSchema.extend({
  id: z.number().int().positive(),
  expectedVersion: z.number().int().positive('La versión del producto es obligatoria.')
}).superRefine(refineProduct);
