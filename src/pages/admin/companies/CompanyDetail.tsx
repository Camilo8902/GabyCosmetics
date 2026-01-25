import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Building2, Mail, Phone, Globe, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useCompany, useUpdateCompany, useVerifyCompany, useToggleCompanyActive } from '@/hooks';
import { FormField } from '@/components/ui/FormField';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: company, isLoading } = useCompany(id || null);
  const updateCompany = useUpdateCompany();
  const verifyCompany = useVerifyCompany();
  const toggleActive = useToggleCompanyActive();

  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (company) {
      setCompanyName(company.company_name);
      setDescription(company.description || '');
      setWebsite(company.website || '');
      setPhone(company.phone || '');
      setAddress(company.address || '');
      setIsActive(company.is_active);
      setIsVerified(company.is_verified);
    }
  }, [company]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateCompany.mutateAsync({
        id,
        updates: {
          company_name: companyName,
          description: description || undefined,
          website: website || undefined,
          phone: phone || undefined,
          address: address || undefined,
        },
      });
      toast.success('Empresa actualizada exitosamente');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleVerify = async () => {
    if (!id) return;
    try {
      await verifyCompany.mutateAsync(id);
      setIsVerified(true);
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

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Empresa no encontrada</p>
        <Link
          to="/admin/companies"
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
            to="/admin/companies"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.company_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.company_name}</h1>
              <p className="text-gray-600">{company.user?.email || 'Sin usuario asociado'}</p>
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
          {/* Company Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Información de la Empresa
            </h2>
            <div className="space-y-4">
              <FormField
                label="Nombre de la Empresa"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <FormField
                label="Sitio Web"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                icon={<Globe className="w-4 h-4" />}
                placeholder="https://..."
              />
              <FormField
                label="Teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone className="w-4 h-4" />}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Dirección
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Logo</h2>
            <ImageUploader
              value={company.logo_url}
              onChange={setLogoFile}
              label=""
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Estado</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Activa</p>
                  <p className="text-sm text-gray-500">
                    {isActive ? 'Empresa activa' : 'Empresa inactiva'}
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Verificada</p>
                  <p className="text-sm text-gray-500">
                    {isVerified ? 'Empresa verificada' : 'Pendiente de verificación'}
                  </p>
                </div>
                {!isVerified && (
                  <button
                    onClick={handleVerify}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verificar
                  </button>
                )}
                {isVerified && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Verificada
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* User Info */}
          {company.user && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Usuario Asociado</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500">Nombre</p>
                  <p className="text-gray-900">{company.user.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-gray-900">{company.user.email}</p>
                </div>
                <Link
                  to={`/admin/users/${company.user_id}`}
                  className="text-rose-600 hover:underline text-sm"
                >
                  Ver perfil del usuario →
                </Link>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Información</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-500">ID</p>
                <p className="text-gray-900 font-mono text-xs">{company.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Registrada</p>
                <p className="text-gray-900">{formatDate(company.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500">Última Actualización</p>
                <p className="text-gray-900">{formatDate(company.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
