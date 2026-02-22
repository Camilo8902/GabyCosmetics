import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HeroContent {
  badge: string;
  title: string;
  description: string;
  cta: string;
}

export interface PromiseContent {
  subtitle: string;
  title: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  image: string;
  rating: number;
  text: string;
}

export interface TestimonialsContent {
  subtitle: string;
  title: string;
  testimonials: Testimonial[];
}

export interface FooterContent {
  company: {
    name: string;
    description: string;
  };
  quick_links: Array<{
    id: string;
    label: string;
    href: string;
  }>;
  categories: Array<{
    id: string;
    label: string;
    href: string;
  }>;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
}

export interface StaticTextState {
  hero: HeroContent;
  promise: PromiseContent;
  testimonials: TestimonialsContent;
  footer: FooterContent;
  lastUpdated: {
    hero?: string;
    promise?: string;
    testimonials?: string;
    footer?: string;
  };
  updateHero: (content: Partial<HeroContent>) => void;
  updatePromise: (content: Partial<PromiseContent>) => void;
  updateTestimonials: (content: Partial<TestimonialsContent>) => void;
  updateFooter: (content: Partial<FooterContent>) => void;
  setAllContent: (content: Partial<StaticTextState>) => void;
}

// Default content in Spanish
const defaultHero: HeroContent = {
  badge: '✨ Belleza Natural',
  title: 'Transforma Tu Belleza Natural',
  description:
    'Descubre nuestra colección premium de productos de cuidado capilar y corporal. Ingredientes naturales, resultados excepcionales.',
  cta: 'Explorar Colección',
};

const defaultPromise: PromiseContent = {
  subtitle: 'Nuestra Promesa',
  title: '¿Por qué elegir Gaby Cosmetics?',
  items: [
    {
      id: 'quality',
      title: 'Calidad Premium',
      description: 'Productos formulados con ingredientes naturales de alta calidad',
    },
    {
      id: 'shipping',
      title: 'Envío Rápido',
      description: 'Entrega en todo el país en 2-5 días hábiles',
    },
    {
      id: 'support',
      title: 'Soporte 24/7',
      description: 'Equipo dedicado para resolver tus dudas',
    },
    {
      id: 'secure',
      title: 'Compra Segura',
      description: 'Transacciones protegidas y garantía de satisfacción',
    },
  ],
};

const defaultTestimonials: TestimonialsContent = {
  subtitle: 'Testimonios',
  title: 'Lo que dicen nuestros clientes',
  testimonials: [
    {
      id: '1',
      name: 'María García',
      role: 'Cliente Frecuente',
      image:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      rating: 5,
      text: 'Increíble la calidad de los productos. Mi cabello nunca había lucido tan brillante y saludable.',
    },
    {
      id: '2',
      name: 'Laura Martínez',
      role: 'Estilista Profesional',
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      rating: 5,
      text: 'Como profesional, recomiendo Gaby Cosmetics a todos mis clientes. Los resultados hablan por sí solos.',
    },
    {
      id: '3',
      name: 'Ana López',
      role: 'Influencer de Belleza',
      image:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      rating: 5,
      text: 'Llevo más de un año usando sus productos y la diferencia es notable. El servicio es excepcional.',
    },
    {
      id: '4',
      name: 'Carmen Rodríguez',
      role: 'Cliente desde 2022',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      rating: 5,
      text: 'Los tratamientos capilares son espectaculares. Mi cabello quedó completamente renovado.',
    },
  ],
};

const defaultFooter: FooterContent = {
  company: {
    name: 'Gaby Cosmetics',
    description: 'Belleza natural, resultados excepcionales',
  },
  quick_links: [
    { id: '1', label: 'Inicio', href: '/' },
    { id: '2', label: 'Tienda', href: '/shop' },
    { id: '3', label: 'Sobre Nosotros', href: '/about' },
    { id: '4', label: 'Contacto', href: '/contact' },
  ],
  categories: [
    { id: '1', label: 'Cuidado Capilar', href: '/shop' },
    { id: '2', label: 'Cuidado Corporal', href: '/shop' },
    { id: '3', label: 'Tratamientos', href: '/shop' },
  ],
  contact: {
    email: 'info@gabycosmetics.com',
    phone: '+34 912 345 678',
    address: 'Calle Principal 123, Madrid, España',
  },
};

export const useStaticTextStore = create<StaticTextState>()(
  persist(
    (set) => ({
      hero: defaultHero,
      promise: defaultPromise,
      testimonials: defaultTestimonials,
      footer: defaultFooter,
      lastUpdated: {},

      updateHero: (content) =>
        set((state) => ({
          hero: { ...state.hero, ...content },
          lastUpdated: { ...state.lastUpdated, hero: new Date().toISOString() },
        })),

      updatePromise: (content) =>
        set((state) => ({
          promise: { ...state.promise, ...content },
          lastUpdated: { ...state.lastUpdated, promise: new Date().toISOString() },
        })),

      updateTestimonials: (content) =>
        set((state) => ({
          testimonials: { ...state.testimonials, ...content },
          lastUpdated: { ...state.lastUpdated, testimonials: new Date().toISOString() },
        })),

      updateFooter: (content) =>
        set((state) => ({
          footer: { ...state.footer, ...content },
          lastUpdated: { ...state.lastUpdated, footer: new Date().toISOString() },
        })),

      setAllContent: (content) => set(content),
    }),
    {
      name: 'static-text-storage',
      version: 1,
    }
  )
);
