import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  Eye, 
  EyeOff,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useUser, useCreateUser, useUpdateUser, useAssignUserToCompany } from '@/hooks/useUsers';
import { useCompanies } from '@/hooks';
import { cn } from '@/lib/utils';
import { USER_ROLES } from '@/utils/constants';
import type { User as UserType, UserRole } from '@/types';
import toast from 'react-hot-toast';

interface UserFormProps {
  mode?: 'create' | 'edit';
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  company: 'Empresa',
  consultant: 'Consultor',
  customer: 'Cliente',
};

const roleDescriptions: Record<UserRole, string> = {
  admin: 'Acceso completo al panel de administración',
  company: 'Acceso al panel de empresa para gestionar productos y pedidos',
  consultant: 'Acceso de solo lectura a reportes y datos',
  customer: 'Usuario cliente con acceso a compras',
};

export function UserForm({ mode = 'create' }: UserFormProps) {
  const navigate = useNavigate();
  const { id: userId } = useParams<{ id: string }>();
  const isEditing = mode === 'edit' && userId;

  // Queries and mutations
  const { data: existingUser, isLoading: isLoadingUser } = useUser(userId || null);
  const { data: companiesData } = useCompanies({}, 1, 100);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const assignToCompany = useAssignUserToCompany();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'customer' as UserRole,
    company_id: '',
    is_active: true,
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Load existing user data
  useEffect(() => {
    if (existingUser && isEditing) {
      setFormData({
        email: existingUser.email || '',
        full_name: existingUser.full_name || '',
        phone: existingUser.phone || '',
        role: existingUser.role || 'customer',
        company_id: '', // Will be loaded separately from company_users
        is_active: existingUser.is_active ?? true,
        password: '',
        confirm_password: '',
      });
    }
  }, [existingUser, isEditing]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'El nombre es requerido';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (formData.phone && !/^[+]?[\d\s-]{7,15}$/.test(formData.phone)) {
      newErrors.phone = 'Teléfono inválido';
    }

    // Password validation only for new users or if password is provided
    if (!isEditing) {
      // New user - password required
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Las contraseñas no coinciden';
      }
    } else if (formData.password && formData.password.length > 0) {
      // Editing - password optional, but if provided must be valid
      if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Las contraseñas no coinciden';
      }
    }

    if (formData.role === 'company' && !formData.company_id) {
      newErrors.company_id = 'Debe seleccionar una empresa para usuarios de tipo empresa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrija los errores del formulario');
      return;
    }

    try {
      if (isEditing && userId) {
        // Update existing user
        const updates: Partial<UserType> = {
          full_name: formData.full_name,
          phone: formData.phone || undefined,
          role: formData.role,
          is_active: formData.is_active,
        };

        await updateUser.mutateAsync({ id: userId, updates });
        
        // Assign to company if role is company
        if (formData.role === 'company' && formData.company_id) {
          await assignToCompany.mutateAsync({ 
            userId, 
            companyId: formData.company_id 
          });
        }
        
        navigate('/admin/users');
      } else {
        // Create new user
        await createUser.mutateAsync({
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || undefined,
          role: formData.role,
          is_active: formData.is_active,
          password: formData.password,
        });
        navigate('/admin/users');
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const isLoading = isLoadingUser || createUser.isPending || updateUser.isPending;

  if (isLoadingUser && isEditing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h1>
          <p className="text-gray-500">
            {isEditing 
              ? 'Modifica los datos del usuario' 
              : 'Crea un nuevo usuario en el sistema'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 space-y-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-rose-600" />
              Información Personal
            </h2>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isEditing}
                  className={cn(
                    'w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500',
                    errors.email ? 'border-red-500' : 'border-gray-300',
                    isEditing && 'bg-gray-100 cursor-not-allowed'
                  )}
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={cn(
                  'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500',
                  errors.full_name ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="Juan Pérez"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.full_name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={cn(
                    'w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500',
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  )}
                  placeholder="+53 12345678"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Password (only for create or if changing) */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                {isEditing ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}
              </label>
              
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500',
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500',
                    errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                  )}
                  placeholder="Confirmar contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirm_password}
                </p>
              )}
            </div>
          </motion.div>

          {/* Role and Company */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Role Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-rose-600" />
                Rol del Usuario
              </h2>

              <div className="space-y-3">
                {Object.entries(roleLabels).map(([role, label]) => (
                  <label
                    key={role}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      formData.role === role
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{roleDescriptions[role as UserRole]}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Company Assignment */}
            {formData.role === 'company' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-rose-600" />
                  Asignar a Empresa
                </h2>

                <select
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500',
                    errors.company_id ? 'border-red-500' : 'border-gray-300'
                  )}
                >
                  <option value="">Seleccionar empresa...</option>
                  {companiesData?.data?.map((company: any) => (
                    <option key={company.id} value={company.id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
                {errors.company_id && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.company_id}
                  </p>
                )}
              </div>
            )}

            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado</h2>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Usuario Activo</p>
                  <p className="text-sm text-gray-500">El usuario puede acceder al sistema</p>
                </div>
              </label>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
