import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Building2,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useUser, useUpdateUser, useUpdateUserRole, useToggleUserActive, useAssignUserToCompany, useDeleteUser } from '@/hooks/useUsers';
import { useCompanies } from '@/hooks';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { UserRole } from '@/types';

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

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser(id || null);
  const { data: companiesData } = useCompanies({}, 1, 100);
  const updateUser = useUpdateUser();
  const updateRole = useUpdateUserRole();
  const toggleActive = useToggleUserActive();
  const assignToCompany = useAssignUserToCompany();
  const deleteUser = useDeleteUser();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [companyId, setCompanyId] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone || '');
      setRole(user.role);
      setIsActive(user.is_active);
      setCompanyId(user.company_id || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateUser.mutateAsync({
        id,
        updates: {
          full_name: fullName,
          phone: phone || undefined,
        },
      });
      setIsEditing(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!id) return;
    try {
      await updateRole.mutateAsync({
        id,
        role: newRole as UserRole,
      });
      setRole(newRole);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleToggleActive = async () => {
    if (!id) return;
    try {
      await toggleActive.mutateAsync({
        id,
        isActive: !isActive,
      });
      setIsActive(!isActive);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCompanyChange = async (newCompanyId: string) => {
    if (!id) return;
    try {
      await assignToCompany.mutateAsync({
        userId: id,
        companyId: newCompanyId || null,
      });
      setCompanyId(newCompanyId);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteUser.mutateAsync(id);
      navigate('/admin/users');
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Usuario no encontrado</p>
        <Link
          to="/admin/users"
          className="mt-4 text-rose-600 hover:underline"
        >
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-medium text-rose-600">
                  {user.full_name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  roleColors[user.role]
                )}>
                  {roleLabels[user.role]}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1',
                  user.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                )}>
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
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/users/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-rose-600" />
              Información Personal
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!isEditing}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500',
                    isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-sm text-gray-500">El email no se puede modificar</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500',
                    isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                  )}
                />
              </div>
              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={updateUser.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {updateUser.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>

          {/* Role and Company */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-600" />
              Rol y Asignación
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol del Usuario
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {role === 'company' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Asignar a Empresa
                  </label>
                  <select
                    value={companyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    disabled={assignToCompany.isPending}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
                  >
                    <option value="">Sin empresa asignada</option>
                    {companiesData?.data?.map((company: any) => (
                      <option key={company.id} value={company.id}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    El usuario tendrá acceso al panel de la empresa seleccionada
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Account Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-600" />
              Estado de la Cuenta
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Estado</p>
                  <p className="text-sm text-gray-500">
                    {isActive ? 'Usuario activo' : 'Usuario inactivo'}
                  </p>
                </div>
                <button
                  onClick={handleToggleActive}
                  disabled={toggleActive.isPending}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-colors disabled:opacity-50',
                    isActive
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  )}
                >
                  {toggleActive.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isActive ? (
                    'Desactivar'
                  ) : (
                    'Activar'
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Email Verificado</p>
                  <p className="text-sm text-gray-500">
                    {user.email_verified ? 'El email ha sido verificado' : 'El email no ha sido verificado'}
                  </p>
                </div>
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium',
                    user.email_verified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {user.email_verified ? 'Verificado' : 'No Verificado'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="space-y-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Edit className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{isEditing ? 'Cancelar Edición' : 'Editar Información'}</span>
              </button>
              <Link
                to={`/admin/users/${id}/edit`}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Editar con Formulario Completo</span>
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-left"
              >
                <Trash2 className="w-5 h-5 text-red-400" />
                <span className="text-red-600">Eliminar Usuario</span>
              </button>
            </div>
          </motion.div>

          {/* Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-600" />
              Información
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">ID</p>
                <p className="text-gray-900 font-mono text-xs break-all">{user.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Registrado</p>
                <p className="text-gray-900">{formatDate(user.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500">Última Actualización</p>
                <p className="text-gray-900">{formatDate(user.updated_at)}</p>
              </div>
              {user.company_id && (
                <div>
                  <p className="text-gray-500">Empresa Asignada</p>
                  <Link
                    to={`/admin/companies/${user.company_id}`}
                    className="text-rose-600 hover:underline"
                  >
                    Ver empresa
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
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
                ¿Estás seguro de que deseas eliminar al usuario <strong>{user.full_name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                El usuario será desactivado y no podrá acceder al sistema.
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
                onClick={handleDelete}
                disabled={deleteUser.isPending}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteUser.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
