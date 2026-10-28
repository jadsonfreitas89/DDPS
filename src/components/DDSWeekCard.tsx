import React from 'react';
import { Check, Clock, Calendar, Users, ArrowRight, Eye, CloudUpload, RefreshCw, AlertTriangle } from 'lucide-react';
import { DDS } from '../types';
import { formatarDataHora } from '../utils/dateFormatter';

interface DDSWeekCardProps {
  diaNome: string;
  diaNumero: number;
  dds?: DDS;
  isToday?: boolean;
  onViewDDS?: (dds: DDS) => void;
  onNovoDDSDesteDia?: () => void;
}

export const DDSWeekCard: React.FC<DDSWeekCardProps> = ({
  diaNome,
  dds,
  isToday = false,
  onViewDDS,
  onNovoDDSDesteDia
}) => {
  const statusNormalizado = String(dds?.status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const isRealizado = Boolean(
    dds && (
      statusNormalizado === 'realizado' ||
      statusNormalizado === 'finalizado' ||
      statusNormalizado === 'concluido'
    )
  );

  const isPendingSync = Boolean(
    dds && (
      dds.syncStatus === 'pending' ||
      String(dds.idDDS || '').startsWith('DDS-OFFLINE-')
    )
  );

  const isSyncing = Boolean(dds && dds.syncStatus === 'syncing');
  const hasSyncError = Boolean(dds && dds.syncStatus === 'error');

  if (isRealizado && dds) {
    return (
      <div className={`flex items-start gap-3.5 sm:gap-4 p-4 sm:p-4.5 rounded-2xl border transition-colors ${
        isPendingSync 
          ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400' 
          : 'bg-green-50 border-green-200 hover:border-green-300'
      }`}>
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
          isPendingSync ? 'bg-amber-500' : 'bg-green-600'
        }`}>
          {isPendingSync ? (
            <CloudUpload className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <Check className="w-6 h-6 stroke-[3]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-gray-900 text-base sm:text-lg tracking-tight">
                {diaNome}
              </h4>
              {/* INDICADOR CLARO DE STATUS DE SINCRONIZAÇÃO */}
              {isSyncing ? (
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100/90 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-600" />
                  Sincronizando...
                </span>
              ) : hasSyncError ? (
                <span className="text-[10px] font-bold text-red-800 bg-red-100/90 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                  Pendente • Erro no sync
                </span>
              ) : isPendingSync ? (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1" title="Salvo com segurança no dispositivo. Aguardando sincronização com o servidor.">
                  <CloudUpload className="w-2.5 h-2.5 text-amber-600" />
                  Salvo no dispositivo (Aguardando sync)
                </span>
              ) : (
                <span className="text-[10px] font-bold text-green-800 bg-green-100/90 border border-green-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-2.5 h-2.5 text-green-600" />
                  Sincronizado na planilha
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-500" />
                {formatarDataHora(dds.data, dds.horario)}
              </span>
              {onViewDDS && (
                <button
                  type="button"
                  onClick={() => onViewDDS(dds)}
                  className="p-1 rounded-md text-gray-600 hover:bg-gray-100"
                  title="Ver detalhes"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-800 font-medium mt-1 line-clamp-1">
            <strong>Tema:</strong> {dds.tema}
          </p>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1 font-semibold">
              <Users className="w-3.5 h-3.5" />
              {typeof dds.participantesQtd === 'number'
                ? dds.participantesQtd
                : (dds.participantes?.length || 0)} participantes
            </span>
            {onViewDDS && (
              <button
                type="button"
                onClick={() => onViewDDS(dds)}
                className="text-xs font-bold text-gray-800 hover:text-black underline flex items-center gap-1"
              >
                Detalhes
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isToday) {
    return (
      <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-4.5 bg-yellow-50 rounded-2xl border-2 border-dashed border-yellow-300">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-yellow-200 flex items-center justify-center text-yellow-800 shrink-0">
          <Calendar className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-yellow-950 text-base sm:text-lg tracking-tight">
              {diaNome}
            </h4>
            <span className="text-[11px] font-bold text-yellow-800 bg-yellow-200 px-2 py-0.5 rounded uppercase tracking-wider">
              Hoje
            </span>
          </div>
          <p className="text-xs sm:text-sm text-yellow-800 font-medium mt-1">
            Aguardando início do diálogo...
          </p>
          {onNovoDDSDesteDia && (
            <button
              type="button"
              onClick={onNovoDDSDesteDia}
              className="mt-2 text-xs font-bold text-black bg-yellow-400 hover:bg-yellow-500 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-2xs"
            >
              Iniciar agora
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Dias pendentes / futuros
  return (
    <div className="flex items-center gap-3.5 sm:gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200/80 opacity-60">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 shrink-0">
        <Calendar className="w-5 h-5" />
      </div>

      <div className="flex-1">
        <h4 className="font-bold text-gray-600 text-base sm:text-lg tracking-tight">
          {diaNome}
        </h4>
        <p className="text-xs sm:text-sm text-gray-400 font-medium">Pendente</p>
      </div>
    </div>
  );
};
