import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered' | 'accent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'lg',
  className = '',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-7'
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm text-[#1A1C1E]',
    elevated: 'bg-white border border-gray-200 shadow-md text-[#1A1C1E]',
    bordered: 'bg-gray-50 border-2 border-gray-200 shadow-sm text-[#1A1C1E]',
    accent: 'bg-white border-2 border-yellow-400 shadow-md text-[#1A1C1E]'
  };

  return (
    <div
      className={`rounded-3xl transition-all ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
