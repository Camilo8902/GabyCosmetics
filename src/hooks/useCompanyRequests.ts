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
}

// Obtener todas las solicitudes
export function useCompanyRequests() {
  return useQuery({
    queryKey: ['company-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_requests_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CompanyRequest[];
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

      if (error) throw error;
      return data as CompanyRequest[];
    },
  });
}

// Aprobar solicitud
export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      requestId, 
      notes 
    }: { requestId: string; notes?: string }) => {
      const { error } = await supabase
        .from('company_requests')
        .update({
          status: 'approved',
          notes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-requests'] });
      toast.success('Solicitud aprobada');
    },
    onError: (error: Error) => {
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
      const { error } = await supabase
        .from('company_requests')
        .update({
          status: 'rejected',
          notes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-requests'] });
      toast.success('Solicitud rechazada');
    },
    onError: (error: Error) => {
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
        .select('status', { count: 'exact' })
        .then(async ({ data: statusData }) => {
          const stats = {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
          };
          
          statusData?.forEach((item: { status: string }) => {
            stats.total++;
            if (item.status === 'pending') stats.pending++;
            else if (item.status === 'approved') stats.approved++;
            else if (item.status === 'rejected') stats.rejected++;
          });
          
          return stats;
        });

      if (error) throw error;
      return data;
    },
  });
}
