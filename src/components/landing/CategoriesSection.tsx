import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';

// Demo categories fallback - Removed, only show categories from database
const demoCategories = [];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export function CategoriesSection() {
  const { t } = useTranslation();
  const { data: realCategories, isLoading: categoriesLoading } = useCategories();
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const allProducts = productsData?.data || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Count products per category
  const productCountByCategory = (realCategories || []).reduce((acc, category) => {
    const count = allProducts.filter(
      (p) => p.categories && p.categories.some((c) => c.category?.id === category.id)
    ).length;
    acc[category.id] = count || 0;
    return acc;
  }, {} as Record<string, number>);

  // Transform real categories to display format - only show if they have an image
  const displayCategories = (realCategories || demoCategories)
    .filter((cat) => cat.image_url) // Only show categories with images
    .map((cat, index) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      image: cat.image_url,
      color: index % 2 === 0 ? 'from-rose-400 to-pink-500' : 'from-amber-400 to-orange-500',
      products: productCountByCategory[cat.id] || 0,
    }));

  const isLoading = categoriesLoading || productsLoading;

  // Auto-rotate carousel
  useEffect(() => {
    if (isHovered || displayCategories.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayCategories.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [displayCategories.length, isHovered]);

  // Visible categories for carousel (3-4 at a time)
  const visibleCount = 3;
  const visibleCategories = Array.from({ length: visibleCount }).map((_, i) => {
    const index = (currentIndex + i) % displayCategories.length;
    return { ...displayCategories[index], position: i };
  });

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-rose-600 font-medium tracking-wider uppercase text-sm"
          >
            {t('categories.subtitle')}
          </motion.span>
          <h2 className="mt-2 text-4xl md:text-5xl font-serif font-bold text-gray-900">
            {t('categories.title')}
          </h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '4rem' }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="h-1 bg-rose-600 mx-auto mt-4 rounded-full"
          />
        </motion.div>

        {/* Categories Carousel */}
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader className="w-8 h-8 text-rose-600" />
            </motion.div>
          </div>
        ) : displayCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('categories.no_categories')}</p>
          </div>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div className="flex gap-6 justify-center">
                {visibleCategories.map((category, idx) => (
                  <motion.div
                    key={`${category.id}-${idx}`}
                    animate={{
                      opacity: idx === 0 ? 1 : 0.5,
                      scale: idx === 0 ? 1 : 0.85,
                      x: idx === 0 ? 0 : idx * 20,
                    }}
                    transition={{
                      duration: 0.6,
                      ease: 'easeInOut',
                    }}
                    className="flex-shrink-0 w-full sm:w-96"
                  >
                    <Link to={`/shop?category=${category.slug}`}>
                      <motion.div
                        whileHover={{ y: -15 }}
                        className="group relative h-80 rounded-3xl overflow-hidden shadow-xl"
                      >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                          <motion.img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                            animate={{ scale: isHovered && idx === 0 ? 1.1 : 1 }}
                            transition={{ duration: 0.4 }}
                          />
                          <div
                            className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-60 mix-blend-multiply`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="absolute inset-0 p-8 flex flex-col justify-end">
                          <motion.div
                            animate={{
                              opacity: idx === 0 ? 1 : 0.7,
                              y: idx === 0 ? 0 : 10,
                            }}
                          >
                            <span className="text-white/80 text-sm">
                              {category.products} {category.products === 1 ? 'producto' : 'productos'}
                            </span>
                            <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mt-2">
                              {category.name}
                            </h3>
                            {category.description && idx === 0 && (
                              <p className="text-white/80 text-sm mt-2 line-clamp-2">
                                {category.description}
                              </p>
                            )}
                            {idx === 0 && (
                              <motion.div
                                className="mt-4 flex items-center gap-2 text-white font-medium"
                                whileHover={{ x: 5 }}
                              >
                                <span>{t('categories.view_all')}</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                              </motion.div>
                            )}
                          </motion.div>
                        </div>

                        {/* Decorative rotation - only on front card */}
                        {idx === 0 && (
                          <motion.div
                            className="absolute top-6 right-6 w-16 h-16 border-2 border-white/30 rounded-full"
                            animate={{
                              rotate: isHovered ? 0 : 360,
                            }}
                            transition={{
                              duration: 20,
                              repeat: isHovered ? 0 : Infinity,
                              ease: 'linear',
                            }}
                          />
                        )}
                        <div className="absolute top-8 right-8 w-12 h-12 border-2 border-white/20 rounded-full opacity-0" />
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Carousel indicators */}
            <div className="flex justify-center gap-2 mt-8">
              {displayCategories.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsHovered(true);
                  }}
                  animate={{
                    backgroundColor:
                      index === currentIndex ? 'rgb(225, 29, 72)' : 'rgb(229, 231, 235)',
                    width: index === currentIndex ? '32px' : '8px',
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-2 rounded-full cursor-pointer"
                />
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link to="/categories">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-gray-900 text-gray-900 rounded-full font-medium hover:bg-gray-900 hover:text-white transition-all inline-flex items-center gap-2"
            >
              {t('categories.view_all')}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
