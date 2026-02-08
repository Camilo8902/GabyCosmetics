import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';
import { FloatingDecorations } from './FloatingDecorations';

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
  const { t } = useTranslation();

  return (
    <section className="relative w-full">
      {/* Image Carousel - Starts below header */}
      <ImageCarousel
        images={HERO_IMAGES}
        interval={5000}
        autoPlay={true}
        showNavigation={true}
        showIndicators={true}
      />

      {/* Floating Decorations */}
      <FloatingDecorations />

      {/* Overlay Content - Positioned on top of carousel */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-sm font-medium mb-4"
          >
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>{t('hero.badge', 'Calidad Premium')}</span>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link to="/shop">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(244, 63, 94, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                className="group px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-full font-medium hover:from-rose-500 hover:to-rose-400 transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
              >
                <span>{t('hero.cta', 'Explorar Colección')}</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </motion.button>
            </Link>

            <Link to="/shop?category=new">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <span>{t('hero.secondary_cta', 'Ver Ofertas')}</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-6 mt-6"
          >
            {[
              { value: '500+', label: 'Productos' },
              { value: '50K+', label: 'Clientes' },
              { value: '4.9★', label: 'Rating' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/70">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust badges - Compact */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-4 text-white/60 text-xs"
          >
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              </div>
              <span>Envío gratis +$50</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>
              <span>Devolución 30 días</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent pointer-events-none" />
    </section>
  );
}
