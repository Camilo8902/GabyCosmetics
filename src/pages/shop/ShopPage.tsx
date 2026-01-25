import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Grid,
  List,
  ChevronDown,
  ShoppingBag,
  Heart,
  Eye,
  Star,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useProducts, useCategories } from '@/hooks';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

// Demo products
const allProducts = [
  {
    id: '1',
    name: 'Shampoo Reparador Intensivo',
    name_en: 'Intensive Repair Shampoo',
    slug: 'shampoo-reparador-intensivo',
    price: 299,
    compare_at_price: 399,
    category: 'cuidado-cabello',
    subcategory: 'shampoos',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop',
    rating: 4.5,
    reviews: 124,
    is_featured: true,
  },
  {
    id: '2',
    name: 'Acondicionador Nutritivo',
    name_en: 'Nourishing Conditioner',
    slug: 'acondicionador-nutritivo',
    price: 249,
    compare_at_price: undefined,
    category: 'cuidado-cabello',
    subcategory: 'acondicionadores',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
    rating: 4.8,
    reviews: 89,
    is_featured: true,
  },
  {
    id: '3',
    name: 'Mascarilla Capilar Premium',
    name_en: 'Premium Hair Mask',
    slug: 'mascarilla-capilar-premium',
    price: 449,
    compare_at_price: 549,
    category: 'cuidado-cabello',
    subcategory: 'tratamientos-cabello',
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=400&fit=crop',
    rating: 4.9,
    reviews: 256,
    is_featured: true,
  },
  {
    id: '4',
    name: 'Sérum Anti-Frizz',
    name_en: 'Anti-Frizz Serum',
    slug: 'serum-anti-frizz',
    price: 349,
    compare_at_price: undefined,
    category: 'cuidado-cabello',
    subcategory: 'styling',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop',
    rating: 4.7,
    reviews: 67,
    is_featured: true,
  },
  {
    id: '5',
    name: 'Kit Completo Cabello',
    name_en: 'Complete Hair Kit',
    slug: 'kit-completo-cabello',
    price: 799,
    compare_at_price: 999,
    category: 'cuidado-cabello',
    subcategory: 'shampoos',
    image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop',
    rating: 4.9,
    reviews: 312,
    is_featured: false,
  },
  {
    id: '6',
    name: 'Aceite de Argán Puro',
    name_en: 'Pure Argan Oil',
    slug: 'aceite-argan-puro',
    price: 399,
    compare_at_price: 499,
    category: 'cuidado-cabello',
    subcategory: 'tratamientos-cabello',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
    rating: 4.8,
    reviews: 198,
    is_featured: false,
  },
  {
    id: '7',
    name: 'Jabón Artesanal Lavanda',
    name_en: 'Artisan Lavender Soap',
    slug: 'jabon-artesanal-lavanda',
    price: 89,
    compare_at_price: undefined,
    category: 'aseo-personal',
    subcategory: 'jabones',
    image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400&h=400&fit=crop',
    rating: 4.6,
    reviews: 145,
    is_featured: false,
  },
  {
    id: '8',
    name: 'Crema Corporal Hidratante',
    name_en: 'Moisturizing Body Cream',
    slug: 'crema-corporal-hidratante',
    price: 199,
    compare_at_price: 249,
    category: 'aseo-personal',
    subcategory: 'cremas-corporales',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
    rating: 4.4,
    reviews: 87,
    is_featured: false,
  },
];

const categories = [
  { slug: 'cuidado-cabello', name: 'Cuidado del Cabello', name_en: 'Hair Care' },
  { slug: 'aseo-personal', name: 'Aseo Personal', name_en: 'Personal Care' },
];

const sortOptions = [
  { value: 'featured', label: 'Destacados', label_en: 'Featured' },
  { value: 'newest', label: 'Más Recientes', label_en: 'Newest' },
  { value: 'price-asc', label: 'Precio: Menor a Mayor', label_en: 'Price: Low to High' },
  { value: 'price-desc', label: 'Precio: Mayor a Menor', label_en: 'Price: High to Low' },
  { value: 'rating', label: 'Mejor Valorados', label_en: 'Best Rated' },
];

export function ShopPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCartStore();
  const { data: realProducts = [], isLoading } = useProducts();
  const { data: realCategories = [] } = useCategories();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCategory = searchParams.get('category') || '';
  const selectedSort = searchParams.get('sort') || 'featured';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  // Demo products for fallback
  const demoProducts = [
    {
      id: '1',
      name: 'Shampoo Reparador Intensivo',
      name_en: 'Intensive Repair Shampoo',
      slug: 'shampoo-reparador-intensivo',
      price: 299,
      compare_at_price: 399,
      category: 'cuidado-cabello',
      subcategory: 'shampoos',
      image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop',
      rating: 4.5,
      reviews: 124,
      is_featured: true,
    },
    {
      id: '2',
      name: 'Acondicionador Nutritivo',
      name_en: 'Nourishing Conditioner',
      slug: 'acondicionador-nutritivo',
      price: 249,
      compare_at_price: undefined,
      category: 'cuidado-cabello',
      subcategory: 'acondicionadores',
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
      rating: 4.8,
      reviews: 89,
      is_featured: true,
    },
  ];

  // Convert real products to shop format and merge with demo
  const processedProducts = realProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    name_en: p.name_en,
    slug: p.slug,
    price: p.price,
    compare_at_price: p.compare_at_price,
    category: p.categories?.[0]?.slug || 'otros',
    subcategory: p.categories?.[0]?.slug || 'otros',
    image: p.images?.[0]?.url || 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop',
    rating: 4.5,
    reviews: 0,
    is_featured: p.is_featured,
  }));

  const allProducts = processedProducts.length > 0 ? processedProducts : demoProducts;
  const categories = realCategories.length > 0 ? realCategories : [
    { slug: 'cuidado-cabello', name: 'Cuidado del Cabello', name_en: 'Hair Care' },
    { slug: 'aseo-personal', name: 'Aseo Personal', name_en: 'Personal Care' },
  ];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = [...allProducts];

    // Category filter
    if (selectedCategory) {
      products = products.filter((p: any) => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(
        (p: any) =>
          p.name.toLowerCase().includes(query) ||
          p.name_en.toLowerCase().includes(query)
      );
    }

    // Price filter
    if (minPrice) {
      products = products.filter((p: any) => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      products = products.filter((p: any) => p.price <= Number(maxPrice));
    }

    // Sort
    switch (selectedSort) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        products.reverse();
        break;
      default:
        products.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    return products;
  }, [selectedCategory, selectedSort, searchQuery, minPrice, maxPrice, allProducts]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-xl w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('products.search')}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Filter Button (Mobile) */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border rounded-full hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>{t('products.filters')}</span>
              </motion.button>

              {/* Sort */}
              <div className="relative">
                <select
                  value={selectedSort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {i18n.language === 'en' ? option.label_en : option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* View Mode */}
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-full transition-colors',
                    viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-200'
                  )}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-full transition-colors',
                    viewMode === 'list' ? 'bg-white shadow' : 'hover:bg-gray-200'
                  )}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-44 space-y-6">
              {/* Categories */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">
                  {t('nav.categories')}
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => updateFilter('category', '')}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg transition-colors',
                      !selectedCategory
                        ? 'bg-rose-50 text-rose-600'
                        : 'hover:bg-gray-50'
                    )}
                  >
                    Todos los Productos
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => updateFilter('category', cat.slug)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-colors',
                        selectedCategory === cat.slug
                          ? 'bg-rose-50 text-rose-600'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      {i18n.language === 'en' ? cat.name_en : cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Precio</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedCategory || minPrice || maxPrice) && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                {filteredProducts.length} productos encontrados
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">{t('products.no_products')}</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-rose-600 hover:underline"
                >
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              <motion.div
                layout
                className={cn(
                  'grid gap-6',
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                )}
              >
                <AnimatePresence>
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow',
                        viewMode === 'list' && 'flex'
                      )}
                    >
                      {/* Image */}
                      <div
                        className={cn(
                          'relative overflow-hidden bg-gray-100',
                          viewMode === 'grid' ? 'aspect-square' : 'w-48 h-48 flex-shrink-0'
                        )}
                      >
                        <motion.img
                          src={product.image}
                          alt={i18n.language === 'en' ? product.name_en : product.name}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => addItem({ ...product, description: '', description_en: '', is_active: true, is_visible: true, created_at: '', updated_at: '' })}
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

                        {/* Discount Badge */}
                        {product.compare_at_price && (
                          <div className="absolute top-3 left-3 bg-rose-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className={cn('p-5', viewMode === 'list' && 'flex-1')}>
                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-4 h-4',
                                i < Math.floor(product.rating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-300'
                              )}
                            />
                          ))}
                          <span className="text-sm text-gray-500 ml-1">
                            ({product.reviews})
                          </span>
                        </div>

                        {/* Name */}
                        <Link to={`/product/${product.slug}`}>
                          <h3 className="font-medium text-gray-900 hover:text-rose-600 transition-colors line-clamp-2">
                            {i18n.language === 'en' ? product.name_en : product.name}
                          </h3>
                        </Link>

                        {/* Price */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-900">
                            ${product.price.toFixed(2)}
                          </span>
                          {product.compare_at_price && (
                            <span className="text-sm text-gray-400 line-through">
                              ${product.compare_at_price.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Add to Cart (List View) */}
                        {viewMode === 'list' && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addItem({ ...product, description: '', description_en: '', is_active: true, is_visible: true, created_at: '', updated_at: '' })}
                            className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-full font-medium hover:bg-rose-600 transition-colors inline-flex items-center gap-2"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            {t('products.add_to_cart')}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t('products.filters')}</h2>
                <button onClick={() => setIsFilterOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-4">{t('nav.categories')}</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      updateFilter('category', '');
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg transition-colors',
                      !selectedCategory ? 'bg-rose-50 text-rose-600' : 'hover:bg-gray-50'
                    )}
                  >
                    Todos
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => {
                        updateFilter('category', cat.slug);
                        setIsFilterOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-colors',
                        selectedCategory === cat.slug ? 'bg-rose-50 text-rose-600' : 'hover:bg-gray-50'
                      )}
                    >
                      {i18n.language === 'en' ? cat.name_en : cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-4">Precio</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  clearFilters();
                  setIsFilterOpen(false);
                }}
                className="w-full py-3 bg-gray-900 text-white rounded-full font-medium"
              >
                Aplicar Filtros
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
