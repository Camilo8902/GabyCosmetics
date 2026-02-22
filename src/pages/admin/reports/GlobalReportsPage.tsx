import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Building2,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  Eye,
} from 'lucide-react';
import {
  useGlobalMetrics,
  useCompanyGrowth,
  useRevenueByCompany,
  useTopProductsGlobal,
  useRecentActivity,
} from '@/hooks/useGlobalMetrics';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';

// Componente de tarjeta de estadística
function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'rose',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'rose' | 'blue' | 'green' | 'amber' | 'purple';
}) {
  const colorClasses = {
    rose: 'bg-rose-100 text-rose-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
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
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trend === 'up'
                ? 'text-green-600'
                : trend === 'down'
                ? 'text-red-600'
                : 'text-gray-500'
            )}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="w-4 h-4" />
            ) : null}
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
function SimpleBarChart({
  data,
  valueKey,
  labelKey,
}: {
  data: Record<string, any>[];
  valueKey: string;
  labelKey: string;
}) {
  const maxValue = Math.max(...data.map((d) => d[valueKey]), 1);

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = (item[valueKey] / maxValue) * 100;
        return (
          <div key={index} className="flex items-center gap-3">
            <div className="w-24 text-sm text-gray-600 truncate">
              {item[labelKey]}
            </div>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: index * 0.1 }}
                className="h-full bg-rose-500 rounded-full"
              />
            </div>
            <div className="w-20 text-sm font-medium text-gray-900 text-right">
              {typeof item[valueKey] === 'number' && item[valueKey] > 1000
                ? formatCurrency(item[valueKey])
                : item[valueKey]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Componente de actividad reciente
function ActivityItem({
  type,
  title,
  description,
  time,
}: {
  type: 'order' | 'company' | 'product';
  title: string;
  description: string;
  time: string;
}) {
  const iconConfig = {
    order: { icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' },
    company: { icon: Building2, color: 'bg-purple-100 text-purple-600' },
    product: { icon: Package, color: 'bg-green-100 text-green-600' },
  };

  const config = iconConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`p-2 rounded-lg ${config.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <span className="text-xs text-gray-400">
        {new Date(time).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
}

export function GlobalReportsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const { data: metrics, isLoading: metricsLoading, refetch } = useGlobalMetrics();
  const { data: companyGrowth } = useCompanyGrowth(6);
  const { data: revenueByCompany } = useRevenueByCompany(5);
  const { data: topProducts } = useTopProductsGlobal(5);
  const { data: recentActivity } = useRecentActivity(10);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 500);
  };

  const isLoading = metricsLoading;

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
          <h1 className="text-2xl font-bold text-gray-900">Reportes Globales</h1>
          <p className="text-gray-500">Métricas y estadísticas del marketplace</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw
              className={cn('w-5 h-5 text-gray-600', refreshing && 'animate-spin')}
            />
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Empresas Activas"
          value={metrics?.activeCompanies || 0}
          icon={Building2}
          color="purple"
          trend="neutral"
          trendValue={`de ${metrics?.totalCompanies || 0} total`}
        />
        <StatCard
          label="Productos Activos"
          value={metrics?.activeProducts || 0}
          icon={Package}
          color="green"
        />
        <StatCard
          label="Pedidos Totales"
          value={metrics?.totalOrders || 0}
          icon={ShoppingCart}
          color="blue"
          trend={metrics?.pendingOrders ? 'up' : 'neutral'}
          trendValue={`${metrics?.pendingOrders || 0} pendientes`}
        />
        <StatCard
          label="Ingresos Totales"
          value={formatCurrency(metrics?.totalRevenue || 0)}
          icon={DollarSign}
          color="rose"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          label="Solicitudes Pendientes"
          value={metrics?.pendingRequests || 0}
          icon={Activity}
          color="amber"
        />
        <StatCard
          label="Usuarios Totales"
          value={metrics?.totalUsers || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Ingresos del Mes"
          value={formatCurrency(metrics?.monthlyRevenue || 0)}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Company */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ingresos por Empresa</h2>
              <p className="text-sm text-gray-500">Top 5 empresas</p>
            </div>
            <Link
              to="/admin/companies"
              className="text-sm text-rose-600 hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {revenueByCompany && revenueByCompany.length > 0 ? (
            <SimpleBarChart
              data={revenueByCompany}
              valueKey="total_revenue"
              labelKey="company_name"
            />
          ) : (
            <div className="py-8 text-center text-gray-400">
              No hay datos de ingresos aún
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Productos Más Vendidos</h2>
              <p className="text-sm text-gray-500">Top 5 productos</p>
            </div>
            <Link
              to="/admin/products"
              className="text-sm text-rose-600 hover:underline"
            >
              Ver todos
            </Link>
          </div>

          {topProducts && topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className="flex items-center gap-3"
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-gray-500">{product.company_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {product.total_sold} uds
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(product.total_revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              No hay datos de ventas aún
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Actividad Reciente</h2>
          <span className="text-sm text-gray-500">Últimas 24 horas</span>
        </div>

        {recentActivity && recentActivity.length > 0 ? (
          <div className="divide-y">
            {recentActivity.map((activity, index) => (
              <ActivityItem
                key={`${activity.type}-${activity.id}-${index}`}
                type={activity.type}
                title={activity.title}
                description={activity.description}
                time={activity.created_at}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400">
            No hay actividad reciente
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Link
          to="/admin/company-requests"
          className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
        >
          <Activity className="w-5 h-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-700">Solicitudes</p>
            <p className="text-sm text-amber-600">
              {metrics?.pendingRequests || 0} pendientes
            </p>
          </div>
        </Link>
        <Link
          to="/admin/companies"
          className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
        >
          <Building2 className="w-5 h-5 text-purple-600" />
          <div>
            <p className="font-medium text-purple-700">Empresas</p>
            <p className="text-sm text-purple-600">
              {metrics?.totalCompanies || 0} registradas
            </p>
          </div>
        </Link>
        <Link
          to="/admin/orders"
          className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-700">Pedidos</p>
            <p className="text-sm text-blue-600">
              {metrics?.pendingOrders || 0} pendientes
            </p>
          </div>
        </Link>
        <Link
          to="/admin/users"
          className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
        >
          <Users className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-700">Usuarios</p>
            <p className="text-sm text-green-600">
              {metrics?.totalUsers || 0} registrados
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
