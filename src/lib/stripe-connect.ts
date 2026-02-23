/**
 * Utilidades de Stripe Connect para el frontend
 * Gaby Cosmetics - Sistema de Pagos Seguro
 */

// ==========================================
// TIPOS
// ==========================================

export interface StripeConnectStatus {
  connected: boolean;
  stripe_account_id?: string;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  can_receive_payments: boolean;
  has_pending_requirements: boolean;
  pending_requirements: string[];
  requirements: Record<string, unknown>;
  onboarding_started_at?: string;
  onboarding_completed_at?: string;
  message: string;
}

export interface OnboardingResponse {
  success: boolean;
  url: string;
  stripe_account_id: string;
  is_new_account: boolean;
}

// ==========================================
// FUNCIONES DE STRIPE CONNECT
// ==========================================

/**
 * Inicia el proceso de onboarding de Stripe Connect
 */
export async function initiateStripeOnboarding(
  companyId: string,
  returnUrl?: string,
  refreshUrl?: string
): Promise<OnboardingResponse> {
  const response = await fetch('/api/stripe/connect/onboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company_id: companyId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al iniciar onboarding');
  }

  return response.json();
}

/**
 * Obtiene el estado de la cuenta Stripe Connect
 */
export async function getStripeConnectStatus(
  companyId: string
): Promise<StripeConnectStatus> {
  const response = await fetch(`/api/stripe/connect/status?company_id=${companyId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener estado');
  }

  return response.json();
}

/**
 * Crea un enlace para el dashboard de Stripe Express
 */
export async function createStripeDashboardLink(
  companyId: string
): Promise<{ url: string }> {
  const response = await fetch('/api/stripe/connect/dashboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company_id: companyId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear enlace');
  }

  return response.json();
}

// ==========================================
// HOOKS DE ESTADO
// ==========================================

/**
 * Estados posibles de una cuenta Stripe Connect
 */
export const STRIPE_CONNECT_STATES = {
  NOT_CONNECTED: 'not_connected',
  ONBOARDING_PENDING: 'onboarding_pending',
  PENDING_REQUIREMENTS: 'pending_requirements',
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const;

export type StripeConnectState = typeof STRIPE_CONNECT_STATES[keyof typeof STRIPE_CONNECT_STATES];

/**
 * Determina el estado de la cuenta para mostrar en UI
 */
export function determineConnectState(status: StripeConnectStatus): StripeConnectState {
  if (!status.connected) {
    return STRIPE_CONNECT_STATES.NOT_CONNECTED;
  }

  if (!status.onboarding_complete) {
    return STRIPE_CONNECT_STATES.ONBOARDING_PENDING;
  }

  if (status.has_pending_requirements) {
    return STRIPE_CONNECT_STATES.PENDING_REQUIREMENTS;
  }

  if (!status.charges_enabled || !status.payouts_enabled) {
    return STRIPE_CONNECT_STATES.DISABLED;
  }

  return STRIPE_CONNECT_STATES.ACTIVE;
}

/**
 * Obtiene el mensaje y color para mostrar en UI
 */
export function getConnectStateDisplay(state: StripeConnectState): {
  label: string;
  description: string;
  color: 'gray' | 'yellow' | 'orange' | 'green' | 'red';
  icon: 'link' | 'clock' | 'alert' | 'check' | 'x';
} {
  switch (state) {
    case STRIPE_CONNECT_STATES.NOT_CONNECTED:
      return {
        label: 'No conectado',
        description: 'Conecta tu cuenta de Stripe para recibir pagos',
        color: 'gray',
        icon: 'link',
      };
    case STRIPE_CONNECT_STATES.ONBOARDING_PENDING:
      return {
        label: 'Configuración pendiente',
        description: 'Completa la configuración de tu cuenta de Stripe',
        color: 'yellow',
        icon: 'clock',
      };
    case STRIPE_CONNECT_STATES.PENDING_REQUIREMENTS:
      return {
        label: 'Requisitos pendientes',
        description: 'Hay información adicional requerida para tu cuenta',
        color: 'orange',
        icon: 'alert',
      };
    case STRIPE_CONNECT_STATES.ACTIVE:
      return {
        label: 'Cuenta activa',
        description: 'Tu cuenta está lista para recibir pagos',
        color: 'green',
        icon: 'check',
      };
    case STRIPE_CONNECT_STATES.DISABLED:
      return {
        label: 'Cuenta deshabilitada',
        description: 'Tu cuenta tiene restricciones. Contacta a soporte.',
        color: 'red',
        icon: 'x',
      };
    default:
      return {
        label: 'Estado desconocido',
        description: 'No se pudo determinar el estado de la cuenta',
        color: 'gray',
        icon: 'link',
      };
  }
}

// ==========================================
// UTILIDADES DE FORMATO
// ==========================================

/**
 * Formatea una fecha ISO a formato legible
 */
export function formatConnectDate(isoDate: string | undefined): string {
  if (!isoDate) return 'N/A';
  
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

/**
 * Traduce los requisitos pendientes a español
 */
export function translateRequirement(requirement: string): string {
  const translations: Record<string, string> = {
    'individual.first_name': 'Nombre del representante',
    'individual.last_name': 'Apellido del representante',
    'individual.dob.day': 'Fecha de nacimiento (día)',
    'individual.dob.month': 'Fecha de nacimiento (mes)',
    'individual.dob.year': 'Fecha de nacimiento (año)',
    'individual.address.line1': 'Dirección del representante',
    'individual.address.city': 'Ciudad del representante',
    'individual.address.postal_code': 'Código postal del representante',
    'individual.address.state': 'Estado/Provincia del representante',
    'individual.email': 'Email del representante',
    'individual.phone': 'Teléfono del representante',
    'individual.ssn_last_4': 'Últimos 4 dígitos del SSN',
    'individual.id_number': 'Número de identificación',
    'individual.verification.document': 'Documento de verificación',
    'company.name': 'Nombre de la empresa',
    'company.tax_id': 'ID fiscal de la empresa',
    'company.address.line1': 'Dirección de la empresa',
    'company.address.city': 'Ciudad de la empresa',
    'company.address.postal_code': 'Código postal de la empresa',
    'company.address.state': 'Estado/Provincia de la empresa',
    'business_profile.url': 'Sitio web del negocio',
    'business_profile.mcc': 'Código de categoría del negocio',
    'external_account': 'Cuenta bancaria',
    'tos_acceptance.date': 'Aceptación de términos',
    'tos_acceptance.ip': 'IP de aceptación de términos',
  };

  return translations[requirement] || requirement;
}

/**
 * Obtiene la lista de requisitos pendientes traducidos
 */
export function getTranslatedRequirements(requirements: string[]): string[] {
  return requirements.map(translateRequirement);
}