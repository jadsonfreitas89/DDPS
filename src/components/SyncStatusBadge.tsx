import React from 'react';
import { Wifi, WifiOff, RefreshCw, CloudCheck, CloudUpload, AlertCircle } from 'lucide-react';
import { useSyncState } from '../hooks/useSyncState';

interface SyncStatusBadgeProps {
  compact?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ compact = false }) => {
  const { syncState, syncNow } = useSyncState();
  const { isOnline, isSyncing, pendingCount, lastSyncError } = syncState;

  const handleSyncClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    syncNow();
  };

  // 1. Estado Sincronizando
  if (isSyncing) {
    return (
      <div 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold"
        title="Sincronizando operações com o Google Sheets..."
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
        <span className={compact ? 'hidden sm:inline' : ''}>Sincronizando...</span>
      </div>
    );
  }

  // 2. Estado Offline
  if (!isOnline) {
    return (
      <div 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold"
        title="Modo Offline ativado: Todas as operações são salvas no dispositivo e aguardam conexão."
      >
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span>Offline</span>
        {pendingCount > 0 && (
          <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[10px] rounded-full font-black">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  // 3. Estado com Erro na Sincronização
  if (lastSyncError && pendingCount > 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold">
        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
        <span className={compact ? 'hidden md:inline' : ''}>Falha no sync</span>
        <button
          type="button"
          onClick={handleSyncClick}
          className="ml-1 px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[10px] font-black uppercase transition-colors"
          title="Tentar sincronizar novamente"
        >
          Tentar
        </button>
      </div>
    );
  }

  // 4. Estado Aguardando Sincronização (Online mas com itens na fila)
  if (pendingCount > 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 text-xs font-bold">
        <CloudUpload className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
        <span>{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</span>
        <button
          type="button"
          onClick={handleSyncClick}
          className="ml-1 px-2 py-0.5 rounded bg-yellow-400 text-black text-[10px] font-black uppercase tracking-wider hover:bg-yellow-300 transition-colors flex items-center gap-1"
          title="Sincronizar agora"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>Sincronizar</span>
        </button>
      </div>
    );
  }

  // 5. Estado Online e Sincronizado
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium"
      title="Dispositivo conectado. Todos os dados estão sincronizados com a planilha."
    >
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className={compact ? 'hidden md:inline text-[11px]' : 'text-xs'}>Sincronizado</span>
    </div>
  );
};
