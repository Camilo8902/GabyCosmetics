import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { SubscriptionPlan } from '@/types';

const PLANS: { id: SubscriptionPlan; name: string; price: number; features: string[] }[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 0,
    features: [
      'Hasta 50 productos',
      'Gestión básica de inventario',
      'Soporte por email',
      'Reportes simples'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29,
    features: [
      'Hasta 500 productos',
      'Inventario avanzado',
      'Múltiples almacenes',
      'Integración con transportistas',
      'Reportes avanzados',
      'Soporte prioritario'
    ]
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    price: 99,
    features: [
      'Productos ilimitados',
      'Gestión de múltiples tiendas',
      'API completa',
      'Personalización total',
      'Account manager dedicado',
      'SLA garantizado'
    ]
  }
];

export function CompanyRegistrationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    taxId: '',
    businessType: '',
    website: '',
    description: '',
    selectedPlan: 'basic' as SubscriptionPlan
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlanSelect = (planId: SubscriptionPlan) => {
    setFormData(prev => ({ ...prev, selectedPlan: planId }));
  };

  const validateStep1 = () => {
    if (!formData.companyName || !formData.companyEmail || !formData.taxId) {
      setError('Por favor completa los campos requeridos');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1 && !validateStep1()) return;
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Debes iniciar sesión para registrar una empresa');
      }

      // Generar slug único
      const slug = formData.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Insertar empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.companyName,
          slug: `${slug}-${Date.now()}`,
          email: formData.companyEmail,
          phone: formData.companyPhone,
          tax_id: formData.taxId,
          business_type: formData.businessType,
          website_url: formData.website,
          description: formData.description,
          plan: formData.selectedPlan,
          status: 'pending'
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Asignar usuario como admin de la empresa
      const { error: userError } = await supabase
        .from('company_users')
        .insert({
          company_id: company.id,
          user_id: user.id,
          role: 'admin',
          status: 'active'
        });

      if (userError) throw userError;

      // Crear suscripción
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          company_id: company.id,
          plan: formData.selectedPlan,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (subError) throw subError;

      navigate('/company/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-20 h-1 mx-2 ${step > s ? 'bg-pink-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-8 mt-2">
            <span className={`text-sm ${step >= 1 ? 'text-pink-500 font-medium' : 'text-gray-500'}`}>
              Información
            </span>
            <span className={`text-sm ${step >= 2 ? 'text-pink-500 font-medium' : 'text-gray-500'}`}>
              Plan
            </span>
            <span className={`text-sm ${step >= 3 ? 'text-pink-500 font-medium' : 'text-gray-500'}`}>
              Confirmar
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Step 1: Company Information */}
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de la Empresa</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Ej: Gaby Cosmetics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de la Empresa *
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="contacto@gabycosmetics.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="+53 5555 5555"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Fiscal / NCF *
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="A123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Negocio
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Mayorista</option>
                  <option value="manufacturer">Fabricante</option>
                  <option value="dropship">Dropshipping</option>
                  <option value="services">Servicios</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sitio Web
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="https://gabycosmetics.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Cuéntanos sobre tu negocio..."
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Plan */}
        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Selecciona tu Plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`cursor-pointer rounded-xl p-6 border-2 transition-all ${
                    formData.selectedPlan === plan.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-500">/mes</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={handlePrevStep}
                className="px-6 py-2 text-gray-600 hover:text-gray-900"
              >
                Atrás
              </button>
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirma tu Registro</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">Empresa</h3>
                <p className="text-gray-600">{formData.companyName}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">Email</h3>
                <p className="text-gray-600">{formData.companyEmail}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">Plan seleccionado</h3>
                <p className="text-gray-600 capitalize">{formData.selectedPlan} - ${PLANS.find(p => p.id === formData.selectedPlan)?.price}/mes</p>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={handlePrevStep}
                className="px-6 py-2 text-gray-600 hover:text-gray-900"
                disabled={loading}
              >
                Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Completar Registro'}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
