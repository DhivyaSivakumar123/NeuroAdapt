import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-[#e6e6de] rounded-xl ${className}`}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string; lines?: number }> = ({
  className = '',
  lines = 3,
}) => {
  return (
    <div className={`p-6 rounded-2xl border border-[#deded6] bg-white space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
          />
        ))}
      </div>
    </div>
  );
};
