import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { supabase, getSession, initAuth } from '@/lib/supabase';

// Extended user type with company info from company_users
interface UserWithCompany extends User {
  company_id?: string;
  company_name?: string;
}

interface AuthState {
  user: UserWithCompany | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: UserWithCompany | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
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
        // Skip if already loaded and we have a user
        const currentState = get();
        if (!currentState.isLoading && currentState.user && currentState.isAuthenticated) {
          console.log('👤 Usuario ya cargado, saltando fetchUser');
          return;
        }
        
        try {
          set({ isLoading: true });
          
          // Use safe getSession helper that doesn't throw errors
          const { session, error: sessionError } = await getSession();
          
          if (sessionError || !session) {
            // No session is not an error, just means user is not authenticated
            console.log('ℹ️ No active session - user is not authenticated');
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // If we have a session, get the user
          const authUser = session.user;

          if (!authUser) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // Fetch user profile from our users table
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          // Also fetch company info from company_users if user has company role
          let companyInfo: { company_id: string; company_name: string } | null = null;
          if (profile?.role === 'company' || authUser.user_metadata?.role === 'company') {
            const { data: companyUser } = await supabase
              .from('company_users')
              .select(`
                company_id,
                companies (
                  id,
                  company_name
                )
              `)
              .eq('user_id', authUser.id)
              .eq('status', 'active')
              .maybeSingle();
            
            if (companyUser?.companies) {
              companyInfo = {
                company_id: companyUser.company_id,
                company_name: (companyUser.companies as any).company_name,
              };
            }
          }

          if (profileError || !profile) {
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
              const fallbackUser: UserWithCompany = {
                id: authUser.id,
                email: authUser.email || '',
                full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                avatar_url: authUser.user_metadata?.avatar_url,
                role: (authUser.user_metadata?.role as UserRole) || 'customer',
                email_verified: !!authUser.email_confirmed_at,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...companyInfo,
              };
              set({
                user: fallbackUser,
                isAuthenticated: true,
                isLoading: false
              });
              return;
            }

            set({
              user: { ...createdProfile, ...companyInfo } as UserWithCompany,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            set({
              user: { ...profile, ...companyInfo } as UserWithCompany,
              isAuthenticated: true,
              isLoading: false
            });
          }
        } catch (error: any) {
          // Expected behavior: If there's no session, there's no error, just set user to null
          // Only log if it's an unexpected error
          const isExpectedAuthError = error?.message?.includes('Auth session missing') || 
                                      error?.name === 'AuthSessionMissingError' ||
                                      error?.message?.includes('session');
          
          if (!isExpectedAuthError) {
            console.error('❌ Error inesperado al obtener usuario:', error);
          }
          set({ user: null, isAuthenticated: false, isLoading: false });
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
