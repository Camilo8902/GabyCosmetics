import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

interface StaticContent {
  id: string;
  hero: HeroContent;
  promise: PromiseContent;
  testimonials: TestimonialsContent;
  footer: FooterContent;
  created_at: string;
  updated_at: string;
}

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

export function useStaticContent() {
  const [data, setData] = useState<StaticContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const { data: result, error: err } = await supabase
          .from('static_content')
          .select('*')
          .single();

        if (err && err.code !== 'PGRST116') {
          throw err;
        }

        if (result) {
          setData({
            id: result.id,
            hero: result.hero || DEFAULT_HERO,
            promise: result.promise || DEFAULT_PROMISE,
            testimonials: result.testimonials || DEFAULT_TESTIMONIALS,
            footer: result.footer || DEFAULT_FOOTER,
            created_at: result.created_at,
            updated_at: result.updated_at,
          });
        } else {
          // No data found, use defaults
          setData({
            id: '',
            hero: DEFAULT_HERO,
            promise: DEFAULT_PROMISE,
            testimonials: DEFAULT_TESTIMONIALS,
            footer: DEFAULT_FOOTER,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadContent();

    // Listen for content updates
    const handler = () => {
      loadContent();
    };

    window.addEventListener('staticContentUpdated', handler);
    return () => window.removeEventListener('staticContentUpdated', handler);
  }, []);

  return {
    data: data || {
      id: '',
      hero: DEFAULT_HERO,
      promise: DEFAULT_PROMISE,
      testimonials: DEFAULT_TESTIMONIALS,
      footer: DEFAULT_FOOTER,
      created_at: '',
      updated_at: '',
    },
    loading,
    error,
  };
}
