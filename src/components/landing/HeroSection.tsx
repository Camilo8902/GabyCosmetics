import { ImageCarousel } from './ImageCarousel';

// Placeholder images from Unsplash for beauty products - Hair focused
const HERO_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1920&auto=format&fit=crop',
    alt: 'Mujer con cabello hermoso',
    title: 'Transforma Tu Cabello',
    subtitle: 'Productos premium diseñados para nutrir y revitalizar',
  },
  {
    src: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1920&auto=format&fit=crop',
    alt: 'Cuidado del cabello natural',
    title: 'Belleza Natural',
    subtitle: 'Ingredientes 100% naturales para cabello radiante',
  },
  {
    src: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=1920&auto=format&fit=crop',
    alt: 'Productos para el cuidado del cabello',
    title: 'Hidratación Profunda',
    subtitle: 'Tratamientos intensivos para cabello sedoso',
  },
  {
    src: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=1920&auto=format&fit=crop',
    alt: 'Mujer con cabello maravilloso',
    title: 'Cabello Sin Frizz',
    subtitle: 'Dale volumen y control a tu cabello',
  },
  {
    src: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=1920&auto=format&fit=crop',
    alt: 'Productos capilares profesionales',
    title: 'Color Vibrante',
    subtitle: 'Protege y realza tu coloración natural',
  },
];

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px]">
      {/* Image Carousel Only */}
      <ImageCarousel
        images={HERO_IMAGES}
        interval={5000}
        autoPlay={true}
        showNavigation={true}
        showIndicators={true}
      />
    </section>
  );
}
