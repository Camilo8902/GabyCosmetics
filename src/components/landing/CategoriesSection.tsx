import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';

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

  // Count products per category
  const productCountByCategory = (realCategories || []).reduce((acc, category) => {
    const count = allProducts.filter(
      (p) => p.categories && p.categories.some((c) => c.category?.id === category.id)
    ).length;
    acc[category.id] = count || 0;
    return acc;
  }, {} as Record<string, number>);

  // Transform real categories to display format
  const displayCategories = (realCategories || [])
    .filter((cat) => cat.image_url)
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

        {/* Categories Grid */}
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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {displayCategories.map((category) => (
              <motion.div key={category.id} variants={itemVariants}>
                <Link to={`/shop?category=${category.slug}`}>
                  <motion.div
                    whileHover={{ y: -10 }}
                    className="group relative h-96 rounded-3xl overflow-hidden shadow-xl"
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <motion.img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
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
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                      >
                        <span className="text-white/80 text-sm">
                          {category.products} {category.products === 1 ? 'producto' : 'productos'}
                        </span>
                        <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mt-2">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-white/80 text-sm mt-2 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                        <motion.div
                          className="mt-4 flex items-center gap-2 text-white font-medium"
                          whileHover={{ x: 5 }}
                        >
                          <span>{t('categories.view_all')}</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
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
