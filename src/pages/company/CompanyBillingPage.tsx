import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Check,
  X,
  Crown,
  Zap,
  Building2,
  ArrowRight,
  Download,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyMetrics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { subscriptionService, getCompanyUsage } from '@/services/subscriptionService';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import toast from 'react-hot-toast';

// Componente de tarjeta de plan
function PlanCard({
  plan,
  currentPlan,
  onSelect,
  isLoading,
}: {
  plan: (typeof SUBSCRIPTION_PLANS)[SubscriptionPlan];
  currentPlan: SubscriptionPlan;
  onSelect: () => void;
  isLoading: boolean;
}) {
  const isCurrent = plan.id === currentPlan;
  const isUpgrade = 
    (plan.id === 'premium' && currentPlan === 'basic') ||
    (plan.id === 'enterprise' && (currentPlan === 'basic' || currentPlan === 'premium'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-2xl border-2 p-6 transition-all',
        isCurrent
          ? 'border-rose-500 bg-rose-50'
          : 'border-gray-200 bg-white hover:border-rose-300'
      )}
    >
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-rose-500 text-white text-xs font-medium px-3 py-1 rounded-full">
            Plan Actual
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <div
          className={cn(
            'w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center',
            plan.id === 'basic' && 'bg-gray-100',
            plan.id === 'premium' && 'bg-blue-100',
            plan.id === 'enterprise' && 'bg-purple-100'
          )}
        >
          {plan.id === 'basic' && <Building2 className="w-6 h-6 text-gray-600" />}
          {plan.id === 'premium' && <Zap className="w-6 h-6 text-blue-600" />}
          {plan.id === 'enterprise' && <Crown className="w-6 h-6 text-purple-600" />}
        </div>
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
      </div>

      <div className="text-center mb-6">
        <span className="text-4xl font-bold text-gray-900">
          {formatCurrency(plan.price_monthly)}
        </span>
        <span className="text-gray-500">/mes</span>
        <p className="text-sm text-gray-400 mt-1">
          o {formatCurrency(plan.price_yearly)}/año (ahorra 2 meses)
        </p>
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isCurrent || isLoading}
        className={cn(
          'w-full py-3 rounded-xl font-medium transition-all',
          isCurrent
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isUpgrade
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        )}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : isCurrent ? (
          'Plan actual'
        ) : isUpgrade ? (
          'Actualizar plan'
        ) : (
          'Cambiar plan'
        )}
      </button>
    </motion.div>
  );
}

// Componente de uso de recursos
function UsageBar({
  label,
  current,
  limit,
  unit = '',
}: {
  label: string;
  current: number;
  limit: number;
  unit?: string;
}) {
  const percentage = limit === -1 ? 0 : (current / limit) * 100;
  const isWarning = percentage >= 80;
  const isDanger = percentage >= 95;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">
          {current}
          {unit} / {limit === -1 ? '∞' : `${limit}${unit}`}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isDanger
              ? 'bg-red-500'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-rose-500'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isWarning && limit !== -1 && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Cerca del límite del plan
        </p>
      )}
    </div>
  );
}

export function CompanyBillingPage() {
  const { companyId } = useCompanyId();
  const queryClient = useQueryClient();
  const [changingPlan, setChangingPlan] = useState<SubscriptionPlan | null>(null);

  // Obtener suscripción actual
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['companySubscription', companyId],
    queryFn: () => subscriptionService.getCompanySubscription(companyId || ''),
    enabled: !!companyId,
  });

  // Obtener uso actual
  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['companyUsage', companyId],
    queryFn: () => getCompanyUsage(companyId || ''),
    enabled: !!companyId,
  });

  // Mutación para cambiar plan
  const changePlanMutation = useMutation({
    mutationFn: async (newPlan: SubscriptionPlan) => {
      if (!subscription?.subscription?.id) throw new Error('No subscription found');
      return subscriptionService.updateSubscriptionPlan(
        subscription.subscription.id,
        newPlan
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companySubscription'] });
      queryClient.invalidateQueries({ queryKey: ['companyUsage'] });
      toast.success('Plan actualizado correctamente');
    },
    onError: (error) => {
      console.error('Error changing plan:', error);
      toast.error('Error al cambiar el plan');
    },
    onSettled: () => {
      setChangingPlan(null);
    },
  });

  const handlePlanChange = (plan: SubscriptionPlan) => {
    if (plan === subscription?.subscription?.plan) return;
    
    if (confirm(`¿Estás seguro de cambiar al plan ${SUBSCRIPTION_PLANS[plan].name}?`)) {
      setChangingPlan(plan);
      changePlanMutation.mutate(plan);
    }
  };

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500">No tienes una empresa asociada</p>
      </div>
    );
  }

  const isLoading = subLoading || usageLoading;
  const currentPlan = subscription?.subscription?.plan || 'basic';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturación y Plan</h1>
        <p className="text-gray-500">Gestiona tu suscripción y método de pago</p>
      </div>

      {/* Current Plan Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Plan Actual</h2>
            <p className="text-gray-500">
              {SUBSCRIPTION_PLANS[currentPlan].name} - {SUBSCRIPTION_PLANS[currentPlan].description}
            </p>
          </div>
          <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
            {formatCurrency(SUBSCRIPTION_PLANS[currentPlan].price_monthly)}/mes
          </span>
        </div>

        {/* Usage */}
        {usage && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Uso Actual</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <UsageBar
                label="Productos"
                current={usage.products.current}
                limit={usage.products.limit}
              />
              <UsageBar
                label="Usuarios"
                current={usage.users.current}
                limit={usage.users.limit}
              />
              <UsageBar
                label="Pedidos este mes"
                current={usage.ordersThisMonth.current}
                limit={usage.ordersThisMonth.limit}
              />
              <UsageBar
                label="Almacenamiento"
                current={usage.storage.current}
                limit={usage.storage.limit}
                unit=" GB"
              />
            </div>
          </div>
        )}

        {/* Billing Period */}
        {subscription?.subscription && (
          <div className="mt-6 pt-6 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                Próxima facturación:{' '}
                {new Date(subscription.subscription.current_period_end).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            {subscription.subscription.cancel_at_period_end && (
              <span className="text-sm text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Se cancelará al final del período
              </span>
            )}
          </div>
        )}
      </motion.div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Planes Disponibles</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {(Object.entries(SUBSCRIPTION_PLANS) as [SubscriptionPlan, (typeof SUBSCRIPTION_PLANS)[SubscriptionPlan]][]).map(
            ([planId, plan]) => (
              <PlanCard
                key={planId}
                plan={plan}
                currentPlan={currentPlan}
                onSelect={() => handlePlanChange(planId)}
                isLoading={changingPlan === planId}
              />
            )
          )}
        </div>
      </div>

      {/* Payment Method */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Método de Pago</h2>
          <button className="text-sm text-rose-600 hover:underline">
            Actualizar
          </button>
        </div>
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
            <p className="text-sm text-gray-500">Vence 12/25</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Los pagos son procesados de forma segura por Stripe
        </p>
      </motion.div>

      {/* Invoice History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">Historial de Facturas</h2>
        <div className="space-y-3">
          {[
            { date: '1 Feb 2024', amount: 79, status: 'Pagada' },
            { date: '1 Ene 2024', amount: 79, status: 'Pagada' },
            { date: '1 Dic 2023', amount: 29, status: 'Pagada' },
          ].map((invoice, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{invoice.date}</p>
                  <p className="text-sm text-gray-500">{invoice.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoice.amount)}
                </span>
                <button className="text-rose-600 hover:underline text-sm">
                  Descargar
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Cancel Subscription */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-red-50 rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold text-red-900 mb-2">Cancelar Suscripción</h2>
        <p className="text-sm text-red-700 mb-4">
          Si cancelas tu suscripción, perderás acceso a las funciones premium al final
          del período de facturación actual.
        </p>
        <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium">
          Cancelar suscripción
        </button>
      </motion.div>
    </div>
  );
}
