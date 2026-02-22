import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { useCompanyId, useCompanyOrders } from '@/hooks/useCompanyMetrics';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';

// Configuración de estados
const orderStatusConfig: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: React.ElementType;
}> = {
  pending: { 
    label: 'Pendiente', 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-100',
    icon: Clock 
  },
  processing: { 
    label: 'Procesando', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    icon: Package 
  },
  shipped: { 
    label: 'Enviado', 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100',
    icon: Truck 
  },
  delivered: { 
    label: 'Entregado', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100',
    icon: CheckCircle 
  },
  cancelled: { 
    label: 'Cancelado', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100',
    icon: XCircle 
  },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-700' },
};

export function CompanyOrdersPage() {
  const { companyId } = useCompanyId();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useCompanyOrders(
    companyId,
    page,
    10,
    { search, status: statusFilter }
  );

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500">No tienes una empresa asociada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500">Gestiona los pedidos de tu empresa</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Object.entries(orderStatusConfig).map(([status, config]) => {
          const count = data?.data?.filter((o: any) => o.status === status).length || 0;
          const Icon = config.icon;
          return (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(statusFilter === status ? '' : status);
                setPage(1);
              }}
              className={cn(
                'p-4 rounded-xl border-2 transition-all',
                statusFilter === status
                  ? 'border-rose-500 bg-rose-50'
                  : 'border-transparent bg-white hover:border-gray-200'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('p-1.5 rounded-lg', config.bgColor)}>
                  <Icon className={cn('w-4 h-4', config.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">{config.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número de pedido o cliente..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(orderStatusConfig).map(([status, config]) => (
              <option key={status} value={status}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <>
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
                      Pago
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
                  {data.data.map((order: any) => {
                    const statusConf = orderStatusConfig[order.status] || orderStatusConfig.pending;
                    const paymentConf = paymentStatusConfig[order.payment_status] || paymentStatusConfig.pending;
                    const StatusIcon = statusConf.icon;

                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {order.order_number || `#${order.id.slice(0, 8)}`}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.users?.full_name || 'Cliente'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.users?.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {formatCurrency(order.total)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
                            statusConf.bgColor, statusConf.color
                          )}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConf.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'px-2 py-1 text-xs font-medium rounded-full',
                            paymentConf.color
                          )}>
                            {paymentConf.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {new Date(order.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/company/orders/${order.id}`}
                            className="inline-flex items-center gap-1 text-rose-600 hover:underline text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, data.total)} de {data.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          'w-8 h-8 rounded-lg text-sm font-medium',
                          page === pageNum
                            ? 'bg-rose-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || statusFilter ? 'No se encontraron pedidos' : 'No tienes pedidos aún'}
            </h3>
            <p className="text-gray-500">
              {search || statusFilter
                ? 'Intenta con otros filtros de búsqueda'
                : 'Los pedidos aparecerán aquí cuando los clientes realicen compras'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}