import { supabase } from '@/lib/supabase';
import type { Company, PaginatedResponse } from '@/types';

/**
 * Company Service
 * Handles all company-related operations with Supabase
 */
export const companyService = {
  /**
   * Get all companies with filters and pagination
   */
  async getCompanies(
    filters?: {
      isVerified?: boolean;
      isActive?: boolean;
      search?: string;
    },
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<Company>> {
    try {
      let query = supabase
        .from('companies')
        .select(`
          *,
          user:users(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.isVerified !== undefined) {
        query = query.eq('is_verified', filters.isVerified);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters?.search) {
        query = query.or(`company_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error en query de empresas:', error);
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
        data: (data || []) as Company[],
        total: count || 0,
        page,
        pageSize,
        totalPages,
      };
    } catch (error: any) {
      console.error('Error fetching companies:', error);
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
   * Get a single company by ID
   */
  async getCompanyById(id: string): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          user:users(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Company;
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  },

  /**
   * Get company by user ID
   */
  async getCompanyByUserId(userId: string): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          user:users(*)
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as Company;
    } catch (error) {
      console.error('Error fetching company by user ID:', error);
      return null;
    }
  },

  /**
   * Create a new company
   */
  async createCompany(company: Partial<Company>): Promise<Company> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert(company)
        .select()
        .single();

      if (error) throw error;
      return data as Company;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  },

  /**
   * Update a company
   */
  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Company;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  },

  /**
   * Verify a company
   */
  async verifyCompany(id: string): Promise<Company> {
    return this.updateCompany(id, { is_verified: true });
  },

  /**
   * Activate/deactivate company
   */
  async toggleCompanyActive(id: string, isActive: boolean): Promise<Company> {
    return this.updateCompany(id, { is_active: isActive });
  },
};
