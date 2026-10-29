import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, glass = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl p-6 shadow-sm border border-slate-200 bg-white transition-all',
          glass && 'glass-panel border-white/60 shadow-md',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
