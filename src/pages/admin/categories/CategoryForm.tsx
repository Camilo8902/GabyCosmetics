import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader, Upload, Image as ImageIcon, X } from 'lucide-react';
import { FormField } from '@/components/ui/FormField';
import { useCategory } from '@/hooks/useCategories';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import toast from 'react-hot-toast';

// Validation schema
const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').min(2, 'El nombre debe tener al menos 2 caracteres'),
  name_en: z
    .string()
    .min(1, 'El nombre en inglés es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().optional(),
  description_en: z.string().optional(),
  image_url: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export function CategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get existing category data if editing
  const { data: category } = useCategory(id || null);

  const methods = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      name_en: '',
      slug: '',
      description: '',
      description_en: '',
      image_url: '',
    },
  });

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isLoading = createMutation.isPending || updateMutation.isPending || uploading;

  // Populate form with existing data
  useEffect(() => {
    if (isEdit && category) {
      methods.reset({
        name: category.name,
        name_en: category.name_en,
        slug: category.slug,
        description: category.description || '',
        description_en: category.description_en || '',
        image_url: category.image_url || '',
      });
      if (category.image_url) {
        setImagePreview(category.image_url);
      }
    }
  }, [category, isEdit, methods]);

  // Auto-generate slug from name
  const watchName = methods.watch('name');
  useEffect(() => {
    if (!isEdit && watchName) {
      const slug = watchName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      methods.setValue('slug', slug);
    }
  }, [watchName, isEdit, methods]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe exceder 5MB');
      return;
    }

    try {
      setUploading(true);
      
      // Convert to data URL for preview and storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        methods.setValue('image_url', dataUrl);
        toast.success('Imagen seleccionada correctamente');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      toast.error('Error al procesar la imagen');
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    methods.setValue('image_url', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({
          id,
          updates: {
            ...data,
            updated_at: new Date().toISOString(),
          },
        });
        // Toast already shown by hook
      } else {
        console.log('Creating category with data:', data);
        await createMutation.mutateAsync({
          ...data,
          is_active: true,
          order_index: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        // Toast already shown by hook
      }
      navigate('/admin/categories');
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error(`Error: ${errorMsg}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/admin/categories')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Categoría' : 'Nueva Categoría'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Modifica los detalles de la categoría' : 'Crea una nueva categoría de productos'}
          </p>
        </div>
      </div>

      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-lg shadow p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Name (Spanish) */}
            <FormField
              name="name"
              label="Nombre (Español)"
              placeholder="Ej: Cuidado del Cabello"
              type="text"
              required
            />

            {/* Name (English) */}
            <FormField
              name="name_en"
              label="Nombre (Inglés)"
              placeholder="Ej: Hair Care"
              type="text"
              required
            />
          </div>

          {/* Slug */}
          <FormField
            name="slug"
            label="Slug (URL-friendly)"
            placeholder="cuidado-cabello"
            type="text"
            required
            helperText="Se genera automáticamente, pero puedes editarlo. Solo letras minúsculas, números y guiones"
          />

          {/* Descriptions */}
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              name="description"
              label="Descripción (Español)"
              placeholder="Describe esta categoría..."
              type="textarea"
            />

            <FormField
              name="description_en"
              label="Descripción (Inglés)"
              placeholder="Describe this category..."
              type="textarea"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Foto de Portada
            </label>
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 group">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            )}

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                imagePreview
                  ? 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  : 'border-rose-300 hover:border-rose-400 bg-rose-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={uploading}
                className="hidden"
              />
              
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin text-rose-600" />
                  <span className="text-gray-600">Procesando imagen...</span>
                </div>
              ) : imagePreview ? (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <ImageIcon className="w-5 h-5" />
                  <span>Cambiar imagen</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-rose-600 mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Arrastra una imagen o haz click para seleccionar
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF hasta 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hidden input for image_url */}
          <input
            type="hidden"
            {...methods.register('image_url')}
          />

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => navigate('/admin/categories')}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                isEdit ? 'Actualizar Categoría' : 'Crear Categoría'
              )}
            </motion.button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
