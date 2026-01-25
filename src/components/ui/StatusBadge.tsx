import { cn } from '@/lib/utils';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/utils/constants';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  locale?: 'es' | 'en';
}

export function StatusBadge({ 
  status, 
  variant = 'default',
  size = 'md',
  locale = 'es'
}: StatusBadgeProps) {
  const colors = ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  const label = ORDER_STATUS_LABELS[status]?.[locale] || status;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variant === 'outline' 
          ? `border-2 ${colors.replace('bg-', 'border-').replace('text-', 'text-')} bg-transparent`
          : colors,
        sizeClasses[size]
      )}
    >
      {label}
    </span>
  );
}
