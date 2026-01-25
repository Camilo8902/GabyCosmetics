import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/utils/formatters';
import { startOfMonth, endOfMonth, formatISO } from 'date-fns';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/utils/constants';
import { useTranslation } from 'react-i18next';

export function AdminDashboard() {
  const { i18n } = useTranslation();
  const metrics = useAdminMetrics();
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  // Fetch recent orders
  const { data: recentOrdersData, isLoading: ordersLoading, error: ordersError } = useOrders(
    {
      startDate: formatISO(currentMonthStart),
      endDate: formatISO(currentMonthEnd),
    },
    1,
    5
  );

  // Fetch top products (we'll need to implement this in the service)
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts(
    { is_active: true, is_visible: true },
    1,
    4
  );

  const recentOrders = recentOrdersData?.data || [];
  const topProducts = productsData?.data || [];

  const stats = [
    {
      label: 'Total Productos',
      value: metrics.totalProducts.toLocaleString(),
      change: metrics.productsTrend >= 0 ? `+${metrics.productsTrend.toFixed(1)}%` : `${metrics.productsTrend.toFixed(1)}%`,
      trend: metrics.productsTrend >= 0 ? 'up' : 'down',
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      label: 'Pedidos del Mes',
      value: metrics.totalOrders.toLocaleString(),
      change: metrics.ordersTrend >= 0 ? `+${metrics.ordersTrend.toFixed(1)}%` : `${metrics.ordersTrend.toFixed(1)}%`,
      trend: metrics.ordersTrend >= 0 ? 'up' : 'down',
      icon: ShoppingCart,
      color: 'bg-rose-500',
    },
    {
      label: 'Clientes Activos',
      value: metrics.totalUsers.toLocaleString(),
      change: metrics.usersTrend >= 0 ? `+${metrics.usersTrend.toFixed(1)}%` : `${metrics.usersTrend.toFixed(1)}%`,
      trend: metrics.usersTrend >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'bg-emerald-500',
    },
    {
      label: 'Ingresos',
      value: formatCurrency(metrics.totalRevenue),
      change: metrics.revenueTrend >= 0 ? `+${metrics.revenueTrend.toFixed(1)}%` : `${metrics.revenueTrend.toFixed(1)}%`,
      trend: metrics.revenueTrend >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'bg-amber-500',
    },
  ];

  if (metrics.isLoading || ordersLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show error state if critical data fails
  if (ordersError || productsError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-900 mb-2">Error al cargar datos</h3>
          <p className="text-red-700">
            {ordersError?.message || productsError?.message || 'Error desconocido'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Pedidos Recientes</h2>
            <Link
              to="/admin/orders"
              className="text-sm text-rose-600 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay pedidos recientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.order_number || order.id}</p>
                    <p className="text-sm text-gray-500">
                      {order.user?.full_name || order.user?.email || 'Cliente'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(order.total || 0)}</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status]?.[i18n.language as 'es' | 'en'] || order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Productos Destacados</h2>
            <Link
              to="/admin/products"
              className="text-sm text-rose-600 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay productos disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.slice(0, 4).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-amber-100 rounded-lg flex items-center justify-center font-bold text-rose-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white"
      >
        <h2 className="text-lg font-bold mb-4">Acciones Rápidas</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Agregar Producto', href: '/admin/products/new', icon: Package },
            { label: 'Ver Pedidos', href: '/admin/orders', icon: ShoppingCart },
            { label: 'Gestionar Usuarios', href: '/admin/users', icon: Users },
            { label: 'Ver Reportes', href: '/admin/reports', icon: Eye },
          ].map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className="flex items-center gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <action.icon className="w-5 h-5" />
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
