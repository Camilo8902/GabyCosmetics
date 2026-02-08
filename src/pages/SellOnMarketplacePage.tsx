import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Store, TrendingUp, Shield, Zap, Headset, Truck, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Datos para el Hero
const HERO_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1920&auto=format&fit=crop',
    alt: 'Equipo empresarial colaboranco',
    overlay: true,
  },
  {
    src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1920&auto=format&fit=crop',
    alt: 'Analíticas y gráficos de negocios',
    overlay: true,
  },
  {
    src: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1920&auto=format&fit=crop',
    alt: 'Reunión de negocios y partnership',
    overlay: true,
  },
];

// Features
const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Millones de Clientes',
    description: 'Accede a nuestra base de clientes activos listos para comprar tus productos.',
  },
  {
    icon: Shield,
    title: 'Pagos Seguros',
    description: 'Sistema de pagos 100% protegido con las mejores pasarelas del mercado.',
  },
  {
    icon: Zap,
    title: 'Analíticas en Tiempo Real',
    description: 'Métricas detalladas de tu negocio para tomar mejores decisiones.',
  },
  {
    icon: Headset,
    title: 'Soporte Experto',
    description: 'Equipo dedicado para ayudarte a crecer tu negocio.',
  },
  {
    icon: Truck,
    title: 'Logística Integrada',
    description: 'Red de envíos a todo el país con las mejores tarifas.',
  },
  {
    icon: Target,
    title: 'Herramientas de Marketing',
    description: 'Promociona tus productos fácilmente y reacha más compradores.',
  },
];

// Planes
const PLANS = [
  {
    name: 'Básico',
    price: 'Gratis',
    period: 'para siempre',
    description: 'Perfecto para comenzar',
    features: [
      'Hasta 50 productos',
      'Panel de administración básico',
      'Soporte por email',
      'Reportes simples',
      '2 GB almacenamiento',
    ],
    buttonText: 'Comenzar Gratis',
    popular: false,
  },
  {
    name: 'Profesional',
    price: '$29',
    period: 'mensuales',
    description: 'Para negocios en crecimiento',
    features: [
      'Hasta 500 productos',
      'Panel avanzado con analíticas',
      'Soporte prioritario',
      'Reportes avanzados',
      '20 GB almacenamiento',
      'Herramientas de marketing',
      'Integración con redes sociales',
    ],
    buttonText: 'Obtener Plan',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: 'mensuales',
    description: 'Para grandes empresas',
    features: [
      'Productos ilimitados',
      'API completa',
      'Account manager dedicado',
      'Soporte 24/7',
      'Almacenamiento ilimitado',
      'White-label disponible',
      'Personalización total',
      'Análisis predictivo',
    ],
    buttonText: 'Contactar Ventas',
    popular: false,
  },
];

export function SellOnMarketplacePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: '',
    productsCount: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Insertar solicitud en la tabla (será revisada por admin)
      const { error: submitError } = await supabase
        .from('company_requests')
        .insert({
          business_name: formData.businessName,
          owner_name: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          business_type: formData.businessType,
          products_count: formData.productsCount,
          message: formData.message,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        });

      if (submitError) throw submitError;

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative w-full min-h-[500px] md:min-h-[600px]">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${HERO_IMAGES[currentSlide].src})` }}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/90 via-rose-800/70 to-transparent" />
        
        {/* Navigation dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentSlide === index ? 'bg-white w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pt-32 pb-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Vende en GabyCosmetics y haz crecer tu negocio
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Accede a millones de compradores, herramientas profesionales y el mejor soporte del mercado
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="#register"
                className="inline-flex items-center justify-center px-8 py-4 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-all shadow-lg hover:shadow-xl"
              >
                <Store className="w-5 h-5 mr-2" />
                Registrar Mi Tienda
              </Link>
              <Link
                to="#features"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/30"
              >
                Conocer Más
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué vender con nosotros?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre todas las ventajas de ser parte de GabyCosmetics
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planes flexibles para tu negocio
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PLANS.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-3xl p-8 ${
                  plan.popular 
                    ? 'ring-2 ring-pink-500 shadow-2xl scale-105' 
                    : 'shadow-lg hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Más Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </div>
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-2">/{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="#register"
                  className={`block w-full py-4 px-6 text-center font-semibold rounded-xl transition-all ${
                    plan.popular
                      ? 'bg-pink-500 text-white hover:bg-pink-600'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.buttonText}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Solicitud para Vender
              </h2>
              <p className="text-xl text-gray-400">
                Completa el formulario y nuestro equipo revisará tu solicitud
              </p>
            </motion.div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/20 border border-green-500 rounded-3xl p-12 text-center"
              >
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  ¡Solicitud Enviada!
                </h3>
                <p className="text-gray-300 mb-6">
                  Gracias por tu interés en vender en GabyCosmetics. 
                  Nuestro equipo revisará tu solicitud y te contactará en breve.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center px-6 py-3 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-all"
                >
                  Volver al Inicio
                </Link>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl p-8 md:p-12"
              >
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="Ej: Mi Tienda Online"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Propietario *
                    </label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de Contacto *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="contacto@mitienda.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                      placeholder="+53 5555 5555"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Negocio
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="retail">Minorista (Retail)</option>
                      <option value="wholesale">Mayorista</option>
                      <option value="manufacturer">Fabricante</option>
                      <option value="dropship">Dropshipping</option>
                      <option value="handmade">Artesanal</option>
                      <option value="import">Importador</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad de Productos
                    </label>
                    <select
                      name="productsCount"
                      value={formData.productsCount}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="1-10">1 - 10 productos</option>
                      <option value="11-50">11 - 50 productos</option>
                      <option value="51-100">51 - 100 productos</option>
                      <option value="101-500">101 - 500 productos</option>
                      <option value="500+">Más de 500 productos</option>
                    </select>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje Adicional (Opcional)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all resize-none"
                    placeholder="Cuéntanos más sobre tu negocio..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Store className="w-5 h-5 mr-2" />
                      Enviar Solicitud
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-pink-500">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¿Ya tienes una cuenta?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Accede a tu panel de vendedor y comienza a gestionar tu tienda
            </p>
            <Link
              to="/auth/login"
              className="inline-flex items-center px-8 py-4 bg-white text-pink-600 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
            >
              Iniciar Sesión como Vendedor
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
