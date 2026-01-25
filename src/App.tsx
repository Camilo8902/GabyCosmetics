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
import { CompanyDashboard } from '@/pages/company/CompanyLayout';
import { ConsultantDashboard } from '@/pages/consultant/ConsultantLayout';

// Supabase
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
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

  // Debug logging
  if (allowedRoles) {
    console.log('🔒 ProtectedRoute - Verificando acceso:', {
      isLoading,
      isAuthenticated,
      userRole: user?.role,
      allowedRoles,
      hasAccess: user && allowedRoles.includes(user.role),
    });
  }

  if (isLoading) {
    console.log('⏳ ProtectedRoute - Cargando...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute - No autenticado, redirigiendo a login');
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log('❌ ProtectedRoute - Rol no permitido:', {
      userRole: user.role,
      allowedRoles,
    });
    return <Navigate to="/" replace />;
  }

  console.log('✅ ProtectedRoute - Acceso permitido');
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
  const { fetchUser, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await fetchUser();
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await fetchUser();
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.getState().logout();
      }
    });

    return () => {
      subscription.unsubscribe();
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
            <Route path="products" element={<div><h1 className="text-2xl font-bold mb-6">Gestión de Productos</h1></div>} />
            <Route path="orders" element={<div><h1 className="text-2xl font-bold mb-6">Gestión de Pedidos</h1></div>} />
            <Route path="users" element={<div><h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1></div>} />
            <Route path="companies" element={<div><h1 className="text-2xl font-bold mb-6">Gestión de Empresas</h1></div>} />
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
