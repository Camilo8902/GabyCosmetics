import { supabase } from '@/lib/supabase';
import type {
  Product,
  ProductImage,
  ProductVariant,
  ProductAttribute,
  ProductFilters,
  PaginatedResponse,
  ExtendedProduct,
  ProductSearchFilters,
  ProductListResponse,
  InventoryStatus,
  ExtendedCategory,
  ExtendedCategoryAttribute,
} from '@/types';

// ==========================================
// SERVICIOS DE PRODUCTOS
// ==========================================

/**
 * Obtener productos con filtros y paginación
 * Si companyId es null/undefined, devuelve todos los productos (para admin)
 */
export async function getProducts(
  companyId?: string,
  filters?: ProductFilters,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Product>> {
  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Solo filtrar por company_id si se proporciona
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (filters) {
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.is_visible !== undefined) {
        query = query.eq('is_visible', filters.is_visible);
      }
    }

    const { data, error, count } = await query
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data as Product[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

/**
 * Obtener un producto por ID
 */
export async function getProductById(productId: string): Promise<Product | null> {
  try {
    // First get the product without relationships
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!product) return null;

    // Try to get images separately
    let images: any[] = [];
    try {
      const { data: imagesData } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('order_index', { ascending: true });
      images = imagesData || [];
    } catch (e) {
      console.warn('Could not fetch product images:', e);
    }

    // Try to get categories separately
    let categories: any[] = [];
    try {
      const { data: catsData } = await supabase
        .from('product_categories')
        .select('*, categories(*)')
        .eq('product_id', productId);
      categories = catsData || [];
    } catch (e) {
      console.warn('Could not fetch product categories:', e);
    }

    // Combine product with relations
    const productWithRelations = {
      ...product,
      images,
      categories,
    };

    return productWithRelations as Product;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
}

/**
 * Crear un nuevo producto
 */
export async function createProduct(
  companyId: string,
  product: Partial<Product>
): Promise<Product> {
  try {
    const insertData: any = {
      ...product,
      slug: product.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };

    // Solo agregar company_id si no está vacío
    if (companyId && companyId.trim() !== '') {
      insertData.company_id = companyId;
    }

    const { data, error } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return data as Product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * Actualizar un producto
 */
export async function updateProduct(
  productId: string,
  updates: Partial<Product>
): Promise<Product> {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    return data as Product;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

/**
 * Eliminar un producto
 */
export async function deleteProduct(productId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

/**
 * Duplicar un producto
 */
export async function duplicateProduct(productId: string): Promise<Product> {
  try {
    const original = await getProductById(productId);
    if (!original) throw new Error('Product not found');

    const { id, created_at, updated_at, ...rest } = original;

    const newProduct = await createProduct(rest.company_id || '', {
      ...rest,
      name: `${rest.name} (Copia)`,
      slug: `${rest.slug}-copy-${Date.now()}`,
      is_active: false,
      is_featured: false,
    });

    return newProduct;
  } catch (error) {
    console.error('Error duplicating product:', error);
    throw error;
  }
}

// ==========================================
// SERVICIOS DE IMÁGENES
// ==========================================

/**
 * Agregar imagen a producto
 */
export async function addProductImage(
  productId: string,
  image: Omit<ProductImage, 'id' | 'product_id'>
): Promise<ProductImage> {
  try {
    const { data, error } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        ...image,
      })
      .select()
      .single();

    if (error) throw error;

    return data as ProductImage;
  } catch (error) {
    console.error('Error adding product image:', error);
    throw error;
  }
}

/**
 * Eliminar imagen de producto
 */
export async function deleteProductImage(imageId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting product image:', error);
    throw error;
  }
}

/**
 * Reordenar imágenes
 */
export async function reorderProductImages(
  productId: string,
  imageIds: string[]
): Promise<void> {
  try {
    const updates = imageIds.map((id, index) => ({
      id,
      order_index: index,
    }));

    await supabase.from('product_images').upsert(updates);
  } catch (error) {
    console.error('Error reordering product images:', error);
    throw error;
  }
}

// ==========================================
// SERVICIOS DE VARIANTES
// ==========================================

/**
 * Obtener variantes de un producto
 */
export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return data as ProductVariant[];
  } catch (error) {
    console.error('Error getting product variants:', error);
    throw error;
  }
}

/**
 * Crear variante de producto
 */
export async function createProductVariant(
  productId: string,
  variant: Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>
): Promise<ProductVariant> {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        ...variant,
      })
      .select()
      .single();

    if (error) throw error;

    return data as ProductVariant;
  } catch (error) {
    console.error('Error creating product variant:', error);
    throw error;
  }
}

/**
 * Actualizar variante de producto
 */
export async function updateProductVariant(
  variantId: string,
  updates: Partial<ProductVariant>
): Promise<ProductVariant> {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', variantId)
      .select()
      .single();

    if (error) throw error;

    return data as ProductVariant;
  } catch (error) {
    console.error('Error updating product variant:', error);
    throw error;
  }
}

/**
 * Eliminar variante de producto
 */
export async function deleteProductVariant(variantId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting product variant:', error);
    throw error;
  }
}

// ==========================================
// SERVICIOS DE BÚSQUEDA (SHOP)
// ==========================================

/**
 * Buscar productos para la tienda pública
 */
export async function searchProducts(
  filters?: ProductSearchFilters
): Promise<ProductListResponse> {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        company:companies(id, name, logo_url),
        images:product_images(*),
        categories:product_categories(categories(*))
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('is_visible', true);

    if (filters) {
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.category_ids && filters.category_ids.length > 0) {
        query = query.in('category_id', filters.category_ids);
      }
      if (filters.min_price !== undefined) {
        query = query.gte('base_price', filters.min_price);
      }
      if (filters.max_price !== undefined) {
        query = query.lte('base_price', filters.max_price);
      }
      if (filters.in_stock) {
        query = query.gte('total_stock', 1);
      }
      if (filters.brands && filters.brands.length > 0) {
        query = query.in('brand', filters.brands);
      }
    }

    const page = filters?.page || 1;
    const pageSize = filters?.page_size || 20;

    const { data, error, count } = await query
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      products: data as ExtendedProduct[],
      total: count || 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count || 0) / pageSize),
    };
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}

/**
 * Obtener productos destacados
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_visible', true)
      .eq('is_featured', true)
      .limit(limit);

    if (error) throw error;

    return data as Product[];
  } catch (error) {
    console.error('Error getting featured products:', error);
    throw error;
  }
}

/**
 * Obtener productos más vendidos
 */
export async function getBestSellers(limit = 8): Promise<Product[]> {
  try {
    // Por ahora retornamos productos destacados como best sellers
    return getFeaturedProducts(limit);
  } catch (error) {
    console.error('Error getting best sellers:', error);
    throw error;
  }
}

/**
 * Obtener producto por slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Product;
  } catch (error) {
    console.error('Error getting product by slug:', error);
    throw error;
  }
}

// ==========================================
// SERVICIOS DE CATEGORÍAS
// ==========================================

/**
 * Obtener categorías jerárquicas
 */
export async function getCategories(
  companyId?: string
): Promise<ExtendedCategory[]> {
  try {
    let query = supabase
      .from('categories')
      .select(`
        *,
        attributes:category_attributes(*)
      `)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Construir jerarquía
    const categoryMap = new Map<string, ExtendedCategory>();
    const roots: ExtendedCategory[] = [];

    data?.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    data?.forEach((cat) => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id)!.children!.push(category);
      } else {
        roots.push(category);
      }
    });

    return roots;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
}

/**
 * Crear categoría
 */
export async function createCategory(
  category: Omit<ExtendedCategory, 'id' | 'created_at' | 'updated_at'>
): Promise<ExtendedCategory> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;

    return data as ExtendedCategory;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

/**
 * Actualizar categoría
 */
export async function updateCategory(
  categoryId: string,
  updates: Partial<ExtendedCategory>
): Promise<ExtendedCategory> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;

    return data as ExtendedCategory;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Eliminar categoría
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

// ==========================================
// SERVICIOS DE INVENTARIO
// ==========================================

/**
 * Obtener estado de inventario de un producto
 */
export async function getProductInventory(
  productId: string
): Promise<InventoryStatus> {
  try {
    const product = await getProductById(productId);
    if (!product) throw new Error('Product not found');

    // Usar las propiedades existentes del tipo Product
    const totalStock = (product as any).total_stock || (product as any).inventory?.quantity || 0;
    const lowStockThreshold = (product as any).low_stock_threshold || 10;

    return {
      product_id: productId,
      total_stock: totalStock,
      total_reserved: 0,
      total_available: totalStock,
      low_stock: totalStock <= lowStockThreshold,
      out_of_stock: totalStock === 0,
      warehouses: [],
    };
  } catch (error) {
    console.error('Error getting product inventory:', error);
    throw error;
  }
}

/**
 * Actualizar stock de producto
 */
export async function updateProductStock(
  productId: string,
  quantity: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('products')
      .update({
        total_stock: quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}

/**
 * Ajustar inventario (incremento/decremento)
 */
export async function adjustInventory(
  productId: string,
  adjustment: number,
  reason: string
): Promise<void> {
  try {
    const product = await getProductById(productId);
    if (!product) throw new Error('Product not found');

    const currentStock = (product as any).total_stock || (product as any).inventory?.quantity || 0;
    const newStock = currentStock + adjustment;
    if (newStock < 0) throw new Error('Insufficient stock');

    await updateProductStock(productId, newStock);

    // Registrar movimiento
    await supabase.from('inventory_movements').insert({
      product_id: productId,
      type: 'adjustment',
      quantity_change: adjustment,
      previous_quantity: currentStock,
      new_quantity: newStock,
      reason,
    });
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    throw error;
  }
}

/**
 * Subir imagen de producto - GUARDAR COMO BASE64 EN EL PRODUCTO (igual que categorías)
 */
export async function uploadProductImage(
  productId: string,
  file: File,
  isPrimary = false
): Promise<ProductImage> {
  console.log('🔵 [uploadProductImage] Convirtiendo imagen a base64...');

  try {
    // Convertir archivo a base64
    const reader = new FileReader();
    
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    console.log('✅ [uploadProductImage] Base64 generado, longitud:', base64Data.length);

    // Retornar un "ProductImage" con la URL como base64
    // Esto funciona igual que categorías
    return {
      id: `temp-${Date.now()}`,
      product_id: productId,
      url: base64Data, // Guardamos el base64 directamente
      alt_text: file.name,
      order_index: 0,
      is_primary: isPrimary,
    } as ProductImage;
  } catch (error: any) {
    console.error('❌ [uploadProductImage] Error:', error);
    throw error;
  }
}

/**
 * Asignar categorías a un producto
 */
export async function setProductCategories(
  productId: string,
  categoryIds: string[]
): Promise<void> {
  try {
    // Eliminar categorías existentes
    await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId);

    // Insertar nuevas categorías
    if (categoryIds.length > 0) {
      const inserts = categoryIds.map((categoryId) => ({
        product_id: productId,
        category_id: categoryId,
      }));

      const { error } = await supabase
        .from('product_categories')
        .insert(inserts);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error setting product categories:', error);
    throw error;
  }
}

// Exportar como objeto para facilitar imports
const productService = {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  addProductImage,
  deleteProductImage,
  reorderProductImages,
  uploadProductImage,
  setProductCategories,
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  searchProducts,
  getFeaturedProducts,
  getBestSellers,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductInventory,
  updateProductStock,
  adjustInventory,
};

export { productService };
export type { ProductListResponse, InventoryStatus, ExtendedCategory, ExtendedCategoryAttribute };
