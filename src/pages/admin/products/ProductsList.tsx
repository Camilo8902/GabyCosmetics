import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useProducts, useDeleteProduct, useUpdateProduct } from '@/hooks';
import { DataTable } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency } from '@/utils/formatters';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

export function ProductsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  
  // Debug logging
  console.log('🔍 ProductsList renderizado');
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { data: categories } = useCategories(true);
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  // Build filters
  const filters: any = {
    search: searchQuery || undefined,
    includeInactive: true, // Admin can see all products
    includeInvisible: true, // Admin can see all products
  };

  if (statusFilter === 'active') {
    filters.is_active = true;
  } else if (statusFilter === 'inactive') {
    filters.is_active = false;
  }
  // 'all' doesn't set is_active filter, so it shows all

  if (categoryFilter) {
    filters.categoryId = categoryFilter;
  }

  const { data, isLoading, error, isError } = useProducts(filters, page, pageSize);

  const products = data?.data || [];
  const total = data?.total || 0;

  // Debug logging
  console.log('🔍 ProductsList estado:', {
    isLoading,
    isError,
    error: error?.message,
    dataLength: products.length,
    total,
  });

  // Show error state (only for non-auth errors)
  if (isError && error && !(error as any)?.message?.includes('Auth')) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-900 mb-2">Error al cargar productos</h3>
          <p className="text-red-700">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    try {
      console.log('🗑️ [ProductsList] Iniciando eliminación de producto:', id);
      await deleteProduct.mutateAsync(id);
      console.log('✅ [ProductsList] Producto eliminado exitosamente');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('❌ [ProductsList] Error al eliminar producto:', error);
      // Error is handled by the hook
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        updates: {
          is_active: !product.is_active,
        },
      });
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        updates: {
          is_visible: !product.is_visible,
        },
      });
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProducts.size === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    try {
      if (action === 'delete') {
        // Delete all selected
        await Promise.all(
          Array.from(selectedProducts).map((id) => deleteProduct.mutateAsync(id))
        );
      } else {
        // Activate or deactivate
        const isActive = action === 'activate';
        await Promise.all(
          Array.from(selectedProducts).map((id) =>
            updateProduct.mutateAsync({
              id,
              updates: { is_active: isActive },
            })
          )
        );
      }
      setSelectedProducts(new Set());
      toast.success(`Acción completada para ${selectedProducts.size} producto(s)`);
    } catch (error) {
      toast.error('Error al realizar la acción');
    }
  };

  const toggleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  };

  const columns: Array<any> = [
    {
      key: 'select',
      header: (
        <button onClick={toggleSelectAll} className="p-1 hover:bg-gray-100 rounded">
          {selectedProducts.size === products.length && products.length > 0 ? (
            <CheckSquare className="w-4 h-4 text-rose-600" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </button>
      ),
      render: (product: Product) => (
        <button
          onClick={() => toggleSelectProduct(product.id)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {selectedProducts.has(product.id) ? (
            <CheckSquare className="w-4 h-4 text-rose-600" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </button>
      ),
      sortable: false,
    },
    {
      key: 'image',
      header: 'Imagen',
      render: (product: Product) => {
        // Priorizar images[0].url, luego image_url, luego placeholder
        const imageUrl = product.images?.[0]?.url || product.image_url || '/placeholder-product.png';
        return (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-12 h-12 object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.png';
            }}
          />
        );
      },
      sortable: false,
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (product: Product) => (
        <div>
          <Link
            to={`/admin/products/${product.id}`}
            className="font-medium text-gray-900 hover:text-rose-600"
          >
            {product.name}
          </Link>
          {product.name_en && (
            <p className="text-sm text-gray-500">{product.name_en}</p>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'price',
      header: 'Precio',
      render: (product: Product) => (
        <div>
          <span className="font-medium text-gray-900">{formatCurrency(product.price)}</span>
          {product.compare_at_price && (
            <p className="text-sm text-gray-400 line-through">
              {formatCurrency(product.compare_at_price)}
            </p>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (product: Product) => {
        const stock = product.inventory?.[0]?.quantity || 0;
        return (
          <span className={stock < 10 ? 'text-red-600 font-medium' : 'text-gray-900'}>
            {stock}
          </span>
        );
      },
      sortable: false,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (product: Product) => (
        <div className="flex flex-col gap-1">
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
              product.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {product.is_active ? 'Activo' : 'Inactivo'}
          </span>
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
              product.is_visible
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {product.is_visible ? 'Visible' : 'Oculto'}
          </span>
        </div>
      ),
      sortable: false,
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (product: Product) => {
        const category = product.categories?.[0]?.category;
        return category ? (
          <span className="text-sm text-gray-600">{category.name}</span>
        ) : (
          <span className="text-sm text-gray-400">Sin categoría</span>
        );
      },
      sortable: false,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleVisibility(product)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={product.is_visible ? 'Ocultar' : 'Mostrar'}
          >
            {product.is_visible ? (
              <Eye className="w-4 h-4 text-gray-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <Link
            to={`/admin/products/${product.id}/edit`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </Link>
          <button
            onClick={() => {
              setProductToDelete(product.id);
              setDeleteDialogOpen(true);
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-600 mt-1">
            Administra todos los productos de la tienda
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Búsqueda
            </label>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por nombre..."
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Todas las categorías</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t flex items-center gap-2"
          >
            <span className="text-sm text-gray-600">
              {selectedProducts.size} producto(s) seleccionado(s)
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Activar
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Desactivar
              </button>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar ${selectedProducts.size} producto(s)?`)) {
                    handleBulkAction('delete');
                  }
                }}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border p-12">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      ) : (
        <DataTable
          data={products}
          columns={columns}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={false}
          emptyMessage="No se encontraron productos"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={() => productToDelete && handleDelete(productToDelete)}
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        variant="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
