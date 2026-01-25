import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Star, Eye } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useFeaturedProducts } from '@/hooks';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product & { image?: string };
  index: number;
}

function ProductCard({ product, index }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const { addItem } = useCartStore();

  // Get image from product.images array or fallback to demo image
  const productImage = product.images?.[0]?.url || product.image || 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop';
  const name = i18n.language === 'en' ? product.name_en : product.name;
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

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
              className="p-3 bg-white rounded-full shadow-lg hover:bg-rose-600 hover:text-white transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 bg-white rounded-full shadow-lg hover:bg-rose-600 hover:text-white transition-colors"
            >
              <Heart className="w-5 h-5" />
            </motion.button>
            <Link to={`/product/${product.slug}`}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 bg-white rounded-full shadow-lg hover:bg-rose-600 hover:text-white transition-colors"
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
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
              />
            ))}
            <span className="text-sm text-gray-500 ml-1">(24)</span>
          </div>

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

export function FeaturedProducts() {
  const { t } = useTranslation();
  const { data: products = [] } = useFeaturedProducts(8);
  
  // Fallback to demo products if no real products exist
  const fallbackProducts: (Product & { image: string })[] = [
    {
      id: '1',
      company_id: null,
      name: 'Shampoo Reparador Intensivo',
      name_en: 'Intensive Repair Shampoo',
      slug: 'shampoo-reparador-intensivo',
      description: 'Shampoo profesional para cabello dañado',
      description_en: 'Professional shampoo for damaged hair',
      price: 299,
      compare_at_price: 399,
      has_variants: false,
      is_active: true,
      is_featured: true,
      is_visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop',
    },
    {
      id: '2',
      company_id: null,
      name: 'Acondicionador Nutritivo',
      name_en: 'Nourishing Conditioner',
      slug: 'acondicionador-nutritivo',
      description: 'Acondicionador con keratina y aceite de argán',
      description_en: 'Conditioner with keratin and argan oil',
      price: 249,
      has_variants: false,
      is_active: true,
      is_featured: true,
      is_visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
    },
    {
      id: '3',
      company_id: null,
      name: 'Mascarilla Capilar Premium',
      name_en: 'Premium Hair Mask',
      slug: 'mascarilla-capilar-premium',
      description: 'Tratamiento intensivo semanal',
      description_en: 'Weekly intensive treatment',
      price: 449,
      compare_at_price: 549,
      has_variants: false,
      is_active: true,
      is_featured: true,
      is_visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=400&fit=crop',
    },
    {
      id: '4',
      company_id: null,
      name: 'Sérum Anti-Frizz',
      name_en: 'Anti-Frizz Serum',
      slug: 'serum-anti-frizz',
      description: 'Sérum para control del frizz',
      description_en: 'Frizz control serum',
      price: 349,
      has_variants: false,
      is_active: true,
      is_featured: true,
      is_visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop',
    },
  ];

  const displayProducts = products && products.length > 0 ? products : fallbackProducts;

  return (
    <section className="py-24 bg-gradient-to-b from-white to-rose-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-rose-600 font-medium tracking-wider uppercase text-sm">
            Lo mejor para ti
          </span>
          <h2 className="mt-2 text-4xl md:text-5xl font-serif font-bold text-gray-900">
            {t('products.featured')}
          </h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '4rem' }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="h-1 bg-rose-600 mx-auto mt-4 rounded-full"
          />
        </motion.div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
          <Link to="/shop">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-rose-600 transition-colors"
            >
              Ver Todos los Productos
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
