import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCompany, useCreateCompany, useUpdateCompany } from '@/hooks/useCompanies';
import toast from 'react-hot-toast';

interface CompanyFormData {
  company_name: string;
  email: string;
  phone: string;
  description: string;
  short_description: string;
  website: string;
  tax_id: string;
  business_type: string;
  address: string;
  is_active: boolean;
  is_verified: boolean;
  plan: 'basic' | 'premium' | 'enterprise';
}

const businessTypes = [
  { value: 'retail', label: 'Comercio Minorista' },
  { value: 'wholesale', label: 'Comercio Mayorista' },
  { value: 'manufacturer', label: 'Fabricante' },
  { value: 'distributor', label: 'Distribuidor' },
  { value: 'service', label: 'Servicios' },
  { value: 'other', label: 'Otro' },
];

const plans = [
  { value: 'basic', label: 'Básico' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Empresarial' },
];

export function CompanyForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingCompany, isLoading: isLoadingCompany } = useCompany(id || null);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    defaultValues: {
      company_name: '',
      email: '',
      phone: '',
      description: '',
      short_description: '',
      website: '',
      tax_id: '',
      business_type: '',
      address: '',
      is_active: true,
      is_verified: false,
      plan: 'basic',
    },
  });

  // Load existing company data when editing
  useEffect(() => {
    if (existingCompany) {
      reset({
        company_name: existingCompany.company_name || '',
        email: existingCompany.email || '',
        phone: existingCompany.phone || '',
        description: existingCompany.description || '',
        short_description: existingCompany.short_description || '',
        website: existingCompany.website || '',
        tax_id: existingCompany.tax_id || '',
        business_type: existingCompany.business_type || '',
        address: existingCompany.address || '',
        is_active: existingCompany.is_active ?? true,
        is_verified: existingCompany.is_verified ?? false,
        plan: (existingCompany.plan as 'basic' | 'premium' | 'enterprise') || 'basic',
      });
    }
  }, [existingCompany, reset]);

  const onSubmit = async (data: CompanyFormData) => {
    try {
      const companyData = {
        company_name: data.company_name,
        email: data.email,
        phone: data.phone || undefined,
        description: data.description || undefined,
        short_description: data.short_description || undefined,
        website: data.website || undefined,
        tax_id: data.tax_id || undefined,
        business_type: data.business_type || undefined,
        address: data.address || undefined,
        is_active: data.is_active,
        is_verified: data.is_verified,
        plan: data.plan,
        slug: data.company_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      };

      if (isEditing && id) {
        await updateCompany.mutateAsync({ id, updates: companyData });
      } else {
        await createCompany.mutateAsync(companyData as any);
      }
      
      navigate('/admin/companies');
    } catch (error) {
      console.error('Error saving company:', error);
    }
  };

  if (isLoadingCompany) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/companies"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing
              ? 'Modifica los datos de la empresa'
              : 'Crea una nueva empresa sin asignar usuario'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-bold text-gray-900">Información Básica</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                {...register('company_name', {
                  required: 'El nombre es requerido',
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  errors.company_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nombre de la empresa"
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-500">{errors.company_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                {...register('email', {
                  required: 'El email es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="empresa@ejemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="+1 234 567 8900"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sitio Web
              </label>
              <input
                type="url"
                {...register('website')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="https://www.ejemplo.com"
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Negocio
              </label>
              <select
                {...register('business_type')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Seleccionar tipo</option>
                {businessTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tax ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RUC / NIF / Tax ID
              </label>
              <input
                type="text"
                {...register('tax_id')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Identificación fiscal"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                {...register('address')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Dirección de la empresa"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Corta
              </label>
              <input
                type="text"
                {...register('short_description')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Breve descripción (máx. 150 caracteres)"
                maxLength={150}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Completa
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Descripción detallada de la empresa"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Configuración</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan
              </label>
              <select
                {...register('plan')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {plans.map((plan) => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm font-medium text-gray-700">Empresa Activa</span>
              </label>
            </div>

            {/* Verified Status */}
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_verified')}
                  className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm font-medium text-gray-700">Empresa Verificada</span>
              </label>
            </div>
          </div>

          {/* Info message for new companies */}
          {!isEditing && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> La empresa será creada sin usuario asignado. 
                Podrás asignar usuarios desde la sección de usuarios o desde el detalle de la empresa.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            to="/admin/companies"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Guardando...' : 'Guardar Empresa'}
          </button>
        </div>
      </form>
    </div>
  );
}
