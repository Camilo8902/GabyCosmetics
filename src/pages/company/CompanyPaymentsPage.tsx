import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Shield,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  getStripeConnectStatus,
  initiateStripeOnboarding,
  determineConnectState,
  getConnectStateDisplay,
  getTranslatedRequirements,
  formatConnectDate,
  type StripeConnectStatus,
} from '@/lib/stripe-connect';

type PageState = 'loading' | 'error' | 'ready';

export function CompanyPaymentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [isStartingOnboarding, setIsStartingOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener company_id del usuario
  const companyId = user?.company_id;

  // Verificar si viene de Stripe con éxito o refresh
  const stripeSuccess = searchParams.get('stripe') === 'success';
  const stripeRefresh = searchParams.get('stripe') === 'refresh';

  // Cargar estado de Stripe Connect
  useEffect(() => {
    if (!companyId) {
      setPageState('error');
      setError('No tienes una empresa asociada a tu cuenta');
      return;
    }

    loadConnectStatus();
  }, [companyId]);

  // Si viene de Stripe, recargar estado
  useEffect(() => {
    if ((stripeSuccess || stripeRefresh) && companyId) {
      loadConnectStatus();
    }
  }, [stripeSuccess, stripeRefresh, companyId]);

  const loadConnectStatus = async () => {
    try {
      setPageState('loading');
      const status = await getStripeConnectStatus(companyId!);
      setConnectStatus(status);
      setPageState('ready');
    } catch (err) {
      console.error('Error cargando estado:', err);
      setError('Error al cargar el estado de tu cuenta de pagos');
      setPageState('error');
    }
  };

  const handleStartOnboarding = async () => {
    if (!companyId) return;

    try {
      setIsStartingOnboarding(true);
      setError(null);

      const origin = window.location.origin;
      const response = await initiateStripeOnboarding(
        companyId,
        `${origin}/company/payments?stripe=success`,
        `${origin}/company/payments?stripe=refresh`
      );

      // Redirigir a Stripe
      window.location.href = response.url;
    } catch (err) {
      console.error('Error iniciando onboarding:', err);
      setError(err instanceof Error ? err.message : 'Error al conectar con Stripe');
      setIsStartingOnboarding(false);
    }
  };

  // Renderizado de estados
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando información de pagos...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/company')}>
              Volver al Dashboard
            </Button>
            <Button onClick={loadConnectStatus}>
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Determinar estado de la conexión
  const connectState = connectStatus ? determineConnectState(connectStatus) : 'not_connected';
  const stateDisplay = getConnectStateDisplay(connectState);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/company')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Configuración de Pagos</h1>
          <p className="text-gray-600 mt-2">
            Conecta tu cuenta de Stripe para recibir pagos de tus ventas
          </p>
        </div>

        {/* Alerta de éxito después del onboarding */}
        {stripeSuccess && connectStatus?.onboarding_complete && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">¡Cuenta configurada exitosamente!</p>
                <p className="text-sm text-green-700">
                  Tu cuenta de Stripe está lista para recibir pagos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de refresh */}
        {stripeRefresh && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-900">El proceso fue interrumpido</p>
                <p className="text-sm text-yellow-700">
                  Por favor, completa la configuración para poder recibir pagos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <p className="text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Estado de la cuenta */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Estado de tu Cuenta</h2>

              {/* Status Card */}
              <div className={`p-6 rounded-lg border-2 ${
                stateDisplay.color === 'green' ? 'border-green-500 bg-green-50' :
                stateDisplay.color === 'yellow' ? 'border-yellow-500 bg-yellow-50' :
                stateDisplay.color === 'orange' ? 'border-orange-500 bg-orange-50' :
                stateDisplay.color === 'red' ? 'border-red-500 bg-red-50' :
                'border-gray-300 bg-gray-50'
              }`}>
                <div className="flex items-center gap-4">
                  {stateDisplay.icon === 'check' && <CheckCircle2 className="w-12 h-12 text-green-600" />}
                  {stateDisplay.icon === 'clock' && <Clock className="w-12 h-12 text-yellow-600" />}
                  {stateDisplay.icon === 'alert' && <AlertCircle className="w-12 h-12 text-orange-600" />}
                  {stateDisplay.icon === 'x' && <AlertCircle className="w-12 h-12 text-red-600" />}
                  {stateDisplay.icon === 'link' && <CreditCard className="w-12 h-12 text-gray-600" />}
                  
                  <div>
                    <h3 className="text-xl font-bold">{stateDisplay.label}</h3>
                    <p className="text-gray-600">{stateDisplay.description}</p>
                  </div>
                </div>
              </div>

              {/* Detalles de la cuenta */}
              {connectStatus?.connected && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">Detalles de la cuenta</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${connectStatus.onboarding_complete ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className="text-gray-700">
                        Onboarding: {connectStatus.onboarding_complete ? 'Completo' : 'Pendiente'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${connectStatus.charges_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-gray-700">
                        Cobros: {connectStatus.charges_enabled ? 'Habilitados' : 'Deshabilitados'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${connectStatus.payouts_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-gray-700">
                        Pagos: {connectStatus.payouts_enabled ? 'Habilitados' : 'Deshabilitados'}
                      </span>
                    </div>
                    
                    {connectStatus.onboarding_completed_at && (
                      <div className="text-gray-700">
                        <span className="font-medium">Completado:</span>{' '}
                        {formatConnectDate(connectStatus.onboarding_completed_at)}
                      </div>
                    )}
                  </div>

                  {/* Requisitos pendientes */}
                  {connectStatus.has_pending_requirements && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-semibold text-orange-900 mb-2">
                        Información requerida
                      </h4>
                      <ul className="list-disc list-inside text-orange-800 text-sm space-y-1">
                        {getTranslatedRequirements(connectStatus.pending_requirements).map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div className="mt-6 flex flex-wrap gap-4">
                {!connectStatus?.connected || !connectStatus?.onboarding_complete ? (
                  <Button
                    onClick={handleStartOnboarding}
                    disabled={isStartingOnboarding}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    {isStartingOnboarding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Conectar con Stripe
                      </>
                    )}
                  </Button>
                ) : connectStatus.has_pending_requirements ? (
                  <Button
                    onClick={handleStartOnboarding}
                    disabled={isStartingOnboarding}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isStartingOnboarding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Completar información
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleStartOnboarding}
                    disabled={isStartingOnboarding}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualizar cuenta
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Beneficios */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Beneficios</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Pagos seguros procesados por Stripe</span>
                </li>
                <li className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Recibe pagos directamente en tu cuenta</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Panel de control para gestionar tus ventas</span>
                </li>
              </ul>
            </div>

            {/* Información de comisiones */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Comisiones</h3>
              <p className="text-gray-600 text-sm mb-4">
                La comisión de la plataforma se descuenta automáticamente de cada venta.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan Básico:</span>
                  <span className="font-medium">20% + $0.30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan Premium:</span>
                  <span className="font-medium">12% + $0.25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan Enterprise:</span>
                  <span className="font-medium">7% + $0.20</span>
                </div>
              </div>
            </div>

            {/* Ayuda */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">¿Necesitas ayuda?</h3>
              <p className="text-blue-800 text-sm mb-4">
                Si tienes problemas para configurar tu cuenta, contáctanos.
              </p>
              <a
                href="mailto:soporte@gabycosmetics.com"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                soporte@gabycosmetics.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyPaymentsPage;