import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

export const Loader: React.FC<LoaderProps> = ({ 
  size = 'md',
  className,
  text
}) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className={cn(
        "animate-spin text-fitness-primary",
        sizeMap[size],
        className
      )} />
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
};