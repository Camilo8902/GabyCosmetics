import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

/**
 * Category Service
 * Handles all category-related operations with Supabase
 */
export const categoryService = {
  /**
   * Get all categories (with hierarchy)
   */
  async getCategories(includeInactive = false): Promise<Category[]> {
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Build hierarchy
      const categories = (data || []) as Category[];
      const categoryMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      // First pass: create map
      categories.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });

      // Second pass: build tree
      categories.forEach(cat => {
        const category = categoryMap.get(cat.id)!;
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      return rootCategories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Category;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  },

  /**
   * Get a single category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Category;
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      return null;
    }
  },

  /**
   * Create a new category
   */
  async createCategory(category: Partial<Category>): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  /**
   * Update a category
   */
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  /**
   * Delete a category (soft delete)
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },
};
