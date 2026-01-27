import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Search,
  Globe,
  ChevronDown,
  Heart,
  LogOut,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

// Wrapper component that safely handles Router context
function HeaderContent() {
  const { t, i18n } = useTranslation();
  
  // Use window.location.pathname instead of useLocation() hook
  // This avoids React Router context issues during state transitions
  const currentPathname = window.location.pathname;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const { getItemCount, toggleCart } = useCartStore();
  const { user, isAuthenticated, logout, isAdmin, isCompany, isConsultant } = useAuthStore();

  const itemCount = getItemCount();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setIsLangMenuOpen(false);
  };

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/shop', label: t('nav.shop') },
    { href: '/about', label: t('nav.about') },
    { href: '/contact', label: t('nav.contact') },
  ];

  const getDashboardLink = () => {
    if (isAdmin()) return '/admin';
    if (isCompany()) return '/company';
    if (isConsultant()) return '/consultant';
    return '/account';
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src="/logo.png"
                alt="Gaby Cosmetics"
                className="h-12 w-auto"
              />
              <span className={cn(
                'font-serif text-xl font-bold tracking-wider hidden sm:block transition-colors',
                isScrolled ? 'text-gray-900' : 'text-gray-900'
              )}>
                GABY COSMETICS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'relative text-sm font-medium transition-colors hover:text-rose-600',
                    currentPathname === link.href
                      ? 'text-rose-600'
                      : isScrolled ? 'text-gray-700' : 'text-gray-800'
                  )}
                >
                  {link.label}
                  {currentPathname === link.href && (
                    <motion.div
                      layoutId="underline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-rose-600"
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchOpen(true)}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/20'
                )}
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Language Switcher */}
              <div className="relative hidden sm:block">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className={cn(
                    'p-2 rounded-full transition-colors flex items-center gap-1',
                    isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/20'
                  )}
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-xs uppercase">{i18n.language}</span>
                </motion.button>
                <AnimatePresence>
                  {isLangMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border py-2"
                    >
                      <button
                        onClick={() => toggleLanguage('es')}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                          i18n.language === 'es' && 'text-rose-600 font-medium'
                        )}
                      >
                        Español
                      </button>
                      <button
                        onClick={() => toggleLanguage('en')}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                          i18n.language === 'en' && 'text-rose-600 font-medium'
                        )}
                      >
                        English
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wishlist */}
              <Link to="/wishlist">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'p-2 rounded-full transition-colors hidden sm:block',
                    isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/20'
                  )}
                >
                  <Heart className="w-5 h-5" />
                </motion.button>
              </Link>

              {/* Cart */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleCart}
                className={cn(
                  'p-2 rounded-full transition-colors relative',
                  isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/20'
                )}
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-xs rounded-full flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </motion.button>

              {/* User Menu */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={cn(
                    'p-2 rounded-full transition-colors flex items-center gap-1',
                    isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/20'
                  )}
                >
                  {isAuthenticated && user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <ChevronDown className="w-4 h-4 hidden sm:block" />
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border py-2"
                    >
                      {isAuthenticated ? (
                        <>
                          <div className="px-4 py-2 border-b">
                            <p className="font-medium text-gray-900">{user?.full_name}</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                          </div>
                          <Link
                            to={getDashboardLink()}
                            onClick={() => {
                              const link = getDashboardLink();
                              console.log('🔗 Navegando a dashboard:', {
                                link,
                                userRole: user?.role,
                                isAdmin: isAdmin(),
                                isCompany: isCompany(),
                                isConsultant: isConsultant(),
                              });
                              setIsUserMenuOpen(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {isAdmin() ? 'Panel Admin' : isCompany() ? 'Panel Empresa' : isConsultant() ? 'Panel Consultor' : t('nav.dashboard')}
                          </Link>
                          <Link
                            to="/account"
                            onClick={() => {
                              console.log('🔗 Navegando a: /account');
                              setIsUserMenuOpen(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            <Settings className="w-4 h-4" />
                            {t('nav.account')}
                          </Link>
                          <button
                            onClick={async () => {
                              console.log('🚪 Cerrando sesión...');
                              setIsUserMenuOpen(false);
                              await logout();
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="w-4 h-4" />
                            {t('nav.logout')}
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/auth/login"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            {t('nav.login')}
                          </Link>
                          <Link
                            to="/auth/register"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            {t('nav.register')}
                          </Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t"
            >
              <nav className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'block py-2 px-4 rounded-lg transition-colors',
                      currentPathname === link.href
                        ? 'bg-rose-50 text-rose-600'
                        : 'hover:bg-gray-50'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 border-t flex gap-4">
                  <button
                    onClick={() => toggleLanguage('es')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm',
                      i18n.language === 'es'
                        ? 'bg-rose-600 text-white'
                        : 'bg-gray-100'
                    )}
                  >
                    ES
                  </button>
                  <button
                    onClick={() => toggleLanguage('en')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm',
                      i18n.language === 'en'
                        ? 'bg-rose-600 text-white'
                        : 'bg-gray-100'
                    )}
                  >
                    EN
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-32"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 p-4 border-b">
                <Search className="w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('products.search')}
                  className="flex-1 text-lg outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 text-center text-gray-500">
                {t('products.search')}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Export wrapper component that handles Router context safely
export function Header() {
  try {
    return <HeaderContent />;
  } catch (error) {
    console.error('Header error:', error);
    // Fallback - render minimal header without Router hooks
    return (
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-2xl font-bold text-rose-600">Gaby Cosmetics</div>
          <nav className="flex gap-6">
            <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
            <a href="/shop" className="text-gray-600 hover:text-gray-900">Shop</a>
          </nav>
        </div>
      </header>
    );
  }
}
