import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Home } from 'lucide-react';

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!orderId) {
      navigate('/');
    }
  }, [orderId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="mx-auto max-w-md px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-600 mb-2">¡Pago Exitoso!</h1>
          <p className="text-gray-600 mb-2">Tu orden ha sido creada correctamente</p>
          <p className="text-sm text-gray-500 mb-6">ID: {orderId}</p>
          
          <Button
            onClick={() => navigate('/')}
            className="w-full"
            size="lg"
          >
            <Home className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
