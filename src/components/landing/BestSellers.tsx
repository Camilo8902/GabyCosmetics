import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Flame } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useBestSellers } from '@/hooks';
import type { Product } from '@/types';

export function BestSellers() {
  const { t, i18n } = useTranslation();
  const { addItem } = useCartStore();
  const { data: products = [] } = useBestSellers(4);

  const fallbackProducts = [
    {
      id: '5',
      name: 'Kit Completo Cabello',
      name_en: 'Complete Hair Kit',
      slug: 'kit-completo-cabello',
      price: 799,
      compare_at_price: 999,
      image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop',
      badge: 'TOP 1',
    },
    {
      id: '6',
      name: 'Aceite de Argán Puro',
      name_en: 'Pure Argan Oil',
      slug: 'aceite-argan-puro',
      price: 399,
      compare_at_price: 499,
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
      badge: 'TOP 2',
    },
    {
      id: '7',
      name: 'Tratamiento Nocturno',
      name_en: 'Night Treatment',
      slug: 'tratamiento-nocturno',
      price: 549,
      image: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=400&h=400&fit=crop',
      badge: 'TOP 3',
    },
    {
      id: '8',
      name: 'Spray Protector Térmico',
      name_en: 'Thermal Protector Spray',
      slug: 'spray-protector-termico',
      price: 279,
      compare_at_price: 349,
      image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop',
      badge: 'HOT',
    },
  ];

  const displayProducts = products && products.length > 0 ? products : fallbackProducts;

  return (
    <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(244,63,94,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(251,191,36,0.1),transparent_50%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 bg-rose-600/20 text-rose-400 px-4 py-2 rounded-full text-sm font-medium mb-4"
          >
            <Flame className="w-4 h-4" />
            <span>Trending Now</span>
            <TrendingUp className="w-4 h-4" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold">
            {t('products.best_sellers')}
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            Los productos favoritos de nuestros clientes. Calidad comprobada y resultados garantizados.
          </p>
        </motion.div>

        {/* Products */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product, index) => {
            const productImage = (product as any).images?.[0]?.url || (product as any).image || 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop';
            const badge = (product as any).badge || `TOP ${index + 1}`;
            
            return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10 hover:border-rose-500/50 transition-colors">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <motion.img
                    src={productImage}
                    alt={i18n.language === 'en' ? product.name_en : product.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  />

                  {/* Badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -12 }}
                    animate={{ scale: 1, rotate: -12 }}
                    className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-sm font-bold ${
                      badge === 'HOT'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white'
                    }`}
                  >
                    {badge}
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="font-medium text-white hover:text-rose-400 transition-colors line-clamp-1">
                      {i18n.language === 'en' ? product.name_en : product.name}
                    </h3>
                  </Link>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">
                        ${product.price}
                      </span>
                      {product.compare_at_price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.compare_at_price}
                        </span>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => addItem(product)}
                      className="p-3 bg-rose-600 rounded-full hover:bg-rose-500 transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/shop?sort=best-sellers">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 rounded-full font-medium hover:from-rose-500 hover:to-pink-500 transition-all"
            >
              Ver Todos los Más Vendidos
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
