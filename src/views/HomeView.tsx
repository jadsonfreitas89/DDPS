import React, { useState } from 'react';
import { Plus, Users, User, Calendar, ShieldCheck, CheckCircle2, RefreshCw, FileDown } from 'lucide-react';
import { DDPSStatus, DDS } from '../types';
import { Button } from '../components/Button';
import { DDSWeekCard } from '../components/DDSWeekCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { gerarPDFSemanalDDPS } from '../utils/pdfGenerator';

interface HomeViewProps {
  status: DDPSStatus | null;
  ddsSemana: DDS[];
  onNovoDDS: () => void;
  onViewDDS: (dds: DDS) => void;
  onNovaSemana: () => void;
  onSync: () => void;
  isSyncing: boolean;
}

const DIAS_DA_SEMANA = [
  { nome: 'Domingo', diaCurto: 'Domingo', numero: 0 },
  { nome: 'Segunda-feira', diaCurto: 'Segunda', numero: 1 },
  { nome: 'Terça-feira', diaCurto: 'Terça', numero: 2 },
  { nome: 'Quarta-feira', diaCurto: 'Quarta', numero: 3 },
  { nome: 'Quinta-feira', diaCurto: 'Quinta', numero: 4 },
  { nome: 'Sexta-feira', diaCurto: 'Sexta', numero: 5 },
  { nome: 'Sábado', diaCurto: 'Sábado', numero: 6 }
];

function normalizarTexto(val?: string | number): string {
  if (val === undefined || val === null) return '';
  return String(val)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/-feira/g, '')
    .replace(/\s+/g, '');
}

function isStatusConcluido(status?: string): boolean {
  if (!status) return false;
  const s = normalizarTexto(status);
  return s === 'realizado' || s === 'finalizado' || s === 'concluido';
}

export const HomeView: React.FC<HomeViewProps> = ({
  status,
  ddsSemana,
  onNovoDDS,
  onViewDDS,
  onNovaSemana,
  onSync,
  isSyncing
}) => {
  const [showNovaSemanaModal, setShowNovaSemanaModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleGerarPDF = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await gerarPDFSemanalDDPS(status, ddsSemana);
    } catch (err) {
      console.error('Erro ao gerar PDF semanal:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Mapeia DDS para cada dia da semana
  const diasComDDS = DIAS_DA_SEMANA.map((dia) => {
    const ddsEncontrado = ddsSemana.find((d) => {
      // 1. Se diaSemanaNumero existir e for válido, utiliza-o como primeira opção
      if (d.diaSemanaNumero !== undefined && d.diaSemanaNumero !== null && !isNaN(Number(d.diaSemanaNumero))) {
        const num = Number(d.diaSemanaNumero);
        if (num === dia.numero || (dia.numero === 0 && num === 7)) {
          return true;
        }
      }

      // 2. Se não existir ou não corresponder, utiliza o campo diaSemana normalizado
      if (d.diaSemana) {
        const ddsDiaLimpo = normalizarTexto(d.diaSemana);
        const alvoDiaLimpo = normalizarTexto(dia.diaCurto);
        if (ddsDiaLimpo && alvoDiaLimpo && (ddsDiaLimpo.includes(alvoDiaLimpo) || alvoDiaLimpo.includes(ddsDiaLimpo))) {
          return true;
        }
      }

      // 3. Fallback por data ISO se aplicável
      if (d.data) {
        try {
          const dt = new Date(d.data);
          if (!isNaN(dt.getTime())) {
            const dayNum = dt.getUTCDay();
            if (dayNum === dia.numero) {
              return true;
            }
          }
        } catch {
          // Ignora erro de parse de data
        }
      }

      return false;
    });

    const isToday = status?.diaSemanaNumero !== undefined
      ? Number(status.diaSemanaNumero) === dia.numero || (dia.numero === 0 && Number(status.diaSemanaNumero) === 7)
      : status?.diaSemana
        ? normalizarTexto(status.diaSemana).includes(normalizarTexto(dia.diaCurto))
        : false;

    return {
      ...dia,
      dds: ddsEncontrado,
      isToday
    };
  });

  // Verifica status do dia de hoje
  const ddsHoje = diasComDDS.find((d) => d.isToday)?.dds;
  const hojeConcluido = Boolean(ddsHoje && isStatusConcluido(ddsHoje.status));

  const ddsRealizadosTotal = ddsSemana.filter(
    (d) => isStatusConcluido(d.status)
  ).length;

  const responsavelNome = status?.responsavelPadrao || 'Engenharia / SESMT';
  const responsavelIniciais = responsavelNome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="w-full flex flex-col gap-6 pb-8 animate-fadeIn">
      {/* Grid Principal: Coluna Esquerda (Status/Ações) + Coluna Direita (Programação da Semana) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda (4 colunas em telas grandes) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          {/* Card: Status de Hoje */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 flex flex-col justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Status de Hoje
              </span>
              {hojeConcluido ? (
                <div>
                  <h2 className="text-3xl font-bold mt-1 text-green-600 flex items-center gap-2">
                    Concluído
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    DDS de hoje realizado com sucesso e presenças coletadas.
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-3xl font-bold mt-1 text-red-600">
                    Pendente
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Nenhum DDS registrado para esta obra até o momento.
                  </p>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={onNovoDDS}
              leftIcon={<Plus className="w-6 h-6 stroke-[3]" />}
              className="py-4 text-base sm:text-lg uppercase tracking-wider"
            >
              + NOVO DDS
            </Button>
          </div>

          {/* Card: Resumo da Equipe */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Resumo da Equipe
            </h3>

            <div className="flex flex-col gap-3.5">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="min-w-0 pr-2">
                  <p className="text-xs text-gray-500 font-medium">Responsável</p>
                  <p className="font-bold text-[#1A1C1E] text-sm sm:text-base truncate">
                    {responsavelNome}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700 shrink-0 text-sm">
                  {responsavelIniciais || 'ES'}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 font-medium">DDS na Semana</p>
                  <p className="font-bold text-2xl text-[#1A1C1E]">
                    {ddsRealizadosTotal} <span className="text-xs font-semibold text-gray-400">/ 7 dias</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 mt-1 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  disabled={isGeneratingPdf}
                  onClick={handleGerarPDF}
                  leftIcon={<FileDown className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce text-yellow-600' : 'text-yellow-600'}`} />}
                  className="py-2.5 text-xs font-bold uppercase tracking-wider border-gray-300 hover:border-yellow-500 hover:bg-yellow-50/50"
                >
                  {isGeneratingPdf ? 'GERANDO PDF...' : 'FOLHA SEMANAL (PDF)'}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowNovaSemanaModal(true)}
                  className="w-full py-2.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-wider"
                >
                  NOVA SEMANA
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Coluna Direita: Programação da Semana (8 colunas) */}
        <section className="lg:col-span-8 bg-white rounded-3xl shadow-xs border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-wrap gap-3 justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-[#1A1C1E]">
                Programação da Semana
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Acompanhamento diário dos diálogos de segurança
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={isSyncing}
                onClick={onSync}
                leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-yellow-600' : 'text-gray-600'}`} />}
                className="py-2 min-h-[38px] px-3.5 text-xs font-bold uppercase tracking-wider shadow-2xs"
              >
                {isSyncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR'}
              </Button>
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider border border-gray-200/60 shrink-0">
                Semana {status?.semana || '--'}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6 flex flex-col gap-3">
            {diasComDDS.map((item) => (
              <DDSWeekCard
                key={item.nome}
                diaNome={item.nome}
                diaNumero={item.numero}
                dds={item.dds}
                isToday={item.isToday}
                onViewDDS={onViewDDS}
                onNovoDDSDesteDia={onNovoDDS}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Rodapé: Legenda Visual de Status */}
      <footer className="p-4 bg-white rounded-2xl border border-gray-200 flex justify-center shadow-2xs">
        <div className="flex items-center gap-6 sm:gap-8 text-xs text-gray-500 uppercase font-bold tracking-wider flex-wrap justify-center">
          <span className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
            Concluído
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>
            Em Aberto
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
            Planejado
          </span>
        </div>
      </footer>

      {/* Modal Nova Semana */}
      <ConfirmationModal
        isOpen={showNovaSemanaModal}
        title="Iniciar Nova Semana"
        description="Esta ação prepara a visualização para o ciclo da próxima semana no painel de campo. A geração automática do PDF consolidado da semana anterior será ativada na próxima etapa do backend."
        confirmLabel="Confirmar Nova Semana"
        cancelLabel="Fechar"
        onConfirm={() => {
          setShowNovaSemanaModal(false);
          onNovaSemana();
        }}
        onCancel={() => setShowNovaSemanaModal(false)}
      />
    </div>
  );
};
