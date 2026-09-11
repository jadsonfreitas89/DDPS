import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  required,
  rows = 4,
  ...props
}) => {
  const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      <label
        htmlFor={textareaId}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 select-none"
      >
        <span>{label}</span>
        {required && <span className="text-red-500 font-bold">*</span>}
      </label>

      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full rounded-2xl p-4 text-base font-semibold transition-all outline-none bg-gray-50 hover:bg-gray-100/60 border border-gray-300 text-[#1A1C1E] focus:bg-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400/20 resize-y min-h-[120px] shadow-xs
          ${error ? 'border-red-500 focus:border-red-500' : ''}
          ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-xs font-semibold text-red-600 mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};
