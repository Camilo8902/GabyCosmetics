import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Eye, Clock } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useProducts } from '@/hooks';
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

  // Get category name
  const productAny = product as any;
  const categoryName = productAny.categories?.[0]?.category?.name || 
                      productAny.categories?.[0]?.name || 
                      '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <motion.img
            src={productImage}
            alt={name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => addItem(product)}
              className="p-3 bg-white text-gray-900 rounded-full shadow-lg hover:bg-rose-600 hover:text-white transition-all duration-300"
              title="Agregar al carrito"
            >
              <ShoppingBag className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleItem(product)}
              className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
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
                className="p-3 bg-white text-gray-900 rounded-full shadow-lg hover:bg-rose-600 hover:text-white transition-all duration-300"
                title="Ver detalles"
              >
                <Eye className="w-5 h-5" />
              </motion.button>
            </Link>
          </div>

          {/* Badges */}
          {discount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-4 left-4 bg-rose-600 text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              -{discount}%
            </motion.div>
          )}
          
          {/* New badge for recent products */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            Nuevo
          </motion.div>
          
          {/* Category badge */}
          {categoryName && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="absolute top-4 left-4 bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              {categoryName}
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Name */}
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-medium text-gray-900 hover:text-rose-600 transition-colors line-clamp-2">
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
            className="mt-4 w-full py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            {t('products.add_to_cart')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function RecentProducts() {
  const { t } = useTranslation();
  const { data: products = [] } = useProducts(8);
  
  // Only display real products from database
  const displayProducts = products.length > 0 ? products : [];

  return (
    <section className="py-24 bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-rose-600 font-medium tracking-wider uppercase text-sm flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Recién llegados
          </span>
          <h2 className="mt-2 text-4xl md:text-5xl font-serif font-bold text-gray-900">
            {t('products.new_arrivals')}
          </h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '4rem' }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="h-1 bg-rose-600 mx-auto mt-4 rounded-full"
          />
        </motion.div>

        {/* Products Grid - 4 columns */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/shop?sort=newest">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-rose-600 transition-colors"
            >
              Ver Todos los Nuevos
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
