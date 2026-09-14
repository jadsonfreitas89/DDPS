import React, { useState } from 'react';
import { Calendar, ArrowLeft, FileDown, Eye, CheckCircle2, Clock, MapPin, User, ChevronRight, HardHat, FileText } from 'lucide-react';
import { DDPSStatus, DDS } from '../types';
import { Button } from '../components/Button';
import { agruparSemanas, SemanaGroup } from '../utils/weekUtils';
import { gerarPDFSemanalDDPS } from '../utils/pdfGenerator';
import { formatarDataHora } from '../utils/dateFormatter';

interface ConsultarSemanasViewProps {
  status: DDPSStatus | null;
  allDDS: DDS[];
  onSelectDDS: (dds: DDS) => void;
  onBack: () => void;
}

export const ConsultarSemanasView: React.FC<ConsultarSemanasViewProps> = ({
  status,
  allDDS,
  onSelectDDS,
  onBack
}) => {
  const [generatingPdfForSemanaId, setGeneratingPdfForSemanaId] = useState<string | null>(null);
  const [selectedSemana, setSelectedSemana] = useState<SemanaGroup | null>(null);

  const semanas = agruparSemanas(allDDS);

  const handleGerarPDFSemana = async (semana: SemanaGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    if (generatingPdfForSemanaId) return;

    setGeneratingPdfForSemanaId(semana.semanaId);
    try {
      // Monta status temporário adaptado à semana selecionada sem alterar a semana operacional do app
      const statusContexto: DDPSStatus = {
        semana: semana.semanaNum,
        data: semana.dataInicioStr,
        horario: status?.horario || '08:00',
        dataHora: `${semana.dataInicioStr} 08:00`,
        diaSemana: 'DOMINGO',
        diaSemanaNumero: 0,
        timestamp: Date.now(),
        responsavelPadrao: status?.responsavelPadrao || 'Engenharia / SESMT'
      };

      await gerarPDFSemanalDDPS(statusContexto, semana.ddsList);
    } catch (err) {
      console.error('Erro ao gerar PDF da semana selecionada:', err);
    } finally {
      setGeneratingPdfForSemanaId(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2.5 rounded-2xl hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1A1C1E]">Consultar Semanas</h2>
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200">
                Histórico
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Histórico permanente de diálogos diários de segurança por ciclo semanal
            </p>
          </div>
        </div>
      </div>

      {/* Visualização Detalhada da Semana Selecionada ou Lista de Semanas */}
      {selectedSemana ? (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs flex flex-wrap justify-between items-center gap-4">
            <div>
              <button
                type="button"
                onClick={() => setSelectedSemana(null)}
                className="text-xs font-bold text-yellow-600 hover:text-yellow-700 uppercase tracking-wider flex items-center gap-1 mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar para lista de semanas
              </button>
              <h3 className="text-xl font-bold text-[#1A1C1E] flex items-center gap-2">
                Semana {selectedSemana.semanaNum} ({selectedSemana.ano})
                {selectedSemana.isCurrentWeek && (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800 rounded-full border border-green-200">
                    Semana Atual
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                Período: <span className="text-gray-900 font-bold">{selectedSemana.intervaloTexto}</span> • {selectedSemana.ddsList.length} registro(s) encontrado(s)
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={generatingPdfForSemanaId === selectedSemana.semanaId}
              onClick={(e) => handleGerarPDFSemana(selectedSemana, e)}
              leftIcon={<FileDown className={`w-4 h-4 ${generatingPdfForSemanaId === selectedSemana.semanaId ? 'animate-bounce' : ''}`} />}
              className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider"
            >
              {generatingPdfForSemanaId === selectedSemana.semanaId ? 'GERANDO PDF...' : 'BAIXAR PDF DA SEMANA'}
            </Button>
          </div>

          {/* Lista de DDS da Semana Selecionada */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs flex flex-col gap-4">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-3">
              Registros da Semana ({selectedSemana.intervaloTexto})
            </h4>

            {selectedSemana.ddsList.length === 0 ? (
              <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-gray-300" />
                <p className="text-sm font-medium">Nenhum DDPS registrado nesta semana.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSemana.ddsList.map((item) => (
                  <div
                    key={item.idDDS || item.data}
                    onClick={() => onSelectDDS(item)}
                    className="p-5 rounded-2xl border border-gray-200 hover:border-yellow-500 hover:shadow-md transition-all cursor-pointer bg-gray-50/50 hover:bg-white flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-extrabold text-yellow-700 uppercase tracking-wider bg-yellow-100/80 px-2.5 py-1 rounded-lg border border-yellow-200">
                          {item.diaSemana || 'DDS'}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          {formatarDataHora(item.data, item.horario)}
                        </span>
                      </div>
                      <h5 className="text-base font-bold text-[#1A1C1E] line-clamp-2">
                        {item.tema || 'DDS sem tema especificado'}
                      </h5>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{item.local || 'Local N/I'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{item.responsavel || 'Resp. N/I'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-gray-500 font-semibold">
                        {item.participantesQtd || item.participantes?.length || 0} participante(s)
                      </span>
                      <span className="text-xs font-bold text-yellow-600 flex items-center gap-1">
                        Ver Detalhes <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Lista de Todas as Semanas */
        <div className="grid grid-cols-1 gap-4">
          {semanas.map((sem) => (
            <div
              key={sem.semanaId}
              className={`p-6 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-2xs ${
                sem.isCurrentWeek
                  ? 'bg-gradient-to-r from-yellow-50/70 to-white border-yellow-400/80 ring-2 ring-yellow-400/20'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shrink-0 ${
                  sem.isCurrentWeek
                    ? 'bg-yellow-400 text-black shadow-xs'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#1A1C1E]">
                      Semana {sem.semanaNum} ({sem.ano})
                    </h3>
                    {sem.isCurrentWeek && (
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-yellow-400 text-black rounded-full shadow-2xs">
                        Semana Atual
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mt-0.5">
                    {sem.intervaloTexto}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-3">
                    <span>• {sem.ddsList.length} DDPS registrado(s)</span>
                  </p>
                </div>
              </div>

              {/* Botões de Ação por Semana */}
              <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setSelectedSemana(sem)}
                  leftIcon={<Eye className="w-4 h-4 text-gray-600" />}
                  className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-gray-300 hover:bg-gray-50"
                >
                  CONSULTAR
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  disabled={generatingPdfForSemanaId === sem.semanaId}
                  onClick={(e) => handleGerarPDFSemana(sem, e)}
                  leftIcon={<FileDown className={`w-4 h-4 ${generatingPdfForSemanaId === sem.semanaId ? 'animate-bounce text-yellow-600' : 'text-yellow-600'}`} />}
                  className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider shadow-2xs"
                >
                  {generatingPdfForSemanaId === sem.semanaId ? 'GERANDO...' : 'GERAR PDF'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
