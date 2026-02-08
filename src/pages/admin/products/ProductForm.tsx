import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
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
import { useAuthStore } from '@/store/authStore';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

// Función para generar SKU aleatorio
function generateRandomSKU(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `SKU-${timestamp}-${random}`;
}

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
  image_url?: string; // Base64 image URL (like categories)
};

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { data: product, isLoading: loadingProduct } = useProduct(id || null);
  const { data: categories } = useCategories(true);
  const { user, isAdmin, isCompany } = useAuthStore();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadProductImage = useUploadProductImage();
  const setProductCategories = useSetProductCategories();

  // Get company_id for the product
  const getCompanyId = () => {
    if (isAdmin()) {
      // Admin can create products - don't set company_id here
      // It will be set by the service or left null
      return undefined;
    }
    if (isCompany()) {
      return user?.company_id;
    }
    return undefined;
  };

  const methods = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      is_active: true,
      is_featured: false,
      is_visible: true,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = methods;

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Track loading state including async mutations
  const isLoading = isSubmitting || createProduct.isPending || updateProduct.isPending || uploadProductImage.isPending;

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
      console.log('🔵 [ProductForm] Cargando datos del producto:', product);
      setValue('name', product.name || '');
      setValue('name_en', product.name_en || '');
      setValue('slug', product.slug || '');
      setValue('description', product.description || '');
      setValue('description_en', product.description_en || '');
      setValue('short_description', product.short_description || undefined);
      setValue('short_description_en', product.short_description_en || undefined);
      // Convert numeric values to numbers in case they come as strings
      const price = typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0);
      setValue('price', price);
      const compareAtPrice = product.compare_at_price ? (typeof product.compare_at_price === 'string' ? parseFloat(product.compare_at_price) : product.compare_at_price) : undefined;
      setValue('compare_at_price', compareAtPrice);
      const costPrice = product.cost_price ? (typeof product.cost_price === 'string' ? parseFloat(product.cost_price) : product.cost_price) : undefined;
      setValue('cost_price', costPrice);
      setValue('sku', product.sku || undefined);
      setValue('barcode', product.barcode || undefined);
      const weight = product.weight ? (typeof product.weight === 'string' ? parseFloat(product.weight) : product.weight) : undefined;
      setValue('weight', weight);
      setValue('is_active', product.is_active || false);
      setValue('is_featured', product.is_featured || false);
      setValue('is_visible', product.is_visible || false);
      setValue('company_id', product.company_id || undefined);
      setValue('image_url', product.image_url || undefined); // Load image_url

      // Load image preview if exists
      if (product.image_url) {
        setImageFile(null); // Clear new file selection
      }

      // Load categories
      if (product.categories && Array.isArray(product.categories)) {
        const categoryIds = product.categories.map((c: any) => c.category?.id || c.category_id || c.id);
        console.log('🔵 [ProductForm] Categorías cargadas:', categoryIds);
        setSelectedCategories(categoryIds.filter(Boolean));
      }
    }
  }, [product, isEditing, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      console.log('🔵 [ProductForm] onSubmit iniciado');
      console.log('🔵 [ProductForm] isEditing:', isEditing);
      console.log('🔵 [ProductForm] Datos del formulario:', data);

      // Clean up optional fields - convert empty strings to undefined
      const cleanData = {
        ...data,
        short_description: data.short_description || undefined,
        short_description_en: data.short_description_en || undefined,
        sku: data.sku || undefined,
        barcode: data.barcode || undefined,
        company_id: data.company_id || undefined,
      };

      // If editing, check if there are actual changes
      if (isEditing && product) {
        console.log('🔵 [ProductForm] Comparando cambios...');
        console.log('🔵 [ProductForm] Producto original:', product);
        
        // Check if any field has changed (excluding SKU which can be regenerated)
        const hasChanges = 
          product.name !== cleanData.name ||
          product.name_en !== cleanData.name_en ||
          product.slug !== cleanData.slug ||
          product.description !== cleanData.description ||
          product.description_en !== cleanData.description_en ||
          product.short_description !== cleanData.short_description ||
          product.short_description_en !== cleanData.short_description_en ||
          product.price !== cleanData.price ||
          product.compare_at_price !== cleanData.compare_at_price ||
          product.cost_price !== cleanData.cost_price ||
          (cleanData.sku && product.sku !== cleanData.sku) ||
          product.barcode !== cleanData.barcode ||
          product.weight !== cleanData.weight ||
          product.is_active !== cleanData.is_active ||
          product.is_featured !== cleanData.is_featured ||
          product.is_visible !== cleanData.is_visible ||
          selectedCategories.length > 0 ||
          imageFile !== null;

        console.log('🔵 [ProductForm] ¿Hay cambios?:', hasChanges);

        if (!hasChanges) {
          console.log('⚠️ [ProductForm] No se realizaron cambios');
          toast.error('No se realizaron cambios en el producto');
          return;
        }
      }

      // Generate SKU if not provided and creating new product
      if (!isEditing && !cleanData.sku) {
        cleanData.sku = generateRandomSKU();
        console.log('🔵 [ProductForm] SKU generado:', cleanData.sku);
      }

      if (isEditing && id) {
        console.log('🟢 [ProductForm] Actualizando producto existente, ID:', id);
        
        // Procesar imagen si hay archivo nuevo
        let imageUrl = product?.image_url;
        if (imageFile) {
          try {
            console.log('🔵 [ProductForm] Procesando imagen como base64...');
            const reader = new FileReader();
            const base64Data = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(imageFile);
            });
            imageUrl = base64Data;
            console.log('✅ [ProductForm] Imagen procesada');
          } catch (e) {
            console.error('Error procesando imagen:', e);
          }
        }
        
        // Update existing product with image_url
        await updateProduct.mutateAsync({
          id,
          updates: { ...cleanData, image_url: imageUrl },
        });
        console.log('✅ [ProductForm] Producto actualizado exitosamente');

        // Navigate back
        console.log('🔵 [ProductForm] Navegando a lista de productos');
        navigate('/admin/products');
      } else {
        console.log('🟢 [ProductForm] Creando nuevo producto');
        
        // Procesar imagen ANTES de crear el producto
        let imageUrl: string | undefined;
        if (imageFile) {
          try {
            console.log('🔵 [ProductForm] Procesando imagen como base64...');
            const reader = new FileReader();
            imageUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(imageFile);
            });
            console.log('✅ [ProductForm] Imagen procesada');
          } catch (e) {
            console.error('Error procesando imagen:', e);
          }
        }
        
        // Create new product with image_url
        const productData = {
          ...cleanData,
          company_id: getCompanyId() || cleanData.company_id,
          image_url: imageUrl, // Guardar base64 directamente
        };
        const newProduct = await createProduct.mutateAsync(productData);
        console.log('✅ [ProductForm] Producto creado con imagen, ID:', newProduct.id);

        console.log('🔵 [ProductForm] Navegando a página de edición');
        navigate(`/admin/products/${newProduct.id}/edit`);
      }
    } catch (error) {
      console.error('❌ [ProductForm] Error saving product:', error);
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

      <FormProvider {...methods}>
        <form onSubmit={(e) => {
          console.log('🟡 [ProductForm] Evento submit del form disparado');
          console.log('🟡 [ProductForm] Errores de validación:', Object.keys(errors));
          handleSubmit(onSubmit)(e);
        }} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Información Básica</h2>
              <div className="space-y-4">
                <FormField
                  label="Nombre (Español)"
                  name="name"
                  required
                />
                <FormField
                  label="Nombre (Inglés)"
                  name="name_en"
                  required
                />
                <FormField
                  label="Slug"
                  name="slug"
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
                  name="price"
                  type="number"
                  step="0.01"
                  required
                />
                <FormField
                  label="Precio Comparado"
                  name="compare_at_price"
                  type="number"
                  step="0.01"
                  helperText="Precio anterior (para mostrar descuento)"
                />
                <FormField
                  label="Precio de Costo"
                  name="cost_price"
                  type="number"
                  step="0.01"
                  helperText="Solo para administración"
                />
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Inventario</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <FormField
                      label="SKU"
                      name="sku"
                      helperText="Código único del producto (se genera automáticamente)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue('sku', generateRandomSKU())}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
                    title="Generar nuevo SKU"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <FormField
                  label="Código de Barras"
                  name="barcode"
                />
                <FormField
                  label="Peso (kg)"
                  name="weight"
                  type="number"
                  step="0.01"
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
                value={product?.images?.[0]?.url || product?.image_url}
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
                    disabled={isLoading}
                    onClick={(e) => {
                      console.log('🖱️ [ProductForm] Click en botón submit');
                      console.log('🖱️ [ProductForm] isLoading:', isLoading);
                      console.log('🖱️ [ProductForm] isSubmitting:', methods.formState.isSubmitting);
                      console.log('🖱️ [ProductForm] Hay errores:', Object.keys(errors).length > 0);
                      console.log('🖱️ [ProductForm] Errores:', errors);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                  </button>
            </div>
          </div>
        </div>
        </form>
      </FormProvider>
    </div>
  );
}
