import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface ProgressIndicatorProps {
  currentIndex: number;
  total: number;
  signedCount: number;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentIndex,
  total,
  signedCount,
  onPrev,
  onNext,
  canPrev,
  canNext
}) => {
  const currentDisplay = total > 0 ? currentIndex + 1 : 0;
  const percentage = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;
  const signedPercentage = total > 0 ? Math.round((signedCount / total) * 100) : 0;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-2.5">
      {/* Controles de Navegação Superior */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onPrev}
          disabled={!canPrev}
          leftIcon={<ChevronLeft className="w-5 h-5 text-gray-700" />}
          className="min-h-[42px] px-3.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200"
        >
          Voltar
        </Button>

        <div className="flex flex-col items-center text-center">
          <span className="text-sm sm:text-base font-bold text-[#1A1C1E] tracking-tight">
            Participante {currentDisplay} de {total}
          </span>
          <span className="text-xs font-semibold text-green-700">
            {signedCount} de {total} assinaram ({signedPercentage}%)
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onNext}
          disabled={!canNext}
          rightIcon={<ChevronRight className="w-5 h-5 text-gray-700" />}
          className="min-h-[42px] px-3.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200"
        >
          Avançar
        </Button>
      </div>

      {/* Barra de Progresso Visual */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-yellow-400 transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
