import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Star, Eye } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useFeaturedProducts } from '@/hooks';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product & { image?: string };
  index: number;
}

function ProductCard({ product, index }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const { addItem } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);

  // Get image from product.images array, image_url, or fallback to demo image
  const productImage = product.images?.[0]?.url || product.image_url || product.image || 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop';
  const name = i18n.language === 'en' ? product.name_en : product.name;
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  // Get category name (handle different data structures)
  const productAny = product as any;
  const categoryName = productAny.categories?.[0]?.category?.name || 
                      productAny.categories?.[0]?.name || 
                      '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group"
    >
      <div className="glass-card card-hover">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-t-2xl">
          <motion.img
            src={productImage}
            alt={name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
            <div className="flex gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => addItem(product)}
                className="p-3 bg-white text-gray-900 rounded-full shadow-md hover:bg-rose-600 hover:text-white transition-all"
                title="Agregar al carrito"
              >
                <ShoppingBag className="w-5 h-5" />
              </motion.button>
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

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {discount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-r from-rose-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md"
              >
                -{discount}%
              </motion.span>
            )}
            {categoryName && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm"
              >
                {categoryName}
              </motion.span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
              />
            ))}
            <span className="text-xs text-gray-400 ml-1">(24)</span>
          </div>

          {/* Name */}
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-semibold text-gray-900 hover:text-rose-600 transition-colors line-clamp-2 text-base">
              {name}
            </h3>
          </Link>

          {/* Price */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-400 line-through">
                ${product.compare_at_price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => addItem(product)}
            className="mt-4 w-full py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-medium hover:from-rose-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-rose-500/20"
          >
            <ShoppingBag className="w-4 h-4" />
            {t('products.add_to_cart')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturedProducts() {
  const { t } = useTranslation();
  const { data: products = [] } = useFeaturedProducts(8);
  
  // Only display real products from database, no fallbacks with demo images
  const displayProducts = products.length > 0 ? products : [];

  return (
    <section className="section-padding bg-gradient-to-b from-white via-rose-50/30 to-white">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-block px-4 py-1.5 bg-rose-100 text-rose-700 font-medium tracking-wider uppercase text-xs rounded-full"
          >
            Lo mejor para ti
          </motion.span>
          <h2 className="mt-4 text-4xl md:text-5xl font-serif font-bold text-gray-900">
            {t('products.featured')}
          </h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-gray-500 max-w-xl mx-auto"
          >
            Descubre nuestra selección premium de productos de belleza
          </motion.p>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '5rem' }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="h-1 bg-gradient-to-r from-rose-500 to-pink-600 mx-auto mt-6 rounded-full"
          />
        </motion.div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {displayProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link to="/shop">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary"
            >
              Ver Todos los Productos
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
