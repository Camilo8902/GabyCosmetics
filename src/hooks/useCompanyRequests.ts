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

// Aprobar solicitud usando RPC function
export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      requestId, 
      notes 
    }: { requestId: string; notes?: string }) => {
      // Llamar a la función RPC que hace todo el trabajo
      const { data, error } = await supabase.rpc('approve_company_request', {
        p_request_id: requestId,
        p_reviewer_notes: notes || null
      });

      if (error) {
        console.error('Error approving request:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error al aprobar la solicitud');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-requests'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Empresa "${data.company_name}" creada exitosamente`);
    },
    onError: (error: Error) => {
      console.error('Error approving request:', error);
      toast.error(`Error: ${error.message}`);
    },
  });
}

// Rechazar solicitud usando RPC function
export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      requestId, 
      notes 
    }: { requestId: string; notes?: string }) => {
      const { data, error } = await supabase.rpc('reject_company_request', {
        p_request_id: requestId,
        p_reviewer_notes: notes || null
      });

      if (error) {
        console.error('Error rejecting request:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error al rechazar la solicitud');
      }

      return data;
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
      const { data, error } = await supabase
        .from('company_requests')
        .select('status');

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
