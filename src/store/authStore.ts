import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;

  // Role checks
  isAdmin: () => boolean;
  isCompany: () => boolean;
  isConsultant: () => boolean;
  isCustomer: () => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Error al cerrar sesión en Supabase:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      fetchUser: async () => {
        try {
          set({ isLoading: true });
          console.log('👤 Obteniendo usuario autenticado...');

          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

          if (authError) {
            console.error('❌ Error al obtener usuario de auth:', authError);
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          if (!authUser) {
            console.log('⚠️ No hay usuario autenticado');
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          console.log('✅ Usuario autenticado encontrado:', authUser.id);

          // Fetch user profile from our users table
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (profileError || !profile) {
            console.log('⚠️ Perfil no encontrado, creando nuevo perfil...');
            
            // If no profile exists, create one with default role
            const newUser: Partial<User> = {
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
              avatar_url: authUser.user_metadata?.avatar_url,
              role: (authUser.user_metadata?.role as UserRole) || 'customer',
              email_verified: !!authUser.email_confirmed_at,
              is_active: true,
            };

            const { data: createdProfile, error: insertError } = await supabase
              .from('users')
              .insert(newUser)
              .select()
              .single();

            if (insertError) {
              console.error('❌ Error al crear perfil de usuario:', insertError);
              // If insert fails, try to use auth user data as fallback
              const fallbackUser: User = {
                id: authUser.id,
                email: authUser.email || '',
                full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                avatar_url: authUser.user_metadata?.avatar_url,
                role: (authUser.user_metadata?.role as UserRole) || 'customer',
                email_verified: !!authUser.email_confirmed_at,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              set({
                user: fallbackUser,
                isAuthenticated: true,
                isLoading: false
              });
              return;
            }

            console.log('✅ Perfil de usuario creado:', createdProfile);
            set({
              user: createdProfile as User,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            console.log('✅ Perfil de usuario encontrado:', profile);
            set({
              user: profile as User,
              isAuthenticated: true,
              isLoading: false
            });
          }
        } catch (error) {
          console.error('❌ Error inesperado al obtener usuario:', error);
          set({ user: null, isAuthenticated: false, isLoading: false });
          throw error; // Re-throw to allow caller to handle
        }
      },

      isAdmin: () => get().user?.role === 'admin',
      isCompany: () => get().user?.role === 'company',
      isConsultant: () => get().user?.role === 'consultant',
      isCustomer: () => get().user?.role === 'customer',
      hasRole: (roles) => {
        const userRole = get().user?.role;
        return userRole ? roles.includes(userRole) : false;
      },
    }),
    {
      name: 'gaby-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
