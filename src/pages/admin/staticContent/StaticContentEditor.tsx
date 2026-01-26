import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStaticTextStore } from '@/store/staticTextStore';
import {
  updateHero,
  updatePromise,
  updateTestimonials,
  updateFooter,
} from '@/services/staticTextService';
import { FormField } from '@/components/ui/FormField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

// Validation schemas
const heroSchema = z.object({
  badge: z.string().trim().min(1, 'Badge es requerido'),
  title: z.string().trim().min(1, 'Título es requerido'),
  description: z.string().trim().min(1, 'Descripción es requerida'),
  cta: z.string().trim().min(1, 'CTA es requerido'),
});

const promiseSchema = z.object({
  subtitle: z.string().trim().min(1, 'Subtítulo es requerido'),
  title: z.string().trim().min(1, 'Título es requerido'),
});

const testimonialsSchema = z.object({
  subtitle: z.string().trim().min(1, 'Subtítulo es requerido'),
  title: z.string().trim().min(1, 'Título es requerido'),
});

const footerSchema = z.object({
  company_name: z.string().trim().min(1, 'Nombre de empresa es requerido'),
  company_description: z.string().trim().min(1, 'Descripción es requerida'),
  email: z.string().email('Email inválido'),
  phone: z.string().trim().min(1, 'Teléfono es requerido'),
  address: z.string().trim().min(1, 'Dirección es requerida'),
});

type HeroFormData = z.infer<typeof heroSchema>;
type PromiseFormData = z.infer<typeof promiseSchema>;
type TestimonialsFormData = z.infer<typeof testimonialsSchema>;
type FooterFormData = z.infer<typeof footerSchema>;

export function StaticContentEditor() {
  const store = useStaticTextStore();
  const [activeTab, setActiveTab] = useState<'hero' | 'promise' | 'testimonials' | 'footer'>(
    'hero'
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isReady, setIsReady] = useState(false);

  // IMPORTANT: Create all forms BEFORE any conditional logic
  // React hooks must be called in the same order every render
  const heroForm = useForm<HeroFormData>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      badge: store?.hero?.badge || '',
      title: store?.hero?.title || '',
      description: store?.hero?.description || '',
      cta: store?.hero?.cta || '',
    },
    mode: 'onBlur',
  });

  const promiseForm = useForm<PromiseFormData>({
    resolver: zodResolver(promiseSchema),
    defaultValues: {
      subtitle: store?.promise?.subtitle || '',
      title: store?.promise?.title || '',
    },
    mode: 'onBlur',
  });

  const testimonialsForm = useForm<TestimonialsFormData>({
    resolver: zodResolver(testimonialsSchema),
    defaultValues: {
      subtitle: store?.testimonials?.subtitle || '',
      title: store?.testimonials?.title || '',
    },
    mode: 'onBlur',
  });

  const footerForm = useForm<FooterFormData>({
    resolver: zodResolver(footerSchema),
    defaultValues: {
      company_name: store?.footer?.company?.name || '',
      company_description: store?.footer?.company?.description || '',
      email: store?.footer?.contact?.email || '',
      phone: store?.footer?.contact?.phone || '',
      address: store?.footer?.contact?.address || '',
    },
    mode: 'onBlur',
  });

  // Wait for store to be fully initialized
  useEffect(() => {
    if (store?.hero?.badge && store?.promise?.title && store?.footer?.contact?.email) {
      setIsReady(true);
    }
  }, [store]);

  // Conditionally render - NOW this is safe because hooks are created above
  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Reset forms when store data changes - only after isReady
  useEffect(() => {
    if (!isReady) return;
    heroForm.reset({
      badge: store?.hero?.badge || '',
      title: store?.hero?.title || '',
      description: store?.hero?.description || '',
      cta: store?.hero?.cta || '',
    });
  }, [store?.hero?.badge, heroForm, isReady]);

  useEffect(() => {
    if (!isReady) return;
    promiseForm.reset({
      subtitle: store?.promise?.subtitle || '',
      title: store?.promise?.title || '',
    });
  }, [store?.promise?.title, promiseForm, isReady]);

  useEffect(() => {
    if (!isReady) return;
    testimonialsForm.reset({
      subtitle: store?.testimonials?.subtitle || '',
      title: store?.testimonials?.title || '',
    });
  }, [store?.testimonials?.title, testimonialsForm, isReady]);

  useEffect(() => {
    if (!isReady) return;
    footerForm.reset({
      company_name: store?.footer?.company?.name || '',
      company_description: store?.footer?.company?.description || '',
      email: store?.footer?.contact?.email || '',
      phone: store?.footer?.contact?.phone || '',
      address: store?.footer?.contact?.address || '',
    });
  }, [store?.footer?.contact?.email, footerForm, isReady]);

  const handleHeroSubmit = async (data: HeroFormData) => {
    try {
      setSaving(true);
      setMessage(null);

      await updateHero({
        ...store.hero,
        ...data,
      });

      store.updateHero(data);
      setMessage({ type: 'success', text: '✅ Sección Hero actualizada' });
    } catch (error) {
      console.error('❌ Error updating hero:', error);
      setMessage({ type: 'error', text: '❌ Error al actualizar Hero' });
    } finally {
      setSaving(false);
    }
  };

  const handlePromiseSubmit = async (data: PromiseFormData) => {
    try {
      setSaving(true);
      setMessage(null);

      await updatePromise({
        ...store.promise,
        ...data,
      });

      store.updatePromise(data);
      setMessage({ type: 'success', text: '✅ Sección Promesa actualizada' });
    } catch (error) {
      console.error('❌ Error updating promise:', error);
      setMessage({ type: 'error', text: '❌ Error al actualizar Promesa' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestimonialsSubmit = async (data: TestimonialsFormData) => {
    try {
      setSaving(true);
      setMessage(null);

      await updateTestimonials({
        ...store.testimonials,
        ...data,
      });

      store.updateTestimonials(data);
      setMessage({ type: 'success', text: '✅ Sección Testimonios actualizada' });
    } catch (error) {
      console.error('❌ Error updating testimonials:', error);
      setMessage({ type: 'error', text: '❌ Error al actualizar Testimonios' });
    } finally {
      setSaving(false);
    }
  };

  const handleFooterSubmit = async (data: FooterFormData) => {
    try {
      setSaving(true);
      setMessage(null);

      await updateFooter({
        ...store.footer,
        company: {
          name: data.company_name,
          description: data.company_description,
        },
        contact: {
          email: data.email,
          phone: data.phone,
          address: data.address,
        },
      });

      store.updateFooter({
        company: {
          name: data.company_name,
          description: data.company_description,
        },
        contact: {
          email: data.email,
          phone: data.phone,
          address: data.address,
        },
      });
      setMessage({ type: 'success', text: '✅ Sección Footer actualizada' });
    } catch (error) {
      console.error('❌ Error updating footer:', error);
      setMessage({ type: 'error', text: '❌ Error al actualizar Footer' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'hero', label: '🏠 Hero', icon: '🏠' },
    { id: 'promise', label: '⭐ Nuestra Promesa', icon: '⭐' },
    { id: 'testimonials', label: '💬 Testimonios', icon: '💬' },
    { id: 'footer', label: '👣 Footer', icon: '👣' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-serif font-bold text-gray-900">Contenido Estático</h1>
        <p className="text-gray-600 mt-2">
          Edita los textos estáticos del landing page sin cambiar la estructura
        </p>
      </motion.div>

      {/* Message Alert */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-8 shadow-sm"
      >
        {/* Hero Section */}
        {activeTab === 'hero' && (
          <form onSubmit={heroForm.handleSubmit(handleHeroSubmit)} className="space-y-6">
            <div className="bg-rose-50 p-6 rounded-xl border border-rose-200">
              <h3 className="font-semibold text-gray-900 mb-4">Sección Hero</h3>
              <p className="text-sm text-gray-600">
                Estos textos aparecen en el banner principal de la página
              </p>
            </div>

            <FormField
              label="Badge (Etiqueta pequeña)"
              error={heroForm.formState.errors.badge?.message}
            >
              <input
                {...heroForm.register('badge')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="ej: ✨ Belleza Natural"
              />
            </FormField>

            <FormField
              label="Título Principal"
              error={heroForm.formState.errors.title?.message}
            >
              <textarea
                {...heroForm.register('title')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="ej: Transforma Tu Belleza Natural"
              />
            </FormField>

            <FormField
              label="Descripción"
              error={heroForm.formState.errors.description?.message}
            >
              <textarea
                {...heroForm.register('description')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Descripción del hero"
              />
            </FormField>

            <FormField
              label="Botón CTA (Call To Action)"
              error={heroForm.formState.errors.cta?.message}
            >
              <input
                {...heroForm.register('cta')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="ej: Explorar Colección"
              />
            </FormField>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        )}

        {/* Promise Section */}
        {activeTab === 'promise' && (
          <form onSubmit={promiseForm.handleSubmit(handlePromiseSubmit)} className="space-y-6">
            <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
              <h3 className="font-semibold text-gray-900 mb-4">Sección Nuestra Promesa</h3>
              <p className="text-sm text-gray-600">
                Edita el título y subtítulo de la sección (los items de características se
                editan en otro módulo)
              </p>
            </div>

            <FormField
              label="Subtítulo"
              error={promiseForm.formState.errors.subtitle?.message}
            >
              <input
                {...promiseForm.register('subtitle')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="ej: Nuestra Promesa"
              />
            </FormField>

            <FormField
              label="Título Principal"
              error={promiseForm.formState.errors.title?.message}
            >
              <textarea
                {...promiseForm.register('title')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="ej: ¿Por qué elegir Gaby Cosmetics?"
              />
            </FormField>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        )}

        {/* Testimonials Section */}
        {activeTab === 'testimonials' && (
          <form
            onSubmit={testimonialsForm.handleSubmit(handleTestimonialsSubmit)}
            className="space-y-6"
          >
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4">Sección Testimonios</h3>
              <p className="text-sm text-gray-600">
                Edita el título y subtítulo (los testimonios individuales se editan en otro
                módulo)
              </p>
            </div>

            <FormField
              label="Subtítulo"
              error={testimonialsForm.formState.errors.subtitle?.message}
            >
              <input
                {...testimonialsForm.register('subtitle')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="ej: Testimonios"
              />
            </FormField>

            <FormField
              label="Título Principal"
              error={testimonialsForm.formState.errors.title?.message}
            >
              <textarea
                {...testimonialsForm.register('title')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="ej: Lo que dicen nuestros clientes"
              />
            </FormField>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        )}

        {/* Footer Section */}
        {activeTab === 'footer' && (
          <form onSubmit={footerForm.handleSubmit(handleFooterSubmit)} className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-gray-900 mb-4">Sección Footer</h3>
              <p className="text-sm text-gray-600">Edita la información de contacto y empresa</p>
            </div>

            <div className="border-b pb-6">
              <h4 className="font-medium text-gray-900 mb-4">Empresa</h4>

              <FormField
                label="Nombre de Empresa"
                error={footerForm.formState.errors.company_name?.message}
              >
                <input
                  {...footerForm.register('company_name')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="ej: Gaby Cosmetics"
                />
              </FormField>

              <FormField
                label="Descripción"
                error={footerForm.formState.errors.company_description?.message}
              >
                <textarea
                  {...footerForm.register('company_description')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Descripción corta de la empresa"
                />
              </FormField>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Contacto</h4>

              <FormField
                label="Email"
                error={footerForm.formState.errors.email?.message}
              >
                <input
                  {...footerForm.register('email')}
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="info@example.com"
                />
              </FormField>

              <FormField
                label="Teléfono"
                error={footerForm.formState.errors.phone?.message}
              >
                <input
                  {...footerForm.register('phone')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="+34 912 345 678"
                />
              </FormField>

              <FormField
                label="Dirección"
                error={footerForm.formState.errors.address?.message}
              >
                <textarea
                  {...footerForm.register('address')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Calle Principal 123, Madrid, España"
                />
              </FormField>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        )}
      </motion.div>

      {/* Info Box */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h4 className="font-semibold text-gray-900 mb-2">💡 Nota Importante</h4>
        <p className="text-sm text-gray-700">
          Los cambios se guardan en la base de datos de Supabase. Los cambios se reflejarán
          inmediatamente en el landing page sin necesidad de recargar la página.
        </p>
      </div>
    </div>
  );
}
