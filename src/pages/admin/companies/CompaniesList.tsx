import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanies } from '@/hooks';
import { DataTable } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { formatDate } from '@/utils/formatters';
import type { Company } from '@/types';

export function CompaniesList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filters: any = {};
  if (searchQuery) {
    filters.search = searchQuery;
  }
  if (statusFilter) {
    filters.isActive = statusFilter === 'active';
  }

  const { data, isLoading, error } = useCompanies(filters, page, pageSize);
  const companies = data?.data || [];
  const total = data?.total || 0;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-900 mb-2">Error al cargar empresas</h3>
          <p className="text-red-700">
            {error instanceof Error ? error.message : 'Error desconocido'}
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

  const columns = [
    {
      key: 'logo',
      header: '',
      render: (company: Company) => (
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.company_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-medium text-gray-400">
              {company.company_name?.charAt(0) || 'C'}
            </span>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      key: 'name',
      header: 'Empresa',
      render: (company: Company) => (
        <div>
          <Link
            to={`/admin/companies/${company.id}`}
            className="font-medium text-gray-900 hover:text-rose-600"
          >
            {company.company_name}
          </Link>
          {company.description && (
            <p className="text-sm text-gray-500 line-clamp-1">{company.description}</p>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (company: Company) => (
        <div className="flex flex-col gap-1">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              company.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {company.is_active ? 'Activa' : 'Inactiva'}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              company.is_verified
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {company.is_verified ? 'Verificada' : 'No Verificada'}
          </span>
        </div>
      ),
      sortable: false,
    },
    {
      key: 'created_at',
      header: 'Registrada',
      render: (company: Company) => (
        <span className="text-sm text-gray-600">{formatDate(company.created_at)}</span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (company: Company) => (
        <Link
          to={`/admin/companies/${company.id}`}
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Empresas</h1>
          <p className="text-gray-600 mt-1">
            Administra todas las empresas registradas
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Búsqueda
            </label>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por nombre..."
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
              <option value="">Todas</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <DataTable
        data={companies}
        columns={columns}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={isLoading}
        emptyMessage="No se encontraron empresas"
      />
    </div>
  );
}
