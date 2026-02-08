import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';
import { FloatingDecorations } from './FloatingDecorations';

// Placeholder images from Unsplash for beauty products
const HERO_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?q=80&w=1920&auto=format&fit=crop',
    alt: 'Skincare products with natural ingredients',
    title: 'Belleza Natural',
    subtitle: 'Cuida tu piel con ingredientes 100% naturales',
  },
  {
    src: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=1920&auto=format&fit=crop',
    alt: 'Cosmetic products and makeup',
    title: 'Cosméticos Premium',
    subtitle: 'Productos de alta calidad para tu rutina diaria',
  },
  {
    src: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1920&auto=format&fit=crop',
    alt: 'Spa and wellness products',
    title: 'Bienestar y Spa',
    subtitle: 'Transforma tu rutina en un momento de lujo',
  },
  {
    src: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1920&auto=format&fit=crop',
    alt: 'Organic beauty products',
    title: 'Orgánicos y Limpios',
    subtitle: 'La mejor selección de productos orgánicos',
  },
  {
    src: 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?q=80&w=1920&auto=format&fit=crop',
    alt: 'Luxury beauty products',
    title: 'Lujo y Elegancia',
    subtitle: 'Descubre nuestra línea premium',
  },
];

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Image Carousel */}
      <ImageCarousel
        images={HERO_IMAGES}
        interval={4000}
        autoPlay={true}
        showNavigation={true}
        showIndicators={true}
      />

      {/* Floating Decorations */}
      <FloatingDecorations />

      {/* Overlay Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>{t('hero.badge', 'Calidad Premium')}</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-serif font-bold text-white leading-tight mb-6"
          >
            {(t('hero.title', 'Belleza Natural Para Tu Piel')).split(' ').map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={index === 1 || index === 2 ? 'text-rose-300' : ''}
              >
                {word}{' '}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base sm:text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed"
          >
            {t('hero.subtitle', 'Descubre nuestra colección de productos de belleza diseñados para realzar tu belleza natural con ingredientes de la más alta calidad.')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/shop">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(244, 63, 94, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-full font-medium hover:from-rose-500 hover:to-rose-400 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>{t('hero.cta', 'Ver Productos')}</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </motion.button>
            </Link>

            <Link to="/shop?category=new">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <span>{t('hero.cta2', 'Nueva Colección')}</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-12 flex flex-wrap gap-8"
          >
            {[
              { value: '500+', label: 'Productos', icon: '✨' },
              { value: '50K+', label: 'Clientes', icon: '💜' },
              { value: '4.9★', label: 'Rating', icon: '⭐' },
              { value: '100%', label: 'Natural', icon: '🌿' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm">
                  <span className="text-lg">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 flex items-center gap-6 text-white/60 text-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <span>Envío gratis +$50</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <span>Devolución 30 días</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <span>Calidad garantizada</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-8 h-12 border-2 border-white/40 rounded-full flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-3 bg-white/60 rounded-full"
            />
          </div>
          <span className="text-white/50 text-xs uppercase tracking-wider">Scroll</span>
        </motion.div>
      </motion.div>

      {/* Gradient overlay at bottom for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900/50 to-transparent pointer-events-none" />
    </section>
  );
}
