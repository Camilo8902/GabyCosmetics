import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Building2,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Eye,
  Download,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const consultantNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/consultant' },
  { icon: Package, label: 'Productos', href: '/consultant/products' },
  { icon: ShoppingCart, label: 'Pedidos', href: '/consultant/orders' },
  { icon: Users, label: 'Usuarios', href: '/consultant/users' },
  { icon: Building2, label: 'Empresas', href: '/consultant/companies' },
  { icon: BarChart3, label: 'Reportes', href: '/consultant/reports' },
];

export function ConsultantLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-900 to-blue-800 transform transition-transform duration-300 lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-blue-700">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Gaby Cosmetics" className="h-8 w-auto invert" />
            <span className="text-white font-bold">Consultor</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-blue-300 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Read-only badge */}
        <div className="mx-4 mt-4 p-3 bg-blue-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-200">
            <Eye className="w-4 h-4" />
            <span className="text-sm">Modo Solo Lectura</span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {consultantNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-blue-200 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Panel de Consultor
            </h1>
            <span className="hidden sm:inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Solo Lectura
            </span>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar Datos
            </motion.button>

            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user?.full_name?.charAt(0) || 'C'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2"
                >
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Cerrar Sesión
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// Consultant Dashboard
export function ConsultantDashboard() {
  const stats = [
    { label: 'Total Productos', value: '256', icon: Package },
    { label: 'Total Pedidos', value: '1,429', icon: ShoppingCart },
    { label: 'Usuarios Activos', value: '8,234', icon: Users },
    { label: 'Empresas', value: '12', icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* Read-only notice */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3"
      >
        <Eye className="w-5 h-5 text-blue-600" />
        <p className="text-blue-700">
          Tienes acceso de solo lectura. Puedes ver toda la información pero no realizar modificaciones.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <stat.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Export options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">Exportar Reportes</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Reporte de Ventas', format: 'PDF' },
            { label: 'Lista de Productos', format: 'Excel' },
            { label: 'Usuarios Registrados', format: 'CSV' },
            { label: 'Análisis de Empresas', format: 'PDF' },
          ].map((report, index) => (
            <button
              key={index}
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <Download className="w-5 h-5 text-blue-600" />
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{report.format}</span>
              </div>
              <p className="font-medium text-gray-900">{report.label}</p>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
