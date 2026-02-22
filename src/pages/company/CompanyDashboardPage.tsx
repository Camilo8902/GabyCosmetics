import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { useCompanyId, useCompanyMetrics, useTopProducts, useRecentOrders, useRevenueChart } from '@/hooks/useCompanyMetrics';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';

// Componente de tarjeta de estadística
function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'rose' 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'rose' | 'blue' | 'green' | 'amber';
}) {
  const colorClasses = {
    rose: 'bg-rose-100 text-rose-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && trendValue && (
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium',
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : null}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

// Componente de gráfico simple de barras
function SimpleBarChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  
  return (
    <div className="h-48 flex items-end gap-1">
      {data.slice(-14).map((item, index) => {
        const height = (item.revenue / maxRevenue) * 100;
        return (
          <div
            key={item.date}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className="w-full bg-rose-500 rounded-t transition-all duration-300 hover:bg-rose-600"
              style={{ height: `${Math.max(height, 4)}%` }}
              title={`${formatCurrency(item.revenue)} - ${item.orders} pedidos`}
            />
          </div>
        );
      })}
    </div>
  );
}

// Componente de estado de pedido
const orderStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export function CompanyDashboardPage() {
  const { companyId, role, permissions } = useCompanyId();
  const { data: metrics, isLoading: metricsLoading } = useCompanyMetrics(companyId);
  const { data: topProducts, isLoading: topProductsLoading } = useTopProducts(companyId);
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders(companyId);
  const { data: revenueChart, isLoading: chartLoading } = useRevenueChart(companyId);

  const isLoading = metricsLoading || topProductsLoading || ordersLoading || chartLoading;

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">No tienes una empresa asociada</h2>
          <p className="text-gray-600 mb-4">Registra tu empresa para comenzar a vender en el marketplace.</p>
          <Link
            to="/company/register"
            className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            Registrar mi empresa
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Resumen de tu actividad comercial</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Rol: <span className="font-medium text-gray-700">{role}</span></span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Productos Activos"
          value={metrics?.activeProducts || 0}
          icon={Package}
          color="rose"
          trend="neutral"
          trendValue={`de ${metrics?.totalProducts || 0} total`}
        />
        <StatCard
          label="Pedidos del Mes"
          value={metrics?.totalOrders || 0}
          icon={ShoppingCart}
          color="blue"
          trend={metrics?.pendingOrders ? 'up' : 'neutral'}
          trendValue={`${metrics?.pendingOrders || 0} pendientes`}
        />
        <StatCard
          label="Ingresos del Mes"
          value={formatCurrency(metrics?.monthlyRevenue || 0)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          label="Stock Bajo"
          value={metrics?.lowStockProducts || 0}
          icon={AlertTriangle}
          color="amber"
          trend={metrics?.lowStockProducts > 0 ? 'down' : 'neutral'}
          trendValue={metrics?.lowStockProducts > 0 ? 'Requiere atención' : 'Todo bien'}
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ingresos</h2>
              <p className="text-sm text-gray-500">Últimos 14 días</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics?.totalRevenue || 0)}</p>
              <p className="text-sm text-gray-500">Total acumulado</p>
            </div>
          </div>
          
          {revenueChart && revenueChart.length > 0 ? (
            <SimpleBarChart data={revenueChart} />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No hay datos de ventas aún
            </div>
          )}
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Productos Top</h2>
            <Link to="/company/products" className="text-sm text-rose-600 hover:underline">
              Ver todos
            </Link>
          </div>
          
          {topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.total_sold} vendidos
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(product.total_revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay ventas aún</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm"
      >
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Pedidos Recientes</h2>
          <Link to="/company/orders" className="text-sm text-rose-600 hover:underline">
            Ver todos
          </Link>
        </div>

        {recentOrders && recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{order.order_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{order.customer_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        orderStatusConfig[order.status]?.color || 'bg-gray-100 text-gray-700'
                      )}>
                        {orderStatusConfig[order.status]?.label || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/company/orders/${order.id}`}
                        className="text-rose-600 hover:underline text-sm"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay pedidos aún</p>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Link
          to="/company/products/new"
          className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
        >
          <Package className="w-5 h-5 text-rose-600" />
          <span className="font-medium text-rose-700">Nuevo Producto</span>
        </Link>
        <Link
          to="/company/orders"
          className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-700">Ver Pedidos</span>
        </Link>
        <Link
          to="/company/inventory"
          className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span className="font-medium text-amber-700">Inventario</span>
        </Link>
        <Link
          to="/company/settings"
          className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Estadísticas</span>
        </Link>
      </motion.div>
    </div>
  );
}
