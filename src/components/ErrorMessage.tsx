import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Atenção',
  message,
  onRetry
}) => {
  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-red-50 border border-red-200 p-4 sm:p-5 flex flex-col gap-3 text-red-950 shadow-2xs">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0">
          <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h4 className="text-base font-bold text-red-900">
            {title}
          </h4>
          <p className="text-sm text-red-800 mt-0.5">{message}</p>
        </div>
      </div>

      {onRetry && (
        <div className="flex justify-end pt-1">
          <Button
            variant="outline"
            size="md"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="text-xs sm:text-sm bg-white border-red-300 text-red-700 hover:bg-red-50"
          >
            Tentar Novamente
          </Button>
        </div>
      )}
    </div>
  );
};
