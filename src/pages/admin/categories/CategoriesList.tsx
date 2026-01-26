import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Loader, ToggleRight, ToggleLeft } from 'lucide-react';
import { useCategories, useDeleteCategory, useUpdateCategoryStatus } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import type { Category } from '@/types';

export function CategoriesList() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useCategories(true);
  const { data: productsData } = useProducts();
  const allProducts = productsData?.data || [];
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory();
  const { mutate: updateCategoryStatus, isPending: isUpdatingStatus } = useUpdateCategoryStatus();

  // Count products per category
  const getProductCount = (categoryId: string) => {
    return (allProducts || []).filter(
      (p) => p.categories && p.categories.some((c) => c.category?.id === categoryId)
    ).length;
  };

  const handleDelete = (category: Category) => {
    const productCount = getProductCount(category.id);
    if (productCount > 0) {
      toast.error(`No se puede eliminar una categoría con ${productCount} producto(s)`);
      return;
    }
    setSelectedCategory(category);
    setShowDeleteConfirm(true);
  };

  const handleToggleStatus = (category: Category) => {
    console.log('🔄 [CategoriesList] Toggle status de categoría:', category.id);
    updateCategoryStatus(
      { id: category.id, is_active: !category.is_active },
      {
        onSuccess: () => {
          console.log('✅ [CategoriesList] Estado actualizado');
        },
        onError: (error) => {
          console.error('❌ [CategoriesList] Error:', error);
        },
      }
    );
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      console.log('🗑️ [CategoriesList] Confirmando eliminación:', selectedCategory.id);
      deleteCategory(selectedCategory.id, {
        onSuccess: () => {
          console.log('✅ [CategoriesList] Categoría eliminada');
          toast.success('Categoría eliminada exitosamente');
          setShowDeleteConfirm(false);
          setSelectedCategory(null);
        },
        onError: (error) => {
          console.error('❌ [CategoriesList] Error en eliminación:', error);
        },
      });
    }
  };

  if (categoriesLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader className="w-8 h-8 text-rose-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-600 mt-1">Gestiona todas tus categorías de productos</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/admin/categories/new')}
          className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Categoría
        </motion.button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(categories || []).map((category) => (
                <motion.tr
                  key={category.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-sm text-gray-500">{category.name_en}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {category.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {getProductCount(category.id)} producto
                      {getProductCount(category.id) !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {category.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/admin/categories/${category.id}/edit`)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleStatus(category)}
                        disabled={isUpdatingStatus}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={category.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {isUpdatingStatus ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : category.is_active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(category)}
                        disabled={isDeleting || getProductCount(category.id) > 0}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={getProductCount(category.id) > 0 ? `No se puede eliminar: ${getProductCount(category.id)} producto(s)` : 'Eliminar'}
                      >
                        {isDeleting ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {categories && categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay categorías creadas aún</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/categories/new')}
              className="mt-4 text-rose-600 hover:text-rose-700 font-medium"
            >
              Crear la primera categoría
            </motion.button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedCategory(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro que deseas eliminar la categoría "${selectedCategory?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
