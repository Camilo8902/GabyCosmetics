import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Flame, Heart, Eye } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useBestSellers } from '@/hooks';
import type { Product } from '@/types';

export function BestSellers() {
  const { t, i18n } = useTranslation();
  const { addItem } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { data: products = [] } = useBestSellers(4);

  // Only display real products from database
  const displayProducts = products && products.length > 0 ? products : [];

  // Don't render if no products available
  if (displayProducts.length === 0) {
    return null;
  }

return (
    <section className="section-padding bg-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(244,63,94,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(251,191,36,0.1),transparent_50%)]" />
      </div>

      <div className="relative container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
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
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-gray-400 max-w-xl mx-auto"
          >
            Los productos favoritos de nuestros clientes. Calidad comprobada y resultados garantizados.
          </motion.p>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '5rem' }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="h-1 bg-gradient-to-r from-rose-500 to-pink-600 mx-auto mt-6 rounded-full"
          />
        </motion.div>

        {/* Products */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product, index) => {
            const productImage = (product as any).images?.[0]?.url || (product as any).image_url || (product as any).image || 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop';
            const badge = (product as any).badge || `TOP ${index + 1}`;
            const isWishlisted = isInWishlist(product.id);
            
            return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <div className="glass-card bg-gray-900/80">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden rounded-t-2xl">
                  <motion.img
                    src={productImage}
                    alt={i18n.language === 'en' ? product.name_en : product.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />

                  {/* Badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -12 }}
                    animate={{ scale: 1, rotate: -12 }}
                    className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-sm font-bold shadow-lg ${
                      badge === 'HOT'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white'
                    }`}
                  >
                    {badge}
                  </motion.div>

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
                    <div className="flex gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleItem(product)}
                        className={`p-3 rounded-full shadow-md transition-all ${
                          isWishlisted
                            ? 'bg-rose-600 text-white'
                            : 'bg-white text-gray-900 hover:bg-rose-600 hover:text-white'
                        }`}
                        title={isWishlisted ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      >
                        <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                      </motion.button>
                      <Link to={`/product/${product.slug}`}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 bg-white text-gray-900 rounded-full shadow-md hover:bg-rose-600 hover:text-white transition-all"
                          title="Ver detalles"
                        >
                          <Eye className="w-5 h-5" />
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="font-semibold text-white hover:text-rose-400 transition-colors line-clamp-1">
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
                      className="p-3 bg-gradient-to-r from-rose-600 to-pink-600 rounded-full hover:from-rose-500 hover:to-pink-500 transition-all shadow-lg shadow-rose-600/30"
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
              className="px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 rounded-xl font-medium hover:from-rose-500 hover:to-pink-500 transition-all shadow-lg shadow-rose-600/30"
            >
              Ver Todos los Más Vendidos
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
