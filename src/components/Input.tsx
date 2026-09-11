import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  isReadOnly?: boolean;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  isReadOnly = false,
  leftIcon,
  className = '',
  id,
  required,
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 select-none"
      >
        <span>{label}</span>
        {required && <span className="text-red-500 font-bold">*</span>}
        {isReadOnly && (
          <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200">
            Automático
          </span>
        )}
      </label>

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-4 pointer-events-none text-gray-400 flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          readOnly={isReadOnly}
          className={`w-full min-h-[50px] rounded-2xl px-4 py-3 text-base font-semibold transition-all outline-none
            ${leftIcon ? 'pl-11' : ''}
            ${
              isReadOnly
                ? 'bg-gray-100 text-gray-600 border border-gray-200 cursor-not-allowed select-text'
                : 'bg-gray-50 hover:bg-gray-100/60 border border-gray-300 text-[#1A1C1E] focus:bg-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400/20 shadow-xs'
            }
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-400/20' : ''}
            ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs font-semibold text-red-600 mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};
