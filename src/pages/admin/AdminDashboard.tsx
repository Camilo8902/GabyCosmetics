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

const stats = [
  {
    label: 'Total Productos',
    value: '256',
    change: '+12%',
    trend: 'up',
    icon: Package,
    color: 'bg-blue-500',
  },
  {
    label: 'Pedidos del Mes',
    value: '1,429',
    change: '+8%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'bg-rose-500',
  },
  {
    label: 'Clientes Activos',
    value: '8,234',
    change: '+23%',
    trend: 'up',
    icon: Users,
    color: 'bg-emerald-500',
  },
  {
    label: 'Ingresos',
    value: '$89,432',
    change: '-3%',
    trend: 'down',
    icon: DollarSign,
    color: 'bg-amber-500',
  },
];

const recentOrders = [
  { id: 'GC-20250124-001', customer: 'María García', total: 549, status: 'pending' },
  { id: 'GC-20250124-002', customer: 'Laura Martínez', total: 299, status: 'processing' },
  { id: 'GC-20250124-003', customer: 'Ana López', total: 899, status: 'shipped' },
  { id: 'GC-20250124-004', customer: 'Carmen Rodríguez', total: 199, status: 'delivered' },
  { id: 'GC-20250124-005', customer: 'Patricia Sánchez', total: 449, status: 'pending' },
];

const topProducts = [
  { name: 'Kit Completo Cabello', sales: 234, revenue: 186966 },
  { name: 'Shampoo Reparador', sales: 189, revenue: 56511 },
  { name: 'Aceite de Argán', sales: 156, revenue: 62244 },
  { name: 'Mascarilla Premium', sales: 134, revenue: 60066 },
];

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export function AdminDashboard() {
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

          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-500">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${order.total}</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      statusColors[order.status]
                    }`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Productos Más Vendidos</h2>
            <Link
              to="/admin/products"
              className="text-sm text-rose-600 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-amber-100 rounded-lg flex items-center justify-center font-bold text-rose-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} ventas</p>
                  </div>
                </div>
                <p className="font-bold text-gray-900">
                  ${product.revenue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
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
