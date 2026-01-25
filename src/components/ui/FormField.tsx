import { forwardRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
  name: string;
  type?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, helperText, icon, name, type = 'text', className, ...props }, ref) => {
    const { register, formState: { errors } } = useFormContext();
    const error = errors[name]?.message as string | undefined;
    
    const isTextarea = type === 'textarea';

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          {isTextarea ? (
            <textarea
              id={name}
              className={cn(
                'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none',
                error
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-rose-500 focus:border-rose-500',
                className
              )}
              {...register(name)}
              {...(props as any)}
              rows={4}
            />
          ) : (
            <input
              ref={ref}
              id={name}
              type={type}
              className={cn(
                'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors',
                icon ? 'pl-12' : 'pl-4',
                error
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-rose-500 focus:border-rose-500',
                className
              )}
              {...register(name)}
              {...props}
            />
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
