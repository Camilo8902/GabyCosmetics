import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Download } from 'lucide-react';
import { useOrders } from '@/hooks';
import { DataTable } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { ORDER_STATUSES } from '@/utils/constants';
import type { Order } from '@/types';
import { useTranslation } from 'react-i18next';

export function OrdersList() {
  const { i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filters: any = {};
  if (searchQuery) {
    // Search by order number
    filters.orderNumber = searchQuery;
  }
  if (statusFilter) {
    filters.status = statusFilter as any;
  }
  if (dateFrom) {
    filters.startDate = new Date(dateFrom).toISOString();
  }
  if (dateTo) {
    filters.endDate = new Date(dateTo).toISOString();
  }

  const { data, isLoading } = useOrders(filters, page, pageSize);
  const orders = data?.data || [];
  const total = data?.total || 0;

  const columns = [
    {
      key: 'order_number',
      header: 'Número',
      render: (order: Order) => (
        <Link
          to={`/admin/orders/${order.id}`}
          className="font-medium text-rose-600 hover:underline"
        >
          {order.order_number || order.id.slice(0, 8)}
        </Link>
      ),
      sortable: true,
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (order: Order) => (
        <div>
          <p className="font-medium text-gray-900">
            {order.user?.full_name || order.user?.email || 'Cliente'}
          </p>
          <p className="text-sm text-gray-500">{order.user?.email}</p>
        </div>
      ),
      sortable: false,
    },
    {
      key: 'date',
      header: 'Fecha',
      render: (order: Order) => (
        <span className="text-sm text-gray-600">{formatDate(order.created_at)}</span>
      ),
      sortable: true,
    },
    {
      key: 'total',
      header: 'Total',
      render: (order: Order) => (
        <span className="font-bold text-gray-900">{formatCurrency(order.total || 0)}</span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (order: Order) => (
        <StatusBadge
          status={order.status}
          locale={i18n.language as 'es' | 'en'}
        />
      ),
      sortable: false,
    },
    {
      key: 'company',
      header: 'Empresa',
      render: (order: Order) => {
        // Get company from first order item
        const company = order.items?.[0]?.product?.company;
        return company ? (
          <span className="text-sm text-gray-600">{company.company_name}</span>
        ) : (
          <span className="text-sm text-gray-400">N/A</span>
        );
      },
      sortable: false,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (order: Order) => (
        <Link
          to={`/admin/orders/${order.id}`}
          className="text-rose-600 hover:underline text-sm"
        >
          Ver Detalle
        </Link>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <p className="text-gray-600 mt-1">
            Administra todos los pedidos de la tienda
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Download className="w-5 h-5" />
          Exportar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Búsqueda
            </label>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por número..."
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Todos</option>
              {Object.values(ORDER_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        data={orders}
        columns={columns}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={isLoading}
        emptyMessage="No se encontraron pedidos"
      />
    </div>
  );
}
