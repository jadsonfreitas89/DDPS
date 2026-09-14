import React, { useState } from 'react';
import { DDS, Participante } from '../types';
import { Button } from '../components/Button';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { SignaturePad } from '../components/SignaturePad';
import { formatarDataHora } from '../utils/dateFormatter';
import {
  FileCheck,
  Edit,
  Save,
  Users,
  MapPin,
  User,
  Clock,
  FileText
} from 'lucide-react';

interface ConferenceViewProps {
  dds: DDS;
  participantes: Participante[];
  onEdit: () => void;
  onSaveDDS: () => Promise<void>;
  onSignEncarregado: (assinatura: string) => Promise<void> | void;
  isLoading?: boolean;
}

export const ConferenceView: React.FC<ConferenceViewProps> = ({
  dds,
  participantes,
  onEdit,
  onSaveDDS,
  onSignEncarregado,
  isLoading = false
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // Filtra participantes ativos (assinado ou ausente registrado)
  const participantesAtivos = participantes.filter(
    (p) => p.ausente ? Boolean(p.motivoAusencia && p.motivoAusencia.trim().length > 0) : Boolean(p.assinatura && p.assinatura.length > 50)
  );

  const participantesAssinados = participantesAtivos.filter((p) => !p.ausente);
  const participantesAusentes = participantesAtivos.filter((p) => p.ausente);

  // Contagem por emociograma (apenas dos presentes)
  const contagemBom = participantesAssinados.filter((p) => p.emociograma === 'BOM').length;
  const contagemRegular = participantesAssinados.filter((p) => p.emociograma === 'REGULAR').length;
  const contagemRuim = participantesAssinados.filter((p) => p.emociograma === 'RUIM').length;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 pb-14 animate-fadeIn">
      {/* Cabeçalho da Conferência */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-yellow-100 text-yellow-800 flex items-center justify-center shrink-0">
            <FileCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-800">
              Etapa de Validação Final
            </span>
            <h1 className="text-2xl font-bold text-[#1A1C1E] tracking-tight">
              Conferência do DDS
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-500" />
            {formatarDataHora(dds.data, dds.horario)}
          </span>
        </div>
      </div>

      {/* BLOCO 1: DADOS DO DDS */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs flex flex-col gap-4">
        <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-gray-500 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-yellow-600" />
            Dados do DDS
          </span>
          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
            {dds.diaSemana}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tema</span>
            <p className="text-xl sm:text-2xl font-bold text-[#1A1C1E] mt-0.5">
              {dds.tema}
            </p>
          </div>

          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Conteúdo Programático</span>
            <div className="mt-1.5 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line">
              {dds.conteudo}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-600 shrink-0" />
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Local</span>
                <p className="text-sm font-bold text-[#1A1C1E] truncate">{dds.local}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600 shrink-0" />
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Responsável</span>
                <p className="text-sm font-bold text-[#1A1C1E] truncate">{dds.responsavel}</p>
              </div>
            </div>
          </div>

          {dds.observacoes && (
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-xs text-gray-400 font-bold uppercase">Observações:</span>
              <p className="text-xs sm:text-sm text-gray-700 mt-0.5">{dds.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {/* BLOCO EXTRA: ASSINATURA DO ENCARREGADO RESPONSÁVEL */}
      {dds.assinaturaEncarregado ? (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs flex flex-col gap-4" id="bloco-assinatura-encarregado">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-gray-500 flex items-center gap-1.5">
              ✍️ Assinatura do Encarregado Responsável
            </span>
            <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
              Assinado
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center font-bold">
                E
              </div>
              <div>
                <p className="text-sm font-bold text-[#1A1C1E]">{dds.encarregadoNome || 'Encarregado'}</p>
                <p className="text-xs text-gray-500">Encarregado Responsável pelo DDS</p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
              <div className="w-48 h-16 bg-white rounded-xl border border-gray-300 flex items-center justify-center p-1.5 overflow-hidden shadow-2xs">
                <img
                  src={dds.assinaturaEncarregado}
                  alt="Assinatura do Encarregado"
                  className="max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await onSignEncarregado('');
                }}
                className="text-red-600 border-red-200 hover:bg-red-50 bg-white"
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>
      ) : isSigning ? (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs flex flex-col gap-4" id="bloco-assinatura-encarregado-pad">
          <div className="border-b border-gray-100 pb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-gray-500">
              ✍️ Recolhendo Assinatura do Encarregado
            </span>
          </div>
          <SignaturePad
            funcionarioNome={dds.encarregadoNome || 'Encarregado'}
            onConfirm={async (base64) => {
              await onSignEncarregado(base64);
              setIsSigning(false);
            }}
            onCancel={() => setIsSigning(false)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs flex flex-col gap-4 text-center items-center justify-center py-8" id="bloco-assinatura-encarregado-vazio">
          <span className="text-3xl">✍️</span>
          <h3 className="text-base font-bold text-[#1A1C1E] mt-2">
            Assinatura do Encarregado Responsável Pendente
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            O encarregado <strong className="text-gray-800">{dds.encarregadoNome || 'selecionado'}</strong> precisa assinar o DDS para validar as orientações prestadas.
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setIsSigning(true)}
            className="mt-4 font-bold"
          >
            Assinar como Encarregado
          </Button>
        </div>
      )}

      {/* BLOCO 2: PARTICIPANTES & EMOCIOGRAMA */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs flex flex-col gap-5">
        <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-600" />
            <span className="text-base font-bold text-[#1A1C1E]">
              Participantes Confirmados
            </span>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-50 text-green-800 border border-green-200">
            {participantesAssinados.length} presentes • {participantesAusentes.length} ausentes ({participantesAtivos.length} total)
          </span>
        </div>

        {/* Resumo do Emociograma em cards métricos */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50/70 border border-green-200 rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center">
            <span className="text-2xl sm:text-3xl">🙂</span>
            <span className="text-xs font-bold uppercase tracking-wider text-green-900 mt-1">
              Bom
            </span>
            <span className="text-xl sm:text-2xl font-black text-green-950 mt-0.5">
              {contagemBom}
            </span>
          </div>

          <div className="bg-yellow-50/70 border border-yellow-200 rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center">
            <span className="text-2xl sm:text-3xl">😐</span>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-900 mt-1">
              Regular
            </span>
            <span className="text-xl sm:text-2xl font-black text-yellow-950 mt-0.5">
              {contagemRegular}
            </span>
          </div>

          <div className="bg-red-50/70 border border-red-200 rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center">
            <span className="text-2xl sm:text-3xl">🙁</span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-900 mt-1">
              Ruim
            </span>
            <span className="text-xl sm:text-2xl font-black text-red-950 mt-0.5">
              {contagemRuim}
            </span>
          </div>
        </div>

        {/* Lista detalhada dos participantes */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Relação de Participantes e Assinaturas
          </span>

          <div className="max-h-72 overflow-y-auto pr-1 flex flex-col gap-2">
            {participantesAtivos.map((p, idx) => (
              <div
                key={p.idFuncionario || idx}
                className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border ${
                  p.ausente
                    ? 'bg-red-50/40 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    p.ausente ? 'bg-red-200 text-red-900' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#1A1C1E]">{p.nome}</p>
                    <p className="text-xs text-gray-500">{p.cargo || 'Participante'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {p.ausente ? (
                    <>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold border bg-red-100 border-red-200 text-red-900">
                        Ausente
                      </span>
                      <div className="w-24 h-8 bg-white rounded-lg border border-red-200 flex items-center justify-center p-0.5 text-xs font-extrabold text-red-700 shadow-2xs">
                        {p.motivoAusencia || 'Atestado'}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Badge de emociograma */}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 ${
                          p.emociograma === 'BOM'
                            ? 'bg-green-50 border-green-200 text-green-900'
                            : p.emociograma === 'REGULAR'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
                            : 'bg-red-50 border-red-200 text-red-900'
                        }`}
                      >
                        <span>
                          {p.emociograma === 'BOM'
                            ? '🙂 BOM'
                            : p.emociograma === 'REGULAR'
                            ? '😐 REGULAR'
                            : '🙁 RUIM'}
                        </span>
                      </span>

                      {/* Prévia da assinatura */}
                      <div className="w-20 h-8 bg-white rounded-lg border border-gray-300 flex items-center justify-center p-0.5 overflow-hidden shadow-2xs">
                        <img
                          src={p.assinatura}
                          alt="Assinatura"
                          className="max-h-full object-contain"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTÕES: EDITAR e SALVAR DDS */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onEdit}
          disabled={isLoading}
          leftIcon={<Edit className="w-5 h-5 text-gray-700" />}
          className="sm:w-1/3 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          EDITAR
        </Button>

        <Button
          type="button"
          variant="primary"
          size="xl"
          onClick={() => setShowConfirmModal(true)}
          disabled={isLoading || participantesAssinados.length === 0 || !dds.assinaturaEncarregado}
          leftIcon={<Save className="w-6 h-6 stroke-[2.5]" />}
          className="flex-1 uppercase font-extrabold tracking-wider text-base sm:text-lg"
        >
          {isLoading ? 'Finalizando...' : 'SALVAR DDS'}
        </Button>
      </div>

      {(!dds.assinaturaEncarregado || participantesAssinados.length === 0) && (
        <p className="text-center text-xs text-red-500 font-semibold mt-1">
          {!dds.assinaturaEncarregado && participantesAssinados.length === 0
            ? 'Para salvar, o encarregado precisa assinar e deve haver pelo menos 1 participante assinado.'
            : !dds.assinaturaEncarregado
            ? 'Para salvar, o encarregado responsável precisa assinar o DDS no bloco acima.'
            : 'Para salvar, deve haver pelo menos 1 participante com assinatura coletada.'}
        </p>
      )}

      {/* Confirmação final */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Finalizar e Salvar DDS?"
        description={`Você está prestes a finalizar este DDS com ${participantesAssinados.length} participantes assinados. Esta ação executará a finalização oficial no Google Apps Script.`}
        confirmLabel="Confirmar e Salvar DDS"
        cancelLabel="Revisar"
        variant="primary"
        isLoading={isLoading}
        onConfirm={async () => {
          setShowConfirmModal(false);
          await onSaveDDS();
        }}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};
