import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, Shield } from 'lucide-react';
import { useUser, useUpdateUser, useUpdateUserRole, useToggleUserActive } from '@/hooks';
import { FormField } from '@/components/ui/FormField';
import { formatDate } from '@/utils/formatters';
import { USER_ROLES } from '@/utils/constants';
import toast from 'react-hot-toast';

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useUser(id || null);
  const updateUser = useUpdateUser();
  const updateRole = useUpdateUserRole();
  const toggleActive = useToggleUserActive();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone || '');
      setRole(user.role);
      setIsActive(user.is_active);
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
      toast.success('Usuario actualizado exitosamente');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!id) return;
    try {
      await updateRole.mutateAsync({
        id,
        role: newRole as any,
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
      <div className="flex items-center justify-between">
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
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Save className="w-5 h-5" />
          Guardar Cambios
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </h2>
            <div className="space-y-4">
              <FormField
                label="Nombre Completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-sm text-gray-500">El email no se puede modificar</p>
              </div>
              <FormField
                label="Teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Estado de la Cuenta
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Estado</p>
                  <p className="text-sm text-gray-500">
                    {isActive ? 'Usuario activo' : 'Usuario inactivo'}
                  </p>
                </div>
                <button
                  onClick={handleToggleActive}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">Rol</p>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {Object.values(USER_ROLES).map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Email Verificado</p>
                  <p className="text-sm text-gray-500">
                    {user.email_verified ? 'Sí' : 'No'}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.email_verified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {user.email_verified ? 'Verificado' : 'No Verificado'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Información</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">ID</p>
                <p className="text-gray-900 font-mono text-xs">{user.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Registrado</p>
                <p className="text-gray-900">{formatDate(user.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500">Última Actualización</p>
                <p className="text-gray-900">{formatDate(user.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
