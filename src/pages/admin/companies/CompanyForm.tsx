import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Image,
  Loader2,
  AlertCircle,
  Shield,
  CreditCard,
} from 'lucide-react';
import { useCompany, useAdminUpdateCompany, useCompanyStats, useChangeCompanyPlan } from '@/hooks/useCompanies';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency } from '@/utils/formatters';
import toast from 'react-hot-toast';
import type { Company, SubscriptionPlan } from '@/types';

const planLabels: Record<SubscriptionPlan, string> = {
  basic: 'Básico',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

const planDescriptions: Record<SubscriptionPlan, string> = {
  basic: 'Hasta 50 productos, soporte por email',
  premium: 'Hasta 500 productos, soporte prioritario, analytics avanzados',
  enterprise: 'Productos ilimitados, soporte 24/7, API access, personalización',
};

export function CompanyForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: company, isLoading: isLoadingCompany } = useCompany(id || null);
  const { data: stats } = useCompanyStats(id || null);
  const updateCompany = useAdminUpdateCompany();
  const changePlan = useChangeCompanyPlan();

  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    phone: '',
    website: '',
    address: '',
    logo_url: '',
    is_active: true,
    is_verified: false,
    plan: 'basic' as SubscriptionPlan,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) {
      setFormData({
        company_name: company.company_name || '',
        description: company.description || '',
        phone: company.phone || '',
        website: company.website || '',
        address: company.address || '',
        logo_url: company.logo_url || '',
        is_active: company.is_active ?? true,
        is_verified: company.is_verified ?? false,
        plan: (company as any).plan || 'basic',
      });
    }
  }, [company]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'El nombre es requerido';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'URL inválida (debe comenzar con http:// o https://)';
    }

    if (formData.logo_url && !/^https?:\/\/.+/.test(formData.logo_url)) {
      newErrors.logo_url = 'URL inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrija los errores del formulario');
      return;
    }

    if (!id) return;

    try {
      await updateCompany.mutateAsync({
        id,
        updates: {
          company_name: formData.company_name,
          description: formData.description || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          address: formData.address || undefined,
          logo_url: formData.logo_url || undefined,
          is_active: formData.is_active,
          is_verified: formData.is_verified,
        },
      });

      // Change plan if different
      if (company && (company as any).plan !== formData.plan) {
        await changePlan.mutateAsync({ id, plan: formData.plan });
      }

      navigate('/admin/companies');
    } catch (error) {
      console.error('Error saving company:', error);
    }
  };

  if (isLoadingCompany && isEditing) {
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
          onClick={() => navigate('/admin/companies')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
          </h1>
          <p className="text-gray-500">
            {isEditing
              ? 'Modifica los datos de la empresa'
              : 'Registra una nueva empresa en el sistema'}
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
              <Building2 className="w-5 h-5 text-rose-600" />
              Información de la Empresa
            </h2>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className={cn(
                  'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500',
                  errors.company_name ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="Nombre de la empresa"
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.company_name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Descripción breve de la empresa..."
              />
            </div>

            {/* Contact Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="+53 12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Sitio Web
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500',
                    errors.website ? 'border-red-500' : 'border-gray-300'
                  )}
                  placeholder="https://ejemplo.com"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.website}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Dirección
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Dirección de la empresa"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Image className="w-4 h-4" />
                URL del Logo
              </label>
              <input
                type="url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleChange}
                className={cn(
                  'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500',
                  errors.logo_url ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="https://ejemplo.com/logo.png"
              />
              {errors.logo_url && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.logo_url}
                </p>
              )}
              {formData.logo_url && (
                <div className="mt-2">
                  <img
                    src={formData.logo_url}
                    alt="Logo preview"
                    className="w-20 h-20 object-contain rounded-lg border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.png';
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-600" />
                Estado
              </h2>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Empresa Activa</p>
                    <p className="text-sm text-gray-500">La empresa puede operar</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_verified"
                    checked={formData.is_verified}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Empresa Verificada</p>
                    <p className="text-sm text-gray-500">La empresa ha sido verificada</p>
                  </div>
                </label>
              </div>
            </motion.div>

            {/* Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-600" />
                Plan de Suscripción
              </h2>

              <div className="space-y-3">
                {Object.entries(planLabels).map(([key, label]) => (
                  <label
                    key={key}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      formData.plan === key
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={key}
                      checked={formData.plan === key}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{planDescriptions[key as SubscriptionPlan]}</p>
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>

            {/* Stats (if editing) */}
            {isEditing && stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Productos</span>
                    <span className="font-medium">{stats.products}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Productos Activos</span>
                    <span className="font-medium text-green-600">{stats.activeProducts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pedidos</span>
                    <span className="font-medium">{stats.orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ingresos</span>
                    <span className="font-medium text-green-600">{formatCurrency(stats.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Usuarios</span>
                    <span className="font-medium">{stats.users}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/companies')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateCompany.isPending || changePlan.isPending}
            className="inline-flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateCompany.isPending || changePlan.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
