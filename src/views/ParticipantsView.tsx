import React, { useState } from 'react';
import { Funcionario, Participante, Emociograma, DDS } from '../types';
import { api } from '../services/api';
import { EmployeeCard } from '../components/EmployeeCard';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { SignaturePad } from '../components/SignaturePad';
import { Button } from '../components/Button';
import { CheckCheck, AlertCircle, ArrowLeft, Grid, ChevronDown, Check } from 'lucide-react';
import { sanitizeMotivoAusencia } from '../utils/absenceUtils';

interface ParticipantsViewProps {
  dds: DDS;
  funcionarios: Funcionario[];
  participantesMap: Record<string, Participante>;
  onUpdateParticipante: (idFuncionario: string, data: Partial<Participante>) => void;
  onFinishParticipants: () => Promise<void>;
  onBackToDDS: () => void;
  isLoading?: boolean;
}

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
  dds,
  funcionarios,
  participantesMap,
  onUpdateParticipante,
  onFinishParticipants,
  onBackToDDS,
  isLoading = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSigning, setIsSigning] = useState(false);
  const [isSavingSingle, setIsSavingSingle] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  const total = funcionarios.length;
  const currentFuncionario = funcionarios[currentIndex];

  if (total === 0 || !currentFuncionario) {
    return (
      <div className="w-full max-w-xl mx-auto p-8 text-center text-gray-700 bg-white rounded-3xl border border-gray-200">
        <p className="font-semibold text-red-600 mb-3">Não foi possível carregar os colaboradores. Verifique a conexão.</p>
        <Button variant="outline" size="md" onClick={onBackToDDS} className="mt-2">
          Voltar ao DDS
        </Button>
      </div>
    );
  }

  const currentFuncId = String(currentFuncionario.id);
  const currentParticipantData: Participante = participantesMap[currentFuncId] || {
    idFuncionario: currentFuncId,
    nome: currentFuncionario.nome,
    emociograma: 'BOM',
    assinatura: '',
    cargo: currentFuncionario.cargo
  };

  // Contagem de participantes concluídos (assinado ou ausente com motivo)
  const completedCount = (Object.values(participantesMap) as Participante[]).filter((p) => {
    if (p.ausente) {
      return Boolean(p.motivoAusencia && p.motivoAusencia.trim().length > 0);
    }
    return Boolean(p.assinatura && p.assinatura.length > 50);
  }).length;

  const signedCount = (Object.values(participantesMap) as Participante[]).filter(
    (p) => !p.ausente && Boolean(p.assinatura && p.assinatura.length > 50)
  ).length;

  const handleEmociogramaChange = (emociograma: Emociograma) => {
    onUpdateParticipante(currentFuncId, {
      idFuncionario: currentFuncId,
      nome: currentFuncionario.nome,
      emociograma,
      cargo: currentFuncionario.cargo,
      ausente: false,
      motivoAusencia: ''
    });
  };

  const handleAbsenceChange = (ausente: boolean, motivoAusencia?: string) => {
    if (ausente) {
      const cleanMotivo = sanitizeMotivoAusencia(motivoAusencia) || 'Atestado';
      onUpdateParticipante(currentFuncId, {
        idFuncionario: currentFuncId,
        nome: currentFuncionario.nome,
        cargo: currentFuncionario.cargo,
        ausente: true,
        motivoAusencia: cleanMotivo,
        assinatura: '',
        emociograma: 'BOM'
      });
    } else {
      onUpdateParticipante(currentFuncId, {
        idFuncionario: currentFuncId,
        nome: currentFuncionario.nome,
        cargo: currentFuncionario.cargo,
        ausente: false,
        motivoAusencia: ''
      });
    }
  };

  const handleConfirmSignature = (signatureBase64: string) => {
    if (isLoading) return;

    const participanteAtual: Participante = {
      idFuncionario: currentFuncId,
      nome: currentFuncionario.nome,
      emociograma: currentParticipantData.emociograma || 'BOM',
      assinatura: signatureBase64,
      cargo: currentFuncionario.cargo,
      horaAssinatura: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      ausente: false,
      motivoAusencia: ''
    };

    // Salva no estado do aplicativo em memória e local storage
    onUpdateParticipante(currentFuncId, participanteAtual);
    setIsSigning(false);
    setValidationAlert(null);

    // Conforme especificação: "Depois que o funcionário assinar, avançar para o próximo."
    if (currentIndex < total - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 150);
    }
  };

  const handleFinalize = async () => {
    if (completedCount === 0) {
      setValidationAlert('É necessário registrar ao menos 1 participante (assinado ou ausente) para finalizar.');
      return;
    }
    setValidationAlert(null);
    await onFinishParticipants();
  };

  const isLastParticipant = currentIndex === total - 1;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 pb-14 animate-fadeIn">
      {/* Barra de Topo com Dados do DDS */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onBackToDDS}
            leftIcon={<ArrowLeft className="w-4 h-4 text-gray-700" />}
            className="text-xs px-3 bg-gray-50 border-gray-200 text-gray-700"
          >
            DDS
          </Button>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-800">
              Coleta de Presença
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#1A1C1E] truncate max-w-[200px] sm:max-w-xs">
              {dds.tema}
            </h2>
          </div>
        </div>

        {/* Botão para abrir a lista completa de funcionários */}
        <button
          type="button"
          onClick={() => setShowRoster(!showRoster)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 transition-colors"
        >
          <Grid className="w-4 h-4 text-yellow-600" />
          <span>Lista ({completedCount}/{total})</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRoster ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Gaveta / Dropdown com a lista completa de trabalhadores */}
      {showRoster && (
        <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-lg flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 border-b border-gray-100 pb-2">
            <span>Selecione um funcionário para ir direto:</span>
            <span className="text-green-700">{signedCount} assinaram • {completedCount} concluídos de {total}</span>
          </div>
          <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
            {funcionarios.map((func, idx) => {
              const fId = String(func.id);
              const pData = participantesMap[fId];
              const isAus = Boolean(pData?.ausente);
              const isAssinado = !isAus && Boolean(pData?.assinatura);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={fId}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowRoster(false);
                  }}
                  className={`p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2 border transition-all ${
                    isCurrent
                      ? 'bg-yellow-50 border-yellow-400 text-yellow-950 font-bold'
                      : isAus
                      ? 'bg-red-50/70 border-red-200 text-red-950'
                      : isAssinado
                      ? 'bg-green-50/60 border-green-200 text-green-950'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="truncate">{func.nome}</span>
                  {isAus ? (
                    <span className="shrink-0 text-[10px] text-red-700 font-bold bg-red-100 px-1.5 py-0.5 rounded">
                      Ausente ({pData?.motivoAusencia || 'Atestado'})
                    </span>
                  ) : isAssinado ? (
                    <span className="shrink-0 flex items-center text-green-600 font-bold gap-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] text-gray-400 font-medium">Pendente</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Indicador de Progresso (Participante X de Y) */}
      <ProgressIndicator
        currentIndex={currentIndex}
        total={total}
        signedCount={completedCount}
        onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
        onNext={() => setCurrentIndex((prev) => Math.min(total - 1, prev + 1))}
        canPrev={currentIndex > 0}
        canNext={currentIndex < total - 1}
      />

      {/* Card Grande do Funcionário Atual */}
      <EmployeeCard
        funcionario={currentFuncionario}
        participanteData={currentParticipantData}
        onEmociogramaChange={handleEmociogramaChange}
        onOpenSignature={() => setIsSigning(true)}
        onAbsenceChange={handleAbsenceChange}
        isCurrent={true}
      />

      {validationAlert && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{validationAlert}</span>
        </div>
      )}

      {/* Ação de Finalização dos Participantes */}
      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="button"
          variant={completedCount >= 1 ? 'primary' : 'secondary'}
          size="xl"
          fullWidth
          disabled={isLoading || completedCount === 0}
          onClick={handleFinalize}
          leftIcon={<CheckCheck className="w-6 h-6 stroke-[2.5]" />}
          className="uppercase tracking-wider font-extrabold py-4"
        >
          {isLoading ? 'Salvando Participantes...' : 'FINALIZAR PARTICIPANTES'}
        </Button>

        <div className="flex items-center justify-between text-xs text-gray-500 px-2 font-medium">
          <span>{signedCount} assinaram • {completedCount} de {total} concluídos</span>
          {isLastParticipant ? (
            <span className="text-green-700 font-bold">Último participante da lista</span>
          ) : (
            <span>Você pode avançar ou finalizar a qualquer momento</span>
          )}
        </div>
      </div>

      {/* Modal / Quadro de Assinatura com o Dedo, Caneta ou Mouse */}
      {isSigning && (
        <SignaturePad
          funcionarioNome={currentFuncionario.nome}
          initialSignature={currentParticipantData.assinatura}
          onConfirm={handleConfirmSignature}
          onCancel={() => {
            if (!isSavingSingle) {
              setIsSigning(false);
            }
          }}
          isLoading={isSavingSingle}
        />
      )}
    </div>
  );
};
