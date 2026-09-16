import React, { useState, useEffect } from 'react';
import { Funcionario, Emociograma, Participante } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { EmociogramaSelector } from './EmociogramaSelector';
import { User, CheckCircle2, PenLine, RotateCcw, UserX, AlertCircle } from 'lucide-react';
import { sanitizeMotivoAusencia } from '../utils/absenceUtils';

const MOTIVOS_PADRAO = ['Atestado', 'ASO', 'Falta', 'Férias', 'Folga', 'Outros'];

interface EmployeeCardProps {
  funcionario: Funcionario;
  participanteData?: Participante;
  onEmociogramaChange: (emociograma: Emociograma) => void;
  onOpenSignature: () => void;
  onAbsenceChange: (ausente: boolean, motivoAusencia?: string) => void;
  isCurrent?: boolean;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  funcionario,
  participanteData,
  onEmociogramaChange,
  onOpenSignature,
  onAbsenceChange,
  isCurrent = true
}) => {
  const isAusente = Boolean(participanteData?.ausente);
  const motivoAtual = sanitizeMotivoAusencia(participanteData?.motivoAusencia || '');
  const isSigned = !isAusente && Boolean(participanteData?.assinatura);
  const currentEmociograma = participanteData?.emociograma;

  // Estado local para a opção selecionada ('Atestado', 'ASO', 'Falta', 'Férias', 'Folga', 'Outros')
  const [selectedMotivoOption, setSelectedMotivoOption] = useState<string>(() => {
    const isCustom = isAusente && motivoAtual && !['Atestado', 'ASO', 'Falta', 'Férias', 'Folga'].includes(motivoAtual);
    return isCustom ? 'Outros' : (motivoAtual || 'Atestado');
  });

  // Estado local para o texto personalizado de "Outros"
  const [customTextValue, setCustomTextValue] = useState<string>(() => {
    const isCustom = isAusente && motivoAtual && !['Atestado', 'ASO', 'Falta', 'Férias', 'Folga'].includes(motivoAtual);
    return isCustom ? (motivoAtual === 'Outros' ? '' : motivoAtual) : '';
  });

  // Recarrega os estados locais apenas quando muda o colaborador ativo
  useEffect(() => {
    const isCustom = isAusente && motivoAtual && !['Atestado', 'ASO', 'Falta', 'Férias', 'Folga'].includes(motivoAtual);
    setSelectedMotivoOption(isCustom ? 'Outros' : (motivoAtual || 'Atestado'));
    setCustomTextValue(isCustom ? (motivoAtual === 'Outros' ? '' : motivoAtual) : '');
  }, [funcionario.idFuncionario]);

  // Iniciais do trabalhador
  const initials = funcionario.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleToggleAusente = (checked: boolean) => {
    if (checked) {
      const txt = selectedMotivoOption === 'Outros' ? customTextValue : selectedMotivoOption;
      const cleanMotivo = sanitizeMotivoAusencia(txt) || 'Atestado';
      onAbsenceChange(true, cleanMotivo);
    } else {
      onAbsenceChange(false, '');
    }
  };

  const handleSelectMotivo = (motivo: string) => {
    setSelectedMotivoOption(motivo);
    if (motivo === 'Outros') {
      setCustomTextValue('');
      onAbsenceChange(true, '');
    } else {
      onAbsenceChange(true, motivo);
    }
  };

  const handleCustomTextChange = (txt: string) => {
    setCustomTextValue(txt);
    const cleanMotivo = sanitizeMotivoAusencia(txt);
    onAbsenceChange(true, cleanMotivo);
  };

  return (
    <Card
      variant="default"
      padding="lg"
      className={`w-full max-w-xl mx-auto flex flex-col gap-5 transition-all shadow-sm ${
        isCurrent ? 'ring-2 ring-yellow-400/80' : ''
      } ${isAusente ? 'bg-red-50/20 border-red-200' : ''}`}
    >
      {/* Dados do Funcionário */}
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center font-black text-lg shrink-0 ${
            isAusente ? 'bg-red-100 border-red-200 text-red-800' : 'bg-gray-100 border-gray-200 text-gray-700'
          }`}>
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

        {/* Checkbox de Ausente & Badge de Status */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border transition-colors ${
            isAusente
              ? 'bg-red-100 border-red-300 text-red-900 font-bold shadow-2xs'
              : 'bg-gray-50 hover:bg-red-50 border-gray-200 text-gray-700 hover:text-red-800 font-semibold'
          }`}>
            <input
              type="checkbox"
              checked={isAusente}
              onChange={(e) => handleToggleAusente(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer accent-red-600"
            />
            <span className="text-xs">Ausente</span>
          </label>

          {isAusente ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 text-xs font-bold">
              <UserX className="w-3.5 h-3.5 text-red-600" />
              <span>Ausente</span>
            </div>
          ) : isSigned ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-800 border border-green-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Assinado</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200 text-xs font-bold">
              Pendente
            </div>
          )}
        </div>
      </div>

      {/* Se Ausente: Seleção do Motivo */}
      {isAusente ? (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-red-50/80 border border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Selecione o Motivo da Ausência:
            </span>
            <span className="text-[11px] font-semibold text-red-700">* Obrigatório</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MOTIVOS_PADRAO.map((motivo) => {
              const selected = selectedMotivoOption === motivo;
              return (
                <button
                  key={motivo}
                  type="button"
                  onClick={() => handleSelectMotivo(motivo)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    selected
                      ? 'bg-red-600 text-white border-red-700 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                  }`}
                >
                  {motivo}
                </button>
              );
            })}
          </div>

          {selectedMotivoOption === 'Outros' && (
            <div className="mt-1 flex flex-col gap-1">
              <label className="text-xs font-bold text-red-950">Especifique o motivo da ausência:</label>
              <input
                type="text"
                value={customTextValue}
                onChange={(e) => handleCustomTextChange(e.target.value)}
                placeholder="Digite o motivo da ausência..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 bg-white text-xs font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>
          )}
        </div>
      ) : (
        /* Emociograma (Somente quando Presente) */
        <EmociogramaSelector
          value={currentEmociograma}
          onChange={onEmociogramaChange}
        />
      )}

      {/* Área / Botão de Assinatura */}
      <div className="flex flex-col gap-3 pt-1">
        {isAusente ? (
          <div className="p-4 rounded-2xl bg-gray-100 border border-gray-200 text-center text-xs font-bold text-gray-600 flex items-center justify-center gap-2">
            <UserX className="w-4 h-4 text-gray-500" />
            <span>Assinatura e Emociograma desabilitados devido à ausência ({motivoAtual || 'Atestado'})</span>
          </div>
        ) : isSigned ? (
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

