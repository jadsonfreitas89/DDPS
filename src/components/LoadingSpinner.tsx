import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
  fullscreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Carregando dados...',
  submessage,
  fullscreen = false
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
      <div className="relative flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin stroke-[2.5]" />
      </div>
      <p className="text-lg font-bold text-[#1A1C1E] tracking-tight">{message}</p>
      {submessage && (
        <p className="text-sm text-gray-500 max-w-sm">{submessage}</p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
