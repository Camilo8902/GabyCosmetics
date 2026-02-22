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
      companyId?: string;
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

      if (filters?.companyId) {
        query = query.eq('company_id', filters.companyId);
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
   * Create a new user (admin function)
   */
  async createUser(userData: {
    email: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    company_id?: string;
    is_active?: boolean;
    password: string;
  }): Promise<User> {
    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Error creating user');

      // Then update the user record with additional data
      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: userData.full_name,
          role: userData.role,
          phone: userData.phone,
          company_id: userData.company_id,
          is_active: userData.is_active ?? true,
          email_verified: false,
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      if (error) throw error;
      return data as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update user
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
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
   * Delete user (soft delete by deactivating)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      // Soft delete - just deactivate the user
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  /**
   * Permanently delete user
   */
  async permanentDeleteUser(id: string): Promise<void> {
    try {
      // Delete from users table
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Note: This doesn't delete the auth user. That would require admin API access.
    } catch (error) {
      console.error('Error permanently deleting user:', error);
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

  /**
   * Assign user to company
   */
  async assignUserToCompany(userId: string, companyId: string | null): Promise<User> {
    return this.updateUser(userId, { company_id: companyId });
  },

  /**
   * Get users by company
   */
  async getUsersByCompany(companyId: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as User[];
    } catch (error) {
      console.error('Error fetching company users:', error);
      return [];
    }
  },

  /**
   * Check if email exists
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  },
};
