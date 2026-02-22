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

// Generar slug único
async function generateUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = baseName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  let slug = baseSlug;
  let counter = 0;
  
  while (true) {
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!data) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  
  return slug;
}

// Aprobar solicitud - crea usuario y empresa
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
      if (requestData.status !== 'pending') throw new Error('La solicitud ya fue procesada');

      // 2. Verificar si ya existe un usuario con ese email en public.users
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', requestData.email)
        .maybeSingle();

      let userId: string;

      if (existingUser) {
        // Usuario ya existe, usar su ID
        userId = existingUser.id;
      } else {
        // 3. Crear usuario con signUp
        // Generar contraseña temporal
        const tempPassword = crypto.randomUUID().slice(0, 16) + 'A1!';
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: requestData.email,
          password: tempPassword,
          options: {
            data: {
              full_name: requestData.owner_name,
              role: 'company'
            },
            // Usar la misma URL de callback para verificación de email
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (signUpError) {
          // Si el usuario ya existe en auth pero no en public.users
          if (signUpError.message.includes('already') || signUpError.message.includes('exists')) {
            // Intentar obtener el usuario de public.users nuevamente
            // Puede ser que el trigger no se ejecutó
            const { data: retryUser } = await supabase
              .from('users')
              .select('id')
              .eq('email', requestData.email)
              .maybeSingle();
            
            if (retryUser) {
              userId = retryUser.id;
            } else {
              throw new Error('El email ya está registrado pero no se encontró el usuario. Contacta al administrador.');
            }
          } else {
            throw signUpError;
          }
        } else if (signUpData?.user) {
          userId = signUpData.user.id;
          // El usuario recibirá un email de verificación de Supabase
          // No enviamos email de restablecimiento aquí para evitar confusión
          // El usuario puede restablecer su contraseña después de verificar
        } else {
          throw new Error('Error al crear usuario');
        }
      }

      // 4. Esperar un momento para que el trigger cree el usuario en public.users
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 5. Verificar que el usuario existe en public.users
      const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!publicUser) {
        // Crear el usuario en public.users manualmente
        const { error: insertUserError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: requestData.email,
            full_name: requestData.owner_name,
            role: 'company',
            is_active: true,
            email_verified: false
          });
        
        if (insertUserError) {
          console.error('Error creating public user:', insertUserError);
          // Continuar de todas formas, el trigger puede haberlo creado
        }
      }

      // 6. Generar slug único
      const slug = await generateUniqueSlug(requestData.business_name);

      // 7. Obtener el usuario admin actual
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      // 8. Crear la empresa
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          user_id: userId,
          company_name: requestData.business_name,
          slug: slug,
          email: requestData.email,
          phone: requestData.phone,
          business_type: requestData.business_type,
          status: 'active',
          is_active: true,
          is_verified: true,
          plan: 'basic',
          approved_by: adminUser?.id,
          approved_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        throw companyError;
      }

      // 9. Actualizar la solicitud
      const { error: updateError } = await supabase
        .from('company_requests')
        .update({
          status: 'approved',
          notes: notes || requestData.notes,
          reviewed_by: adminUser?.id,
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
        request: requestData,
        userId 
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-requests'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Empresa "${data.company.company_name}" creada exitosamente`);
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
