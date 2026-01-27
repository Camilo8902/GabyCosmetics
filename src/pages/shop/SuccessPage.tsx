import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Download, Home } from 'lucide-react';

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!orderId) {
      navigate('/');
    }
  }, [orderId, navigate]);

  const handleDownloadReceipt = () => {
    // TODO: Implementar descarga de recibo
    console.log('Descargando recibo...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="mx-auto max-w-md px-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-6 rounded-full bg-green-100 p-6">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>

            <CardHeader className="text-center">
              <CardTitle className="text-2xl">¡Pago Confirmado!</CardTitle>
            </CardHeader>

            <div className="mb-8 space-y-2 text-center">
              <p className="text-gray-600">Tu orden ha sido procesada exitosamente</p>
              <p className="text-sm font-mono text-gray-500">
                Número: <span className="font-bold">{orderId}</span>
              </p>
            </div>

            <div className="mb-8 w-full space-y-2 rounded-lg bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-900">Próximos pasos:</p>
              <ul className="space-y-1 text-sm text-green-800">
                <li>✓ Recibirás un email de confirmación</li>
                <li>✓ Seguimiento del envío disponible</li>
                <li>✓ Entrega estimada: 2-5 días hábiles</li>
              </ul>
            </div>

            <div className="w-full space-y-3">
              <Button
                onClick={handleDownloadReceipt}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar Recibo
              </Button>

              <Button onClick={() => navigate('/')} className="w-full" size="lg">
                <Home className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>¿Necesitas ayuda? Contacta a support@gabycosmetics.com</p>
        </div>
      </div>
    </div>
  );
}
