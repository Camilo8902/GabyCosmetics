import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export interface CompanyRequest {
  id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone?: string;
  business_type?: string;
  products_count?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  submitted_at: string;
  created_at: string;
  updated_at?: string;
}

// Obtener todas las solicitudes
export function useCompanyRequests() {
  return useQuery({
    queryKey: ['company-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching company requests:', error);
        throw error;
      }
      return (data || []) as CompanyRequest[];
    },
  });
}

// Obtener solicitudes pendientes
export function usePendingRequests() {
  return useQuery({
    queryKey: ['company-requests', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending requests:', error);
        throw error;
      }
      return (data || []) as CompanyRequest[];
    },
  });
}

// Aprobar solicitud y crear empresa
export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      requestId, 
      notes 
    }: { requestId: string; notes?: string }) => {
      // 1. Obtener la solicitud
      const { data: requestData, error: fetchError } = await supabase
        .from('company_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;
      if (!requestData) throw new Error('Solicitud no encontrada');

      // 2. Generar slug único
      const baseSlug = requestData.business_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      let slug = baseSlug;
      let counter = 0;
      
      // Verificar que el slug sea único
      while (true) {
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('slug', slug)
          .single();
        
        if (!existingCompany) break;
        counter++;
        slug = `${baseSlug}-${counter}`;
      }

      // 3. Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      // 4. Crear la empresa en la tabla companies
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          company_name: requestData.business_name,
          slug: slug,
          email: requestData.email,
          phone: requestData.phone,
          description: null,
          business_type: requestData.business_type,
          status: 'active',
          is_active: true,
          is_verified: true,
          plan: 'basic',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        throw companyError;
      }

      // 5. Actualizar la solicitud
      const { error: updateError } = await supabase
        .from('company_requests')
        .update({
          status: 'approved',
          notes: notes || requestData.notes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request:', updateError);
        throw updateError;
      }

      return { 
        success: true, 
        company: newCompany,
        request: requestData 
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-requests'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Solicitud aprobada y empresa creada');
    },
    onError: (error: Error) => {
      console.error('Error approving request:', error);
      toast.error(`Error: ${error.message}`);
    },
  });
}

// Rechazar solicitud
export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      requestId, 
      notes 
    }: { requestId: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('company_requests')
        .update({
          status: 'rejected',
          notes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-requests'] });
      toast.success('Solicitud rechazada');
    },
    onError: (error: Error) => {
      console.error('Error rejecting request:', error);
      toast.error(`Error: ${error.message}`);
    },
  });
}

// Estadísticas de solicitudes
export function useRequestsStats() {
  return useQuery({
    queryKey: ['company-requests', 'stats'],
    queryFn: async () => {
      // Obtener todas las solicitudes para contar
      const { data, error, count } = await supabase
        .from('company_requests')
        .select('status', { count: 'exact' });

      if (error) {
        console.error('Error fetching request stats:', error);
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      };
      
      data?.forEach((item: { status: string }) => {
        if (item.status === 'pending') stats.pending++;
        else if (item.status === 'approved') stats.approved++;
        else if (item.status === 'rejected') stats.rejected++;
      });
      
      return stats;
    },
  });
}
