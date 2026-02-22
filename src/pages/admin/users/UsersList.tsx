import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  User,
  Shield,
  Building2,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useUsers, useDeleteUser, usePermanentDeleteUser, useToggleUserActive } from '@/hooks/useUsers';
import { DataTable } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { formatDate } from '@/utils/formatters';
import { USER_ROLES } from '@/utils/constants';
import { cn } from '@/lib/utils';
import type { User as UserType, UserRole } from '@/types';
import toast from 'react-hot-toast';

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  company: 'Empresa',
  consultant: 'Consultor',
  customer: 'Cliente',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  company: 'bg-blue-100 text-blue-700',
  consultant: 'bg-amber-100 text-amber-700',
  customer: 'bg-gray-100 text-gray-700',
};

export function UsersList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

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

  const { data, isLoading, error, isError } = useUsers(filters, page, pageSize);
  const deleteUser = useDeleteUser();
  const permanentDeleteUser = usePermanentDeleteUser();
  const toggleActive = useToggleUserActive();

  const users = data?.data || [];
  const total = data?.total || 0;

  const handleDelete = async (permanent = false) => {
    if (!selectedUser) return;

    try {
      if (permanent) {
        await permanentDeleteUser.mutateAsync(selectedUser.id);
      } else {
        await deleteUser.mutateAsync(selectedUser.id);
      }
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleActive = async (user: UserType) => {
    try {
      await toggleActive.mutateAsync({ id: user.id, isActive: !user.is_active });
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
    setShowActionMenu(null);
  };

  if (isError && error && !(error as any)?.message?.includes('Auth')) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-900 mb-2">Error al cargar usuarios</h3>
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
      key: 'avatar',
      header: '',
      render: (user: UserType) => (
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
      render: (user: UserType) => (
        <div>
          <Link
            to={`/admin/users/${user.id}`}
            className="font-medium text-gray-900 hover:text-rose-600"
          >
            {user.full_name}
          </Link>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Mail className="w-3 h-3" />
            {user.email}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user: UserType) => (
        <span className={cn(
          'px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1',
          roleColors[user.role]
        )}>
          <Shield className="w-3 h-3" />
          {roleLabels[user.role]}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'company',
      header: 'Empresa',
      render: (user: UserType) => (
        user.company_id ? (
          <Link
            to={`/admin/companies/${user.company_id}`}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <Building2 className="w-3 h-3" />
            Ver empresa
          </Link>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )
      ),
      sortable: false,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (user: UserType) => (
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1',
            user.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          )}
        >
          {user.is_active ? (
            <>
              <CheckCircle className="w-3 h-3" />
              Activo
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
              Inactivo
            </>
          )}
        </span>
      ),
      sortable: false,
    },
    {
      key: 'email_verified',
      header: 'Verificado',
      render: (user: UserType) => (
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            user.email_verified
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          )}
        >
          {user.email_verified ? 'Sí' : 'No'}
        </span>
      ),
      sortable: false,
    },
    {
      key: 'created_at',
      header: 'Registrado',
      render: (user: UserType) => (
        <span className="text-sm text-gray-600">{formatDate(user.created_at)}</span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (user: UserType) => (
        <div className="relative">
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/users/${user.id}/edit`}
              className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => handleToggleActive(user)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                user.is_active
                  ? 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'
                  : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
              )}
              title={user.is_active ? 'Desactivar' : 'Activar'}
            >
              {user.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setSelectedUser(user);
                setShowDeleteModal(true);
              }}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Administra todos los usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/users/new')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.is_active).length}
              </p>
              <p className="text-sm text-gray-500">Activos</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-sm text-gray-500">Admins</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'company').length}
              </p>
              <p className="text-sm text-gray-500">Empresas</p>
            </div>
          </div>
        </motion.div>
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
              {Object.entries(roleLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
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
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border p-12">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      ) : (
        <DataTable
          data={users}
          columns={columns}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={false}
          emptyMessage="No se encontraron usuarios"
        />
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Eliminar Usuario</h3>
                    <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser.full_name}</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Puedes desactivar el usuario para mantener sus datos o eliminarlo permanentemente.
                </p>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(false)}
                  disabled={deleteUser.isPending}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {deleteUser.isPending ? 'Desactivando...' : 'Desactivar'}
                </button>
                <button
                  onClick={() => handleDelete(true)}
                  disabled={permanentDeleteUser.isPending}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {permanentDeleteUser.isPending ? 'Eliminando...' : 'Eliminar Permanentemente'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
