import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { supabase, getSession, initAuth } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
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
        try {
          set({ isLoading: true });
          
          // Use safe getSession helper that doesn't throw errors
          const { session, error: sessionError } = await getSession();
          
          if (sessionError || !session) {
            // No session is not an error, just means user is not authenticated
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
            .single();

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

            set({
              user: createdProfile as User,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            set({
              user: profile as User,
              isAuthenticated: true,
              isLoading: false
            });
          }
        } catch (error: any) {
          // Don't log AuthSessionMissingError as it's expected when not authenticated
          // This error is completely normal when user is not logged in
          if (!error?.message?.includes('Auth session missing') && 
              error?.name !== 'AuthSessionMissingError') {
            // Only log real errors, not "no session" errors
            console.error('❌ Error inesperado al obtener usuario:', error);
          }
          set({ user: null, isAuthenticated: false, isLoading: false });
          // Don't throw - just silently fail, it's expected when not authenticated
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
