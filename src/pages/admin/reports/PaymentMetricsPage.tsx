import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  DollarSign,
  TrendingUp,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface PaymentMetrics {
  totalProcessed: number;
  totalCommissions: number;
  totalTransfers: number;
  pendingTransfers: number;
  totalRefunds: number;
  ordersCount: number;
  vendorsCount: number;
  activeVendorsCount: number;
}

interface VendorMetric {
  company_id: string;
  company_name: string;
  total_sales: number;
  total_commissions: number;
  total_earnings: number;
  orders_count: number;
  stripe_connected: boolean;
  stripe_active: boolean;
}

interface RecentTransfer {
  id: string;
  company_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export function PaymentMetricsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [vendorMetrics, setVendorMetrics] = useState<VendorMetric[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<RecentTransfer[]>([]);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadMetrics();
    }
  }, [user, period]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPaymentMetrics(),
        loadVendorMetrics(),
        loadRecentTransfers(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMetrics = async () => {
    try {
      // Calcular fechas según período
      let dateFilter = '';
      if (period !== 'all') {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        dateFilter = startDate.toISOString();
      }

      // Obtener métricas de órdenes
      let ordersQuery = supabase
        .from('orders')
        .select('total, platform_fee, vendor_amount, status, created_at')
        .eq('status', 'paid');

      if (dateFilter) {
        ordersQuery = ordersQuery.gte('created_at', dateFilter);
      }

      const { data: orders, error: ordersError } = await ordersQuery;

      if (ordersError) throw ordersError;

      // Calcular totales
      const totalProcessed = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const totalCommissions = orders?.reduce((sum, o) => sum + (o.platform_fee || 0), 0) || 0;
      const totalVendorAmount = orders?.reduce((sum, o) => sum + (o.vendor_amount || 0), 0) || 0;

      // Obtener transferencias pendientes
      const { count: pendingTransfers } = await supabase
        .from('payment_transfers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Obtener total de transferencias completadas
      const { data: transfers } = await supabase
        .from('payment_transfers')
        .select('amount')
        .eq('status', 'completed');

      const totalTransfers = transfers?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Obtener reembolsos
      const { data: refunds } = await supabase
        .from('refunds')
        .select('amount')
        .eq('status', 'succeeded');

      const totalRefunds = refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

      // Contar vendedores activos
      const { count: vendorsCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .in('status', ['approved', 'active']);

      const { count: activeVendorsCount } = await supabase
        .from('stripe_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('onboarding_complete', true)
        .eq('charges_enabled', true);

      setMetrics({
        totalProcessed,
        totalCommissions,
        totalTransfers,
        pendingTransfers: pendingTransfers || 0,
        totalRefunds,
        ordersCount: orders?.length || 0,
        vendorsCount: vendorsCount || 0,
        activeVendorsCount: activeVendorsCount || 0,
      });
    } catch (error) {
      console.error('Error loading payment metrics:', error);
    }
  };

  const loadVendorMetrics = async () => {
    try {
      // Obtener ventas por empresa
      const { data, error } = await supabase
        .from('company_sales_summary')
        .select('*')
        .order('total_sales', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Obtener estado de Stripe para cada empresa
      const vendorMetricsWithStripe = await Promise.all(
        (data || []).map(async (vendor) => {
          const { data: stripeAccount } = await supabase
            .from('stripe_accounts')
            .select('onboarding_complete, charges_enabled')
            .eq('company_id', vendor.company_id)
            .single();

          return {
            ...vendor,
            stripe_connected: !!stripeAccount,
            stripe_active: stripeAccount?.onboarding_complete && stripeAccount?.charges_enabled,
          };
        })
      );

      setVendorMetrics(vendorMetricsWithStripe);
    } catch (error) {
      console.error('Error loading vendor metrics:', error);
    }
  };

  const loadRecentTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transfers')
        .select(`
          id,
          amount,
          status,
          created_at,
          companies (company_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentTransfers(
        (data || []).map((t) => ({
          id: t.id,
          company_name: (t.companies as any)?.company_name || 'N/A',
          amount: t.amount,
          status: t.status,
          created_at: t.created_at,
        }))
      );
    } catch (error) {
      console.error('Error loading recent transfers:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Métricas de Pagos</h1>
          <p className="text-gray-600">Resumen del sistema de pagos del marketplace</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="all">Todo el tiempo</option>
          </select>
          <button
            onClick={loadMetrics}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Procesado"
          value={`$${(metrics?.totalProcessed || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
          icon={<DollarSign className="w-6 h-6" />}
          color="blue"
          subtitle={`${metrics?.ordersCount || 0} órdenes`}
        />
        <MetricCard
          title="Comisiones"
          value={`$${(metrics?.totalCommissions || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
          subtitle="Ingresos de la plataforma"
        />
        <MetricCard
          title="Transferencias"
          value={`$${(metrics?.totalTransfers || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
          icon={<ArrowUpRight className="w-6 h-6" />}
          color="purple"
          subtitle={`${metrics?.pendingTransfers} pendientes`}
          alert={metrics?.pendingTransfers ? metrics.pendingTransfers > 0 : false}
        />
        <MetricCard
          title="Reembolsos"
          value={`$${(metrics?.totalRefunds || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
          icon={<ArrowDownRight className="w-6 h-6" />}
          color="red"
          subtitle="Total reembolsado"
        />
      </div>

      {/* Vendors Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendedores */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Estado de Vendedores</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Vendedores</p>
              <p className="text-2xl font-bold">{metrics?.vendorsCount || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Activos con Stripe</p>
              <p className="text-2xl font-bold text-green-600">{metrics?.activeVendorsCount || 0}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Pendientes de Config.</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(metrics?.vendorsCount || 0) - (metrics?.activeVendorsCount || 0)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">% Activos</p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics?.vendorsCount
                  ? Math.round(((metrics.activeVendorsCount || 0) / metrics.vendorsCount) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Transferencias Recientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Transferencias Recientes</h2>
          <div className="space-y-3">
            {recentTransfers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay transferencias recientes</p>
            ) : (
              recentTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{transfer.company_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transfer.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${transfer.amount.toFixed(2)}</p>
                    <StatusBadge status={transfer.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Vendors Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Top Vendedores</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Empresa</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ventas</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Comisiones</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ganancias</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Órdenes</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Stripe</th>
              </tr>
            </thead>
            <tbody>
              {vendorMetrics.map((vendor) => (
                <tr key={vendor.company_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium">{vendor.company_name}</p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    ${vendor.total_sales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-green-600">
                    ${vendor.total_commissions.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    ${vendor.total_earnings.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right">{vendor.orders_count}</td>
                  <td className="py-3 px-4 text-center">
                    {vendor.stripe_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        Activo
                      </span>
                    ) : vendor.stripe_connected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                        <Clock className="w-3 h-3" />
                        Pendiente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        <AlertCircle className="w-3 h-3" />
                        No conectado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
function MetricCard({
  title,
  value,
  icon,
  color,
  subtitle,
  alert,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'red';
  subtitle?: string;
  alert?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${alert ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        {alert && <AlertCircle className="w-5 h-5 text-yellow-500" />}
      </div>
      <p className="mt-4 text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pendiente' },
    processing: { color: 'bg-blue-100 text-blue-700', label: 'Procesando' },
    completed: { color: 'bg-green-100 text-green-700', label: 'Completado' },
    failed: { color: 'bg-red-100 text-red-700', label: 'Fallido' },
    reversed: { color: 'bg-gray-100 text-gray-700', label: 'Revertido' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
}
