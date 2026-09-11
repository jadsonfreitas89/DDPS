import React from 'react';
import { Funcionario, Emociograma, Participante } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { EmociogramaSelector } from './EmociogramaSelector';
import { User, CheckCircle2, PenLine, RotateCcw } from 'lucide-react';

interface EmployeeCardProps {
  funcionario: Funcionario;
  participanteData?: Participante;
  onEmociogramaChange: (emociograma: Emociograma) => void;
  onOpenSignature: () => void;
  isCurrent?: boolean;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  funcionario,
  participanteData,
  onEmociogramaChange,
  onOpenSignature,
  isCurrent = true
}) => {
  const isSigned = Boolean(participanteData?.assinatura);
  const currentEmociograma = participanteData?.emociograma;

  // Iniciais do trabalhador
  const initials = funcionario.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card
      variant="default"
      padding="lg"
      className={`w-full max-w-xl mx-auto flex flex-col gap-5 transition-all shadow-sm ${
        isCurrent ? 'ring-2 ring-yellow-400/80' : ''
      }`}
    >
      {/* Dados do Funcionário */}
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-black text-lg shrink-0">
            {initials || <User className="w-6 h-6 text-gray-500" />}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-xl sm:text-2xl font-bold text-[#1A1C1E] tracking-tight leading-snug">
              {funcionario.nome}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs sm:text-sm font-semibold text-gray-500">
                {funcionario.cargo || 'Operador em Campo'}
              </span>
              {funcionario.setor && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-400 font-medium">{funcionario.setor}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status de assinatura */}
        {isSigned ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-800 border border-green-200 text-xs font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Assinado</span>
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200 text-xs font-bold shrink-0">
            Pendente
          </div>
        )}
      </div>

      {/* Emociograma */}
      <EmociogramaSelector
        value={currentEmociograma}
        onChange={onEmociogramaChange}
      />

      {/* Área / Botão de Assinatura */}
      <div className="flex flex-col gap-3 pt-1">
        {isSigned ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-28 h-12 bg-white rounded-xl border border-gray-300 flex items-center justify-center p-1 overflow-hidden shadow-2xs">
                <img
                  src={participanteData?.assinatura}
                  alt="Assinatura registrada"
                  className="max-h-full object-contain"
                />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-green-700">
                  Assinatura Confirmada
                </p>
                <p className="text-[11px] text-gray-500">Pronto para envio</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onOpenSignature}
              leftIcon={<RotateCcw className="w-4 h-4 text-gray-600" />}
              className="w-full sm:w-auto text-xs sm:text-sm bg-white hover:bg-gray-100 text-gray-700 border-gray-300"
            >
              Refazer Assinatura
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="xl"
            fullWidth
            onClick={onOpenSignature}
            leftIcon={<PenLine className="w-6 h-6 stroke-[2.5]" />}
            className="text-base sm:text-lg uppercase tracking-wider"
          >
            ASSINAR
          </Button>
        )}
      </div>
    </Card>
  );
};
