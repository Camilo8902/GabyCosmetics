import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: ShippingFormData) => {
    try {
      // Guardar en localStorage para persistencia
      localStorage.setItem('checkout_shipping', JSON.stringify(data));
      onNext(data);
    } catch (error) {
      console.error('Error al guardar dirección:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Dirección de Envío</h3>

      <div>
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input
          id="fullName"
          placeholder="Juan Pérez"
          {...register('fullName')}
          className={errors.fullName ? 'border-red-500' : ''}
        />
        {errors.fullName && (
          <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="juan@example.com"
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            placeholder="+34 XXX XX XX XX"
            {...register('phone')}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          placeholder="Calle Principal 123"
          {...register('address')}
          className={errors.address ? 'border-red-500' : ''}
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            placeholder="Madrid"
            {...register('city')}
            className={errors.city ? 'border-red-500' : ''}
          />
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="zipCode">Código postal</Label>
          <Input
            id="zipCode"
            placeholder="28001"
            {...register('zipCode')}
            className={errors.zipCode ? 'border-red-500' : ''}
          />
          {errors.zipCode && (
            <p className="text-red-500 text-sm mt-1">{errors.zipCode.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-6"
        size="lg"
      >
        {isSubmitting ? 'Guardando...' : 'Continuar al Pago'}
      </Button>
    </form>
  );
}
