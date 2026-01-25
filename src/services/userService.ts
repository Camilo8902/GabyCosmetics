import { supabase } from '@/lib/supabase';
import type { User, UserRole, PaginatedResponse } from '@/types';

/**
 * User Service
 * Handles all user-related operations with Supabase
 */
export const userService = {
  /**
   * Get all users with filters and pagination
   */
  async getUsers(
    filters?: {
      role?: UserRole;
      isActive?: boolean;
      search?: string;
    },
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<User>> {
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.role) {
        query = query.eq('role', filters.role);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters?.search) {
        query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
      }

      // Apply sorting
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error en query de usuarios:', error);
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
        data: (data || []) as User[],
        total: count || 0,
        page,
        pageSize,
        totalPages,
      };
    } catch (error: any) {
      console.error('Error fetching users:', error);
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
   * Get a single user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  /**
   * Update user
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  /**
   * Update user role
   */
  async updateUserRole(id: string, role: UserRole): Promise<User> {
    return this.updateUser(id, { role });
  },

  /**
   * Activate/deactivate user
   */
  async toggleUserActive(id: string, isActive: boolean): Promise<User> {
    return this.updateUser(id, { is_active: isActive });
  },
};
