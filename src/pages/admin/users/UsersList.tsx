import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useUsers } from '@/hooks';
import { DataTable } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { formatDate } from '@/utils/formatters';
import { USER_ROLES } from '@/utils/constants';
import type { User } from '@/types';

export function UsersList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filters: any = {};
  if (searchQuery) {
    filters.search = searchQuery;
  }
  if (roleFilter) {
    filters.role = roleFilter as any;
  }
  if (statusFilter) {
    filters.isActive = statusFilter === 'active';
  }

  const { data, isLoading } = useUsers(filters, page, pageSize);
  const users = data?.data || [];
  const total = data?.total || 0;

  const columns = [
    {
      key: 'avatar',
      header: '',
      render: (user: User) => (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-rose-600">
              {user.full_name?.charAt(0) || 'U'}
            </span>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (user: User) => (
        <div>
          <Link
            to={`/admin/users/${user.id}`}
            className="font-medium text-gray-900 hover:text-rose-600"
          >
            {user.full_name}
          </Link>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user: User) => (
        <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium capitalize">
          {user.role}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (user: User) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {user.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
      sortable: false,
    },
    {
      key: 'email_verified',
      header: 'Verificado',
      render: (user: User) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.email_verified
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {user.email_verified ? 'Sí' : 'No'}
        </span>
      ),
      sortable: false,
    },
    {
      key: 'created_at',
      header: 'Registrado',
      render: (user: User) => (
        <span className="text-sm text-gray-600">{formatDate(user.created_at)}</span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (user: User) => (
        <Link
          to={`/admin/users/${user.id}`}
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Administra todos los usuarios del sistema
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Búsqueda
            </label>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por nombre o email..."
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Todos</option>
              {Object.values(USER_ROLES).map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
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
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        data={users}
        columns={columns}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={isLoading}
        emptyMessage="No se encontraron usuarios"
      />
    </div>
  );
}
