import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// i18n
import '@/i18n';

// Stores
import { useAuthStore } from '@/store/authStore';

// Layouts
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/common/CartDrawer';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { CompanyLayout } from '@/pages/company/CompanyLayout';
import { ConsultantLayout } from '@/pages/consultant/ConsultantLayout';

// Pages
import { HomePage } from '@/pages/HomePage';
import { ShopPage } from '@/pages/shop/ShopPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { AuthCallback } from '@/pages/auth/AuthCallback';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { ProductsList } from '@/pages/admin/products/ProductsList';
import { ProductForm } from '@/pages/admin/products/ProductForm';
import { ProductDetail } from '@/pages/admin/products/ProductDetail';
import { OrdersList } from '@/pages/admin/orders/OrdersList';
import { OrderDetail } from '@/pages/admin/orders/OrderDetail';
import { UsersList } from '@/pages/admin/users/UsersList';
import { UserDetail } from '@/pages/admin/users/UserDetail';
import { CompaniesList } from '@/pages/admin/companies/CompaniesList';
import { CompanyDetail } from '@/pages/admin/companies/CompanyDetail';
import { CompanyDashboard } from '@/pages/company/CompanyLayout';
import { ConsultantDashboard } from '@/pages/consultant/ConsultantLayout';

// Supabase
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.message?.includes('Auth') || 
            error?.message?.includes('session') ||
            error?.message?.includes('JWT') ||
            error?.code === 'PGRST301') {
          return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false, // Prevent refetch when tab becomes active (fixes blank page issue)
      refetchOnReconnect: true,
      refetchOnMount: true,
      onError: (error: any) => {
        // Handle auth errors globally
        if (error?.message?.includes('Auth') || 
            error?.message?.includes('session') ||
            error?.code === 'PGRST301') {
          console.warn('⚠️ Error de autenticación en query:', error);
          // Don't redirect here, let ProtectedRoute handle it
        }
      },
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        if (error?.message?.includes('Auth') || 
            error?.message?.includes('session') ||
            error?.code === 'PGRST301') {
          console.warn('⚠️ Error de autenticación en mutation:', error);
        }
      },
    },
  },
});

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600">Verificando acceso...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">
            Tu rol actual ({user.role}) no tiene acceso a esta sección.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <CartDrawer />
    </>
  );
}

function App() {
  const { fetchUser, setLoading, setUser } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Check if there's any indication of a stored session
        // Supabase stores session in localStorage with key pattern: sb-<project-ref>-auth-token
        // Check all possible Supabase session storage keys
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';
        
        // Supabase stores session in multiple possible keys
        const possibleKeys = [
          projectRef ? `sb-${projectRef}-auth-token` : null,
          'sb-auth-token',
          ...Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('sb-')),
        ].filter(Boolean) as string[];
        
        const hasStoredSession = possibleKeys.some(key => localStorage.getItem(key));
        const hasCookie = document.cookie.includes('sb-') || document.cookie.includes('supabase');
        
        if (hasStoredSession || hasCookie) {
          // There might be a session, try to fetch user
          await fetchUser();
        } else {
          // No stored session, user is definitely not authenticated
          // This is normal and not an error
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error: any) {
        // Silently handle auth errors - they're expected when user is not logged in
        // Don't log AuthSessionMissingError as it's normal
        if (!error?.message?.includes('Auth session missing') && 
            error?.name !== 'AuthSessionMissingError') {
          console.error('Auth check error:', error);
        }
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      try {
        console.log('🔄 Auth state changed:', event, session ? 'with session' : 'no session');
        
        if (event === 'SIGNED_IN' && session) {
          // Only fetch user when we have a valid session
          await fetchUser();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Token refreshed, update user data
          await fetchUser();
        } else if (event === 'SIGNED_OUT') {
          // User signed out, clear state
          useAuthStore.getState().setUser(null);
          useAuthStore.getState().setLoading(false);
        } else if (event === 'USER_UPDATED' && session) {
          // User updated, refresh data
          await fetchUser();
        } else if (event === 'INITIAL_SESSION' && session) {
          // Initial session on page load
          await fetchUser();
        }
        // For other events (like 'MFAChallengeVerified', etc.), do nothing
      } catch (error: any) {
        // Silently handle errors in auth state changes
        // AuthSessionMissingError is expected when there's no session
        if (!error?.message?.includes('Auth session missing') && 
            error?.name !== 'AuthSessionMissingError') {
          console.error('Error en auth state change:', error);
        }
        // On error, ensure loading is set to false
        useAuthStore.getState().setLoading(false);
      }
    });

    // Handle visibility change (when tab becomes active again)
    // Only refresh if we've already completed initial auth check
    const handleVisibilityChange = () => {
      if (!document.hidden && mounted) {
        const authState = useAuthStore.getState();
        // Only re-check auth if we're not still loading and we have a previous session
        if (!authState.isLoading) {
          console.log('👁️ Tab became visible, checking auth...');
          // Use a debounced check to avoid excessive calls
          setTimeout(() => {
            if (mounted) {
              checkAuth();
            }
          }, 100);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/shop" element={<PublicLayout><ShopPage /></PublicLayout>} />
          <Route path="/categories" element={<PublicLayout><ShopPage /></PublicLayout>} />
          <Route path="/product/:slug" element={<PublicLayout><ShopPage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><div className="min-h-screen pt-24 flex items-center justify-center"><h1 className="text-4xl font-bold">Sobre Nosotros</h1></div></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><div className="min-h-screen pt-24 flex items-center justify-center"><h1 className="text-4xl font-bold">Contacto</h1></div></PublicLayout>} />
          <Route path="/wishlist" element={<PublicLayout><div className="min-h-screen pt-24 max-w-7xl mx-auto px-4 py-8"><h1 className="text-3xl font-bold mb-6">Lista de Deseos</h1></div></PublicLayout>} />

          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route path="/account" element={<ProtectedRoute><PublicLayout><div className="min-h-screen pt-24 max-w-7xl mx-auto px-4 py-8"><h1 className="text-3xl font-bold mb-6">Mi Cuenta</h1></div></PublicLayout></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><div className="min-h-screen flex items-center justify-center"><h1 className="text-3xl font-bold">Checkout</h1></div></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="users" element={<UsersList />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="companies" element={<CompaniesList />} />
            <Route path="companies/:id" element={<CompanyDetail />} />
            <Route path="categories" element={<div><h1 className="text-2xl font-bold mb-6">Gestión de Categorías</h1></div>} />
            <Route path="reports" element={<div><h1 className="text-2xl font-bold mb-6">Reportes</h1></div>} />
            <Route path="settings" element={<div><h1 className="text-2xl font-bold mb-6">Configuración</h1></div>} />
          </Route>

          <Route path="/company" element={<ProtectedRoute allowedRoles={['company']}><CompanyLayout /></ProtectedRoute>}>
            <Route index element={<CompanyDashboard />} />
            <Route path="products" element={<div><h1 className="text-2xl font-bold mb-6">Mis Productos</h1></div>} />
            <Route path="products/new" element={<div><h1 className="text-2xl font-bold mb-6">Nuevo Producto</h1></div>} />
            <Route path="orders" element={<div><h1 className="text-2xl font-bold mb-6">Pedidos</h1></div>} />
            <Route path="stats" element={<div><h1 className="text-2xl font-bold mb-6">Estadísticas</h1></div>} />
            <Route path="settings" element={<div><h1 className="text-2xl font-bold mb-6">Configuración</h1></div>} />
          </Route>

          <Route path="/consultant" element={<ProtectedRoute allowedRoles={['consultant']}><ConsultantLayout /></ProtectedRoute>}>
            <Route index element={<ConsultantDashboard />} />
            <Route path="products" element={<div><h1 className="text-2xl font-bold mb-6">Productos (Solo Lectura)</h1></div>} />
            <Route path="orders" element={<div><h1 className="text-2xl font-bold mb-6">Pedidos (Solo Lectura)</h1></div>} />
            <Route path="users" element={<div><h1 className="text-2xl font-bold mb-6">Usuarios (Solo Lectura)</h1></div>} />
            <Route path="companies" element={<div><h1 className="text-2xl font-bold mb-6">Empresas (Solo Lectura)</h1></div>} />
            <Route path="reports" element={<div><h1 className="text-2xl font-bold mb-6">Reportes</h1></div>} />
          </Route>

          <Route path="*" element={<PublicLayout><div className="min-h-screen pt-24 flex items-center justify-center"><div className="text-center"><h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1><p className="text-xl text-gray-600 mb-8">Página no encontrada</p><a href="/" className="px-6 py-3 bg-rose-600 text-white rounded-full font-medium hover:bg-rose-700 transition-colors">Volver al Inicio</a></div></div></PublicLayout>} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#363636', color: '#fff', borderRadius: '12px' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
