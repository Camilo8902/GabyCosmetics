import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const shippingSchema = z.object({
  fullName: z.string().min(3, 'Nombre requerido (mínimo 3 caracteres)'),
  email: z.string().email('Email válido requerido'),
  phone: z.string().min(10, 'Teléfono válido requerido'),
  address: z.string().min(5, 'Dirección requerida'),
  city: z.string().min(2, 'Ciudad requerida'),
  zipCode: z.string().min(3, 'Código postal requerido'),
});

export type ShippingFormData = z.infer<typeof shippingSchema>;

interface ShippingFormProps {
  onNext: (data: ShippingFormData) => void;
  initialData?: ShippingFormData;
}

export function ShippingForm({ onNext, initialData }: ShippingFormProps) {
  console.log('📦 [ShippingForm] Component rendering');
  
  try {
    console.log('📦 [ShippingForm] Initializing useForm hook');
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = useForm<ShippingFormData>({
      resolver: zodResolver(shippingSchema),
      defaultValues: initialData,
    });
    
    console.log('📦 [ShippingForm] useForm initialized successfully');

    const onSubmit = async (data: ShippingFormData) => {
    console.log('📝 [ShippingForm] Form submitted with data:', data);
    try {
      // Guardar en localStorage para persistencia
      localStorage.setItem('checkout_shipping', JSON.stringify(data));
      console.log('💾 [ShippingForm] Data saved to localStorage');
      
      console.log('📞 [ShippingForm] Calling onNext callback');
      onNext(data);
      console.log('✅ [ShippingForm] onNext callback completed');
    } catch (error) {
      console.error('❌ [ShippingForm] Error al guardar dirección:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Dirección de Envío</h3>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium mb-2">Nombre completo</label>
        <input
          id="fullName"
          placeholder="Juan Pérez"
          {...register('fullName')}
          className={`w-full px-3 py-2 border rounded-lg ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.fullName && (
          <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
          <input
            id="email"
            type="email"
            placeholder="juan@example.com"
            {...register('email')}
            className={`w-full px-3 py-2 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-2">Teléfono</label>
          <input
            id="phone"
            placeholder="+34 XXX XX XX XX"
            {...register('phone')}
            className={`w-full px-3 py-2 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium mb-2">Dirección</label>
        <input
          id="address"
          placeholder="Calle Principal 123"
          {...register('address')}
          className={`w-full px-3 py-2 border rounded-lg ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-2">Ciudad</label>
          <input
            id="city"
            placeholder="Madrid"
            {...register('city')}
            className={`w-full px-3 py-2 border rounded-lg ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium mb-2">Código postal</label>
          <input
            id="zipCode"
            placeholder="28001"
            {...register('zipCode')}
            className={`w-full px-3 py-2 border rounded-lg ${errors.zipCode ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.zipCode && (
            <p className="text-red-500 text-sm mt-1">{errors.zipCode.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
      >
        {isSubmitting ? 'Guardando...' : 'Continuar al Pago'}
      </button>
    </form>
    );
  } catch (error) {
    console.error('🔴 [ShippingForm] Error rendering ShippingForm:', error);
    console.error('📍 [ShippingForm] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 font-semibold">Error al renderizar el formulario de envío</p>
      </div>
    );
  }
}
