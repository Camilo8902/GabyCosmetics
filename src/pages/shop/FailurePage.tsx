import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home, RotateCcw } from 'lucide-react';

export function FailurePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12">
      <div className="mx-auto max-w-md px-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-6 rounded-full bg-red-100 p-6">
              <AlertCircle className="h-16 w-16 text-red-600" />
            </div>

            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Pago Rechazado</CardTitle>
            </CardHeader>

            <div className="mb-8 space-y-2 text-center">
              <p className="text-gray-600">No pudimos procesar tu pago</p>
              <p className="text-sm text-gray-500">Por favor intenta con otro método</p>
            </div>

            <div className="mb-8 w-full space-y-2 rounded-lg bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">Posibles razones:</p>
              <ul className="space-y-1 text-sm text-red-800">
                <li>• Fondos insuficientes</li>
                <li>• Tarjeta expirada o bloqueada</li>
                <li>• Datos incorrectos</li>
                <li>• Límite diario alcanzado</li>
              </ul>
            </div>

            <div className="w-full space-y-3">
              <Button
                onClick={() => navigate('/checkout')}
                className="w-full"
                size="lg"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reintentar Pago
              </Button>

              <Button onClick={() => navigate('/')} variant="outline" className="w-full" size="lg">
                <Home className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>¿Problemas? Contacta a support@gabycosmetics.com</p>
        </div>
      </div>
    </div>
  );
}
