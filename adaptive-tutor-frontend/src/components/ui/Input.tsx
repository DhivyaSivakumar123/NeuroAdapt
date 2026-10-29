import React, { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all',
              error && 'border-rose-400 focus:ring-rose-400 focus:border-rose-400',
              className
            )
          )}
          {...props}
        />
        {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
