import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export function CartDrawer() {
  const { t, i18n } = useTranslation();
  const { items, isOpen, setCartOpen, removeItem, updateQuantity, getSubtotal, clearCart } = useCartStore();

  const subtotal = getSubtotal();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6" />
                <h2 className="text-xl font-bold">{t('cart.title')}</h2>
                <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-sm font-medium">
                  {items.length}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
                  >
                    <ShoppingBag className="w-12 h-12 text-gray-400" />
                  </motion.div>
                  <p className="text-gray-500 mb-6">{t('cart.empty')}</p>
                  <Link to="/shop" onClick={() => setCartOpen(false)}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-rose-600 transition-colors"
                    >
                      {t('cart.continue_shopping')}
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex gap-4 p-4 bg-gray-50 rounded-2xl"
                      >
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={i18n.language === 'en' ? item.product.name_en : item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-rose-100 to-amber-100" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/product/${item.product.slug}`}
                            onClick={() => setCartOpen(false)}
                            className="font-medium text-gray-900 hover:text-rose-600 transition-colors line-clamp-1"
                          >
                            {i18n.language === 'en' ? item.product.name_en : item.product.name}
                          </Link>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              ${item.product.price.toFixed(2)}
                            </span>
                            {item.product.compare_at_price && (
                              <span className="text-sm text-gray-400 line-through">
                                ${item.product.compare_at_price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100"
                              >
                                <Minus className="w-4 h-4" />
                              </motion.button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100"
                              >
                                <Plus className="w-4 h-4" />
                              </motion.button>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeItem(item.product.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Clear Cart Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearCart}
                    className="w-full py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    Vaciar Carrito
                  </motion.button>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-6 space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('cart.subtotal')}</span>
                  <span className="text-2xl font-bold">${subtotal.toFixed(2)}</span>
                </div>

                <p className="text-sm text-gray-500 text-center">
                  Impuestos y envío calculados al finalizar
                </p>

                {/* Checkout Button */}
                <Link to="/checkout" onClick={() => setCartOpen(false)}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                  >
                    {t('cart.checkout')}
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>

                {/* Continue Shopping */}
                <Link
                  to="/shop"
                  onClick={() => setCartOpen(false)}
                  className="block text-center text-gray-600 hover:text-rose-600 transition-colors"
                >
                  {t('cart.continue_shopping')}
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
