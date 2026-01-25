import { supabase } from '@/lib/supabase';
import type { Product, ProductFilters, PaginatedResponse } from '@/types';

/**
 * Product Service
 * Handles all product-related operations with Supabase
 */
export const productService = {
  /**
   * Get all products with filters and pagination
   */
  async getProducts(filters?: ProductFilters, page = 1, pageSize = 20): Promise<PaginatedResponse<Product>> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          categories:product_categories(category:categories(*)),
          company:companies(*),
          inventory:inventory(*)
        `, { count: 'exact' });

      // Only filter by active/visible if not explicitly requesting all products (for admin panel)
      if (filters?.includeInactive !== true) {
        query = query.eq('is_active', true);
      }
      if (filters?.includeInvisible !== true) {
        query = query.eq('is_visible', true);
      }

      // Apply explicit status filters if provided
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.is_visible !== undefined) {
        query = query.eq('is_visible', filters.is_visible);
      }

      // Apply filters
      if (filters?.categoryId) {
        const { data: categoryProducts } = await supabase
          .from('product_categories')
          .select('product_id')
          .eq('category_id', filters.categoryId);
        
        const productIds = categoryProducts?.map((item) => item.product_id) || [];
        if (productIds.length > 0) {
          query = query.in('id', productIds);
        } else {
          // Return empty result if no products found for this category
          return {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          };
        }
      }

      if (filters?.minPrice) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,name_en.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }

      if (filters?.inStock) {
        query = query.gt('inventory.quantity', 0);
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error en query de productos:', error);
        // If it's an auth error, return empty result instead of throwing
        if (error.message?.includes('Auth') || error.code === 'PGRST301') {
          return {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          };
        }
        throw error;
      }

      const totalPages = count ? Math.ceil(count / pageSize) : 0;

      return {
        data: (data || []) as Product[],
        total: count || 0,
        page,
        pageSize,
        totalPages,
      };
    } catch (error: any) {
      console.error('Error fetching products:', error);
      // Return empty result for auth errors instead of throwing
      if (error?.message?.includes('Auth') || error?.code === 'PGRST301') {
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }
      throw error;
    }
  },

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          categories:product_categories(category:categories(*)),
          attributes:product_attributes(category_attribute:category_attributes(*)),
          company:companies(*),
          inventory:inventory(*),
          reviews:reviews(*, user:users(*))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  /**
   * Get a single product by slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          categories:product_categories(category:categories(*)),
          attributes:product_attributes(category_attribute:category_attributes(*)),
          company:companies(*),
          inventory:inventory(*),
          reviews:reviews(*, user:users(*))
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error('Error fetching product by slug:', error);
      return null;
    }
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          company:companies(*)
        `)
        .eq('is_featured', true)
        .eq('is_active', true)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Product[];
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  },

  /**
   * Get best sellers
   */
  async getBestSellers(limit = 8): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          company:companies(*)
        `)
        .eq('is_active', true)
        .eq('is_visible', true)
        .order('sales_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Product[];
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      return [];
    }
  },

  /**
   * Create a new product
   */
  async createProduct(product: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Update a product
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  /**
   * Delete a product (soft delete by setting is_active = false)
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  /**
   * Upload product images
   */
  async uploadProductImage(productId: string, file: File, isPrimary = false): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Save image record to database
      const { error: dbError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          url: publicUrl,
          is_primary: isPrimary,
          order_index: 0,
        });

      if (dbError) throw dbError;

      return publicUrl;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  },

  /**
   * Link categories to a product
   */
  async setProductCategories(productId: string, categoryIds: string[]): Promise<void> {
    try {
      // First delete existing category associations
      await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', productId);

      // Then insert new ones if any
      if (categoryIds && categoryIds.length > 0) {
        const { error } = await supabase
          .from('product_categories')
          .insert(
            categoryIds.map((categoryId) => ({
              product_id: productId,
              category_id: categoryId,
            }))
          );

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error setting product categories:', error);
      throw error;
    }
  },
};
