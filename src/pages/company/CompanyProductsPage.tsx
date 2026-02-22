import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useCompanyId, useCompanyProducts } from '@/hooks/useCompanyMetrics';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export function CompanyProductsPage() {
  const navigate = useNavigate();
  const { companyId } = useCompanyId();
  const { data: categories } = useCategories(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const { data, isLoading, refetch } = useCompanyProducts(
    companyId,
    page,
    10,
    { search, status: statusFilter, category: categoryFilter }
  );

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      toast.success(currentStatus ? 'Producto desactivado' : 'Producto activado');
      refetch();
    } catch (error) {
      console.error('Error toggling product:', error);
      toast.error('Error al actualizar el producto');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast.success('Producto eliminado');
      refetch();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProducts.length === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    try {
      if (action === 'delete') {
        if (!confirm(`¿Eliminar ${selectedProducts.length} productos?`)) return;
        
        const { error } = await supabase
          .from('products')
          .delete()
          .in('id', selectedProducts);
        
        if (error) throw error;
        toast.success('Productos eliminados');
      } else {
        const { error } = await supabase
          .from('products')
          .update({ 
            is_active: action === 'activate', 
            updated_at: new Date().toISOString() 
          })
          .in('id', selectedProducts);
        
        if (error) throw error;
        toast.success(action === 'activate' ? 'Productos activados' : 'Productos desactivados');
      }

      setSelectedProducts([]);
      refetch();
    } catch (error) {
      console.error('Error in bulk action:', error);
      toast.error('Error al realizar la acción');
    }
  };

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500">No tienes una empresa asociada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Productos</h1>
          <p className="text-gray-500">Gestiona el catálogo de tu empresa</p>
        </div>
        <Link
          to="/company/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Todas las categorías</option>
            {categories?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="mt-4 flex items-center gap-4 p-3 bg-rose-50 rounded-lg">
            <span className="text-sm text-rose-700">
              {selectedProducts.length} seleccionados
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Activar
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
              >
                Desactivar
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === data.data.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(data.data.map((p: any) => p.id));
                          } else {
                            setSelectedProducts([]);
                          }
                        }}
                        className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.data.map((product: any) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, product.id]);
                            } else {
                              setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                            }
                          }}
                          className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.product_categories?.[0]?.categories && (
                              <p className="text-sm text-gray-500">
                                {product.product_categories[0].categories.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatCurrency(product.price)}
                          </p>
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <p className="text-sm text-gray-400 line-through">
                              {formatCurrency(product.compare_at_price)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'px-2 py-1 text-xs font-medium rounded-full',
                              product.stock_quantity > 10
                                ? 'bg-green-100 text-green-700'
                                : product.stock_quantity > 0
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            )}
                          >
                            {product.stock_quantity} uds
                          </span>
                          {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleActive(product.id, product.is_active)}
                          className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-full text-sm',
                            product.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          )}
                        >
                          {product.is_active ? (
                            <>
                              <Eye className="w-4 h-4" />
                              <span>Visible</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4" />
                              <span>Oculto</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === product.id ? null : product.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                          </button>

                          {actionMenuOpen === product.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActionMenuOpen(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                                <Link
                                  to={`/company/products/${product.id}/edit`}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit className="w-4 h-4" />
                                  Editar
                                </Link>
                                <button
                                  onClick={() => {
                                    handleToggleActive(product.id, product.is_active);
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  {product.is_active ? (
                                    <>
                                      <EyeOff className="w-4 h-4" />
                                      Ocultar
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-4 h-4" />
                                      Mostrar
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    handleDelete(product.id);
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Eliminar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, data.total)} de {data.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          'w-8 h-8 rounded-lg text-sm font-medium',
                          page === pageNum
                            ? 'bg-rose-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || statusFilter ? 'No se encontraron productos' : 'No tienes productos aún'}
            </h3>
            <p className="text-gray-500 mb-4">
              {search || statusFilter
                ? 'Intenta con otros filtros de búsqueda'
                : 'Comienza agregando tu primer producto al catálogo'}
            </p>
            {!search && !statusFilter && (
              <Link
                to="/company/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                <Plus className="w-4 h-4" />
                Agregar Producto
              </Link>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}