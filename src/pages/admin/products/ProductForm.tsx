import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  useProduct, 
  useCreateProduct, 
  useUpdateProduct,
  useUploadProductImage,
  useSetProductCategories
} from '@/hooks';
import { productSchema } from '@/utils/validators';
import { FormField } from '@/components/ui/FormField';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useCategories } from '@/hooks/useCategories';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

type ProductFormData = {
  name: string;
  name_en: string;
  slug: string;
  description: string;
  description_en: string;
  short_description?: string;
  short_description_en?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  is_active: boolean;
  is_featured: boolean;
  is_visible: boolean;
  company_id?: string;
  categoryIds?: string[];
};

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { data: product, isLoading: loadingProduct } = useProduct(id || null);
  const { data: categories } = useCategories(true);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadProductImage = useUploadProductImage();
  const setProductCategories = useSetProductCategories();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      is_active: true,
      is_featured: false,
      is_visible: true,
    },
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Auto-generate slug from name
  const nameValue = watch('name');
  useEffect(() => {
    if (nameValue && !isEditing) {
      const slug = nameValue
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', slug);
    }
  }, [nameValue, isEditing, setValue]);

  // Load product data when editing
  useEffect(() => {
    if (product && isEditing) {
      setValue('name', product.name);
      setValue('name_en', product.name_en);
      setValue('slug', product.slug);
      setValue('description', product.description);
      setValue('description_en', product.description_en);
      setValue('short_description', product.short_description);
      setValue('short_description_en', product.short_description_en);
      setValue('price', product.price);
      setValue('compare_at_price', product.compare_at_price);
      setValue('cost_price', product.cost_price);
      setValue('sku', product.sku);
      setValue('barcode', product.barcode);
      setValue('weight', product.weight);
      setValue('is_active', product.is_active);
      setValue('is_featured', product.is_featured);
      setValue('is_visible', product.is_visible);
      setValue('company_id', product.company_id);

      if (product.categories) {
        setSelectedCategories(product.categories.map((c: any) => c.id || c.category?.id));
      }
    }
  }, [product, isEditing, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditing && id) {
        // Update existing product
        await updateProduct.mutateAsync({
          id,
          updates: data,
        });
        // Note: Hook already shows success toast

        // Update image if provided
        if (imageFile) {
          try {
            await uploadProductImage.mutateAsync({
              productId: id,
              file: imageFile,
              isPrimary: true,
            });
          } catch (imageError) {
            console.error('Warning: Image upload failed but product was saved:', imageError);
            toast.error('Producto actualizado, pero la imagen no se pudo cargar');
          }
        }

        // Update categories
        try {
          if (selectedCategories.length > 0) {
            await setProductCategories.mutateAsync({
              productId: id,
              categoryIds: selectedCategories,
            });
          }
        } catch (categoryError) {
          console.error('Warning: Category update failed:', categoryError);
          toast.error('Producto actualizado, pero las categorías no se pudieron asignar');
        }
      } else {
        // Create new product
        const newProduct = await createProduct.mutateAsync(data);
        // Note: Hook already shows success toast
        
        // Upload image if provided
        if (imageFile) {
          try {
            await uploadProductImage.mutateAsync({
              productId: newProduct.id,
              file: imageFile,
              isPrimary: true,
            });
          } catch (imageError) {
            console.error('Warning: Image upload failed but product was created:', imageError);
            toast.error('Producto creado, pero la imagen no se pudo cargar');
          }
        }

        // Set categories
        try {
          if (selectedCategories.length > 0) {
            await setProductCategories.mutateAsync({
              productId: newProduct.id,
              categoryIds: selectedCategories,
            });
          }
        } catch (categoryError) {
          console.error('Warning: Category assignment failed:', categoryError);
          toast.error('Producto creado, pero las categorías no se pudieron asignar');
        }

        navigate(`/admin/products/${newProduct.id}/edit`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al guardar el producto: ${errorMessage}`);
    }
  };

  if (loadingProduct && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
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
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditing ? 'Modifica la información del producto' : 'Crea un nuevo producto para la tienda'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Información Básica</h2>
              <div className="space-y-4">
                <FormField
                  label="Nombre (Español)"
                  {...register('name')}
                  error={errors.name?.message}
                  required
                />
                <FormField
                  label="Nombre (Inglés)"
                  {...register('name_en')}
                  error={errors.name_en?.message}
                  required
                />
                <FormField
                  label="Slug"
                  {...register('slug')}
                  error={errors.slug?.message}
                  helperText="URL amigable (se genera automáticamente)"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (Español)
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      errors.description
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-rose-500'
                    }`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (Inglés)
                  </label>
                  <textarea
                    {...register('description_en')}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      errors.description_en
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-rose-500'
                    }`}
                  />
                  {errors.description_en && (
                    <p className="mt-1 text-sm text-red-500">{errors.description_en.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Precios</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  label="Precio"
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  error={errors.price?.message}
                  required
                />
                <FormField
                  label="Precio Comparado"
                  type="number"
                  step="0.01"
                  {...register('compare_at_price', { valueAsNumber: true })}
                  error={errors.compare_at_price?.message}
                  helperText="Precio anterior (para mostrar descuento)"
                />
                <FormField
                  label="Precio de Costo"
                  type="number"
                  step="0.01"
                  {...register('cost_price', { valueAsNumber: true })}
                  error={errors.cost_price?.message}
                  helperText="Solo para administración"
                />
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Inventario</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  label="SKU"
                  {...register('sku')}
                  error={errors.sku?.message}
                  helperText="Código único del producto"
                />
                <FormField
                  label="Código de Barras"
                  {...register('barcode')}
                  error={errors.barcode?.message}
                />
                <FormField
                  label="Peso (kg)"
                  type="number"
                  step="0.01"
                  {...register('weight', { valueAsNumber: true })}
                  error={errors.weight?.message}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Imagen Principal</h2>
              <ImageUploader
                value={product?.images?.[0]?.url}
                onChange={setImageFile}
                label=""
              />
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Categorías</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories?.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category.id]);
                        } else {
                          setSelectedCategories(selectedCategories.filter((id) => id !== category.id));
                        }
                      }}
                      className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Configuración</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Activo</span>
                  <input
                    type="checkbox"
                    {...register('is_active')}
                    className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Visible en Tienda</span>
                  <input
                    type="checkbox"
                    {...register('is_visible')}
                    className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Destacado</span>
                  <input
                    type="checkbox"
                    {...register('is_featured')}
                    className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                  </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
