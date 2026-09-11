import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none shadow-sm cursor-pointer';

  const sizeClasses = {
    md: 'min-h-[44px] px-4 py-2.5 text-sm sm:text-base rounded-xl gap-2',
    lg: 'min-h-[52px] px-6 py-3.5 text-base sm:text-lg rounded-2xl gap-2.5',
    xl: 'min-h-[58px] px-7 py-4 text-lg sm:text-xl rounded-2xl gap-3 shadow-sm'
  };

  const variantClasses = {
    primary:
      'bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold border border-yellow-500/40 active:bg-yellow-600 shadow-sm',
    secondary:
      'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 active:bg-gray-100 shadow-sm',
    outline:
      'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300 active:bg-gray-200',
    danger:
      'bg-red-600 hover:bg-red-500 text-white font-bold border border-red-500 active:bg-red-700 shadow-sm',
    success:
      'bg-green-600 hover:bg-green-500 text-white font-bold border border-green-600 active:bg-green-700 shadow-sm'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
      <span className="truncate">{children}</span>
      {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
    </button>
  );
};
