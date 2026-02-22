import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Tipos
interface HeroContent {
  badge: string;
  title: string;
  description: string;
  cta: string;
}

interface PromiseContent {
  subtitle: string;
  title: string;
}

interface TestimonialsContent {
  subtitle: string;
  title: string;
}

interface FooterContent {
  company: {
    name: string;
    description: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
}

// Defaults
const DEFAULT_HERO: HeroContent = {
  badge: 'Belleza Natural',
  title: 'Descubre tu Belleza Natural',
  description: 'Productos cosméticos de alta calidad',
  cta: 'Explorar Colección',
};

const DEFAULT_PROMISE: PromiseContent = {
  subtitle: 'Por Qué Elegirnos',
  title: 'Calidad Premium',
};

const DEFAULT_TESTIMONIALS: TestimonialsContent = {
  subtitle: 'Lo Que Dicen',
  title: 'Testimonios',
};

const DEFAULT_FOOTER: FooterContent = {
  company: {
    name: 'Gaby Cosmetics',
    description: 'Productos de belleza premium',
  },
  contact: {
    email: 'info@gabycosmetics.com',
    phone: '+1234567890',
    address: 'Dirección aquí',
  },
};

export function StaticContentEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [contentId, setContentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'promise' | 'testimonials' | 'footer'>(
    'hero'
  );

  // Hero state
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO);
  // Promise state
  const [promise, setPromise] = useState<PromiseContent>(DEFAULT_PROMISE);
  // Testimonials state
  const [testimonials, setTestimonials] = useState<TestimonialsContent>(DEFAULT_TESTIMONIALS);
  // Footer state
  const [footer, setFooter] = useState<FooterContent>(DEFAULT_FOOTER);

  // Load content on mount (ONLY ONCE)
  useEffect(() => {
    const loadContent = async () => {
      try {
        const { data, error } = await supabase.from('static_content').select('*').single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows
          throw error;
        }

        if (data) {
          setContentId(data.id);
          setHero(data.hero || DEFAULT_HERO);
          setPromise(data.promise || DEFAULT_PROMISE);
          setTestimonials(data.testimonials || DEFAULT_TESTIMONIALS);
          setFooter(data.footer || DEFAULT_FOOTER);
        }
      } catch (err) {
        console.error('Error loading content:', err);
        setMessage({ type: 'error', text: 'Error al cargar contenido' });
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []); // Dependencies vacío = solo al montar

  // Validación básica
  const validateHero = () => {
    if (!hero.badge.trim()) return 'Badge es requerido';
    if (!hero.title.trim()) return 'Título es requerido';
    if (!hero.description.trim()) return 'Descripción es requerida';
    if (!hero.cta.trim()) return 'CTA es requerido';
    return null;
  };

  const validatePromise = () => {
    if (!promise.subtitle.trim()) return 'Subtítulo es requerido';
    if (!promise.title.trim()) return 'Título es requerido';
    return null;
  };

  const validateTestimonials = () => {
    if (!testimonials.subtitle.trim()) return 'Subtítulo es requerido';
    if (!testimonials.title.trim()) return 'Título es requerido';
    return null;
  };

  const validateFooter = () => {
    if (!footer.company.name.trim()) return 'Nombre de empresa es requerido';
    if (!footer.company.description.trim()) return 'Descripción es requerida';
    if (!footer.contact.email.trim()) return 'Email es requerido';
    if (!footer.contact.phone.trim()) return 'Teléfono es requerido';
    if (!footer.contact.address.trim()) return 'Dirección es requerida';
    return null;
  };

  // Guardar una sección
  const handleSave = async (section: 'hero' | 'promise' | 'testimonials' | 'footer') => {
    let error = null;
    if (section === 'hero') error = validateHero();
    else if (section === 'promise') error = validatePromise();
    else if (section === 'testimonials') error = validateTestimonials();
    else if (section === 'footer') error = validateFooter();

    if (error) {
      setMessage({ type: 'error', text: `❌ ${error}` });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload: Record<string, unknown> = {};
      if (section === 'hero') payload.hero = hero;
      if (section === 'promise') payload.promise = promise;
      if (section === 'testimonials') payload.testimonials = testimonials;
      if (section === 'footer') payload.footer = footer;

      if (contentId) {
        // Actualizar existente
        const { error: err } = await supabase
          .from('static_content')
          .update(payload)
          .eq('id', contentId);

        if (err) throw err;
      } else {
        // Crear nuevo
        const { data, error: err } = await supabase
          .from('static_content')
          .insert({
            hero: DEFAULT_HERO,
            promise: DEFAULT_PROMISE,
            testimonials: DEFAULT_TESTIMONIALS,
            footer: DEFAULT_FOOTER,
            ...payload,
          })
          .select()
          .single();

        if (err) throw err;
        if (data) setContentId(data.id);
      }

      setMessage({
        type: 'success',
        text: `✅ ${section.charAt(0).toUpperCase() + section.slice(1)} actualizado`,
      });

      // Evento para que landing recargue
      window.dispatchEvent(new Event('staticContentUpdated'));
    } catch (err) {
      console.error('Error saving:', err);
      setMessage({ type: 'error', text: '❌ Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-pink-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📝 Gestor de Contenido Estático</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'hero', label: '🏠 Hero' },
          { id: 'promise', label: '⭐ Promesa' },
          { id: 'testimonials', label: '💬 Testimonios' },
          { id: 'footer', label: '👣 Footer' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-pink-500 text-pink-500'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {message.text}
        </div>
      )}

      {/* Hero Tab */}
      {activeTab === 'hero' && (
        <div className="space-y-4 pb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Badge</label>
            <input
              type="text"
              value={hero.badge}
              onChange={(e) => setHero({ ...hero, badge: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="ej. Belleza Natural"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={hero.title}
              onChange={(e) => setHero({ ...hero, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="ej. Descubre tu Belleza Natural"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              value={hero.description}
              onChange={(e) => setHero({ ...hero, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              rows={3}
              placeholder="ej. Productos cosméticos de alta calidad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CTA (Call To Action)</label>
            <input
              type="text"
              value={hero.cta}
              onChange={(e) => setHero({ ...hero, cta: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="ej. Explorar Colección"
            />
          </div>

          <button
            onClick={() => handleSave('hero')}
            disabled={saving}
            className="mt-4 bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-600 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Hero'}
          </button>
        </div>
      )}

      {/* Promise Tab */}
      {activeTab === 'promise' && (
        <div className="space-y-4 pb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Subtítulo</label>
            <input
              type="text"
              value={promise.subtitle}
              onChange={(e) => setPromise({ ...promise, subtitle: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="ej. Por Qué Elegirnos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={promise.title}
              onChange={(e) => setPromise({ ...promise, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="ej. Calidad Premium"
            />
          </div>

          <button
            onClick={() => handleSave('promise')}
            disabled={saving}
            className="mt-4 bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-600 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Promesa'}
          </button>
        </div>
      )}

      {/* Testimonials Tab */}
      {activeTab === 'testimonials' && (
        <div className="space-y-4 pb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Subtítulo</label>
            <input
              type="text"
              value={testimonials.subtitle}
              onChange={(e) => setTestimonials({ ...testimonials, subtitle: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="ej. Lo Que Dicen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={testimonials.title}
              onChange={(e) => setTestimonials({ ...testimonials, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="ej. Testimonios"
            />
          </div>

          <button
            onClick={() => handleSave('testimonials')}
            disabled={saving}
            className="mt-4 bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-600 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Testimonios'}
          </button>
        </div>
      )}

      {/* Footer Tab */}
      {activeTab === 'footer' && (
        <div className="space-y-4 pb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre Empresa</label>
            <input
              type="text"
              value={footer.company.name}
              onChange={(e) =>
                setFooter({
                  ...footer,
                  company: { ...footer.company, name: e.target.value },
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="ej. Gaby Cosmetics"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción Empresa</label>
            <textarea
              value={footer.company.description}
              onChange={(e) =>
                setFooter({
                  ...footer,
                  company: { ...footer.company, description: e.target.value },
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              rows={2}
              placeholder="ej. Productos de belleza premium"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={footer.contact.email}
              onChange={(e) =>
                setFooter({
                  ...footer,
                  contact: { ...footer.contact, email: e.target.value },
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="ej. info@gabycosmetics.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              type="tel"
              value={footer.contact.phone}
              onChange={(e) =>
                setFooter({
                  ...footer,
                  contact: { ...footer.contact, phone: e.target.value },
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="ej. +1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dirección</label>
            <input
              type="text"
              value={footer.contact.address}
              onChange={(e) =>
                setFooter({
                  ...footer,
                  contact: { ...footer.contact, address: e.target.value },
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="ej. Calle Principal 123"
            />
          </div>

          <button
            onClick={() => handleSave('footer')}
            disabled={saving}
            className="mt-4 bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-600 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Footer'}
          </button>
        </div>
      )}
    </div>
  );
}
