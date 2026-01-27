import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RotateCcw } from 'lucide-react';

export function FailurePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12">
      <div className="mx-auto max-w-md px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Pago Rechazado</h1>
          <p className="text-gray-600 mb-6">No pudimos procesar tu pago. Por favor intenta de nuevo.</p>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/checkout')}
              className="w-full"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reintentar Pago
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
