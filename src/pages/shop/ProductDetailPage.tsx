import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Star, ShoppingBag, Heart, Share2, Truck, Shield, RefreshCw } from 'lucide-react';
import { useProducts } from '@/hooks';
import { useCartStore } from '@/store/cartStore';
import { Loader } from 'lucide-react';
import { ProductImageGallery } from '@/components/shop/ProductImageGallery';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addItem } = useCartStore();
  const { data: productsData, isLoading } = useProducts();

  const products = productsData?.data || [];
  const product = products.find((p: any) => p.slug === slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-pink-500" size={48} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Producto no encontrado</h1>
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
        >
          <ArrowLeft size={20} />
          Volver a la tienda
        </button>
      </div>
    );
  }

  const images = product.images || [];
  const mainImage = images[0]?.url || product.image_url;
  const secondaryImages = images.slice(1);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: mainImage,
      slug: product.slug,
    });
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Header Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft size={18} />
          <span>Volver a la tienda</span>
        </button>
      </div>

      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images with Gallery and Zoom */}
          <ProductImageGallery
            images={product.images || []}
            productName={product.name}
            image_url={product.image_url}
          />

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* Title and Rating */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">4.0 (120 reseñas)</span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap">
                <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.compare_at_price && (
                  <span className="text-lg sm:text-xl text-gray-500 line-through">
                    ${product.compare_at_price.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-sm text-green-600 font-medium">En stock: {product.stock || 10} unidades</p>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Descripción</h3>
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Add to Cart */}
            <div className="space-y-2 sm:space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="w-full py-3 sm:py-4 bg-gray-900 text-white text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                Agregar al carrito
              </motion.button>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="py-2 sm:py-3 border-2 border-gray-900 text-gray-900 text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-1 sm:gap-2"
                >
                  <Heart size={18} />
                  <span className="hidden sm:inline">Favoritos</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="py-2 sm:py-3 border-2 border-gray-900 text-gray-900 text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-1 sm:gap-2"
                >
                  <Share2 size={18} />
                  <span className="hidden sm:inline">Compartir</span>
                </motion.button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 sm:pt-6 border-t">
              <div className="text-center space-y-1 sm:space-y-2">
                <Truck className="w-6 sm:w-8 h-6 sm:h-8 text-rose-600 mx-auto" />
                <p className="text-xs sm:text-sm font-medium text-gray-900">Envío rápido</p>
              </div>
              <div className="text-center space-y-1 sm:space-y-2">
                <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-rose-600 mx-auto" />
                <p className="text-xs sm:text-sm font-medium text-gray-900">Compra segura</p>
              </div>
              <div className="text-center space-y-1 sm:space-y-2">
                <RefreshCw className="w-6 sm:w-8 h-6 sm:h-8 text-rose-600 mx-auto" />
                <p className="text-xs sm:text-sm font-medium text-gray-900">30 días retorno</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        <div className="mt-20 pt-12 border-t">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">Productos Relacionados</h2>
          {/* This can be extended with similar products */}
        </div>
      </div>
    </div>
  );
}
