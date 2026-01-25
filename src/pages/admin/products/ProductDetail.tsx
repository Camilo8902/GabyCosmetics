import { Link } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useProduct, useDeleteProduct, useUpdateProduct } from '@/hooks';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id || null);
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Producto eliminado exitosamente');
      navigate('/admin/products');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleToggleStatus = async (field: 'is_active' | 'is_visible') => {
    if (!product || !id) return;
    try {
      await updateProduct.mutateAsync({
        id,
        updates: {
          [field]: !product[field],
        },
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Producto no encontrado</p>
        <Link
          to="/admin/products"
          className="mt-4 text-rose-600 hover:underline"
        >
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/products"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600 mt-1">{product.name_en}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleStatus('is_visible')}
            className={`p-2 rounded-lg transition-colors ${
              product.is_visible
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={product.is_visible ? 'Ocultar' : 'Mostrar'}
          >
            {product.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <Link
            to={`/admin/products/${product.id}/edit`}
            className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            <Edit className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {product.images && product.images.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Imágenes</h2>
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Descripción</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Español</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Inglés</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{product.description_en}</p>
              </div>
            </div>
          </div>

          {/* Categories */}
          {product.categories && product.categories.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Categorías</h2>
              <div className="flex flex-wrap gap-2">
                {product.categories.map((cat: any) => (
                  <span
                    key={cat.id || cat.category?.id}
                    className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm"
                  >
                    {cat.name || cat.category?.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Precios</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Precio</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(product.price)}</p>
              </div>
              {product.compare_at_price && (
                <div>
                  <p className="text-sm text-gray-500">Precio Comparado</p>
                  <p className="text-lg text-gray-400 line-through">
                    {formatCurrency(product.compare_at_price)}
                  </p>
                </div>
              )}
              {product.cost_price && (
                <div>
                  <p className="text-sm text-gray-500">Precio de Costo</p>
                  <p className="text-lg text-gray-600">{formatCurrency(product.cost_price)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Inventario</h2>
            <div className="space-y-3">
              {product.sku && (
                <div>
                  <p className="text-sm text-gray-500">SKU</p>
                  <p className="text-sm font-medium text-gray-900">{product.sku}</p>
                </div>
              )}
              {product.barcode && (
                <div>
                  <p className="text-sm text-gray-500">Código de Barras</p>
                  <p className="text-sm font-medium text-gray-900">{product.barcode}</p>
                </div>
              )}
              {product.inventory && product.inventory.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Stock</p>
                  <p className={`text-lg font-bold ${
                    (product.inventory[0]?.quantity || 0) < 10 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {product.inventory[0]?.quantity || 0}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Estado</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Activo</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    product.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {product.is_active ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Visible</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    product.is_visible
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {product.is_visible ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Destacado</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    product.is_featured
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {product.is_featured ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Información</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Creado</span>
                <span className="text-gray-900">{formatDate(product.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actualizado</span>
                <span className="text-gray-900">{formatDate(product.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        variant="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
