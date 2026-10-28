import { SyncState, SyncQueueItem, DDS } from '../types';
import { offlineStorage } from './offlineStorage';
import { api } from './api';

type SyncListener = (state: SyncState) => void;

class SyncManagerService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private pendingCount: number = 0;
  private lastSyncTime: number | null = null;
  private lastSyncError: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private autoSyncTimeout: any = null;

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined') return;

    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      console.log('[SyncManager] Conexão restabelecida (ONLINE)');
      this.isOnline = true;
      this.lastSyncError = null;
      this.notify();
      
      // Auto-sync suave ao reconectar
      if (this.autoSyncTimeout) clearTimeout(this.autoSyncTimeout);
      this.autoSyncTimeout = setTimeout(() => {
        this.syncNow();
      }, 1500);
    });

    window.addEventListener('offline', () => {
      console.log('[SyncManager] Conexão perdida (OFFLINE)');
      this.isOnline = false;
      this.notify();
    });

    // Atualiza contagem pendente inicial
    await this.refreshPendingCount();

    // Tenta sincronizar automaticamente na abertura se houver itens e internet
    if (this.isOnline && this.pendingCount > 0) {
      setTimeout(() => {
        this.syncNow();
      }, 2000);
    }
  }

  public getState(): SyncState {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncTime: this.lastSyncTime,
      lastSyncError: this.lastSyncError
    };
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(fn => {
      try {
        fn(state);
      } catch (e) {
        console.error('[SyncManager] Erro no listener:', e);
      }
    });
  }

  public async refreshPendingCount(): Promise<number> {
    try {
      const queue = await offlineStorage.getSyncQueue();
      this.pendingCount = queue.filter(item => item.status !== 'concluido').length;
      this.notify();
      return this.pendingCount;
    } catch {
      return 0;
    }
  }

  public async syncNow(): Promise<{ sucesso: boolean; mensagem: string; processados: number }> {
    if (this.isSyncing) {
      return { sucesso: false, mensagem: 'Sincronização já em andamento.', processados: 0 };
    }

    if (!navigator.onLine) {
      this.isOnline = false;
      this.lastSyncError = 'Dispositivo offline. Os registros permanecem salvos localmente.';
      this.notify();
      return { sucesso: false, mensagem: this.lastSyncError, processados: 0 };
    }

    this.isSyncing = true;
    this.lastSyncError = null;
    this.notify();

    let processados = 0;
    let houveFalha = false;

    try {
      const queue = await offlineStorage.getSyncQueue();
      const pendentes = queue.filter(item => item.status !== 'concluido');

      console.log(`[SyncManager] Iniciando sincronização de ${pendentes.length} operação(ões) pendente(s)`);

      for (const op of pendentes) {
        await offlineStorage.updateSyncOperation(op.id, { status: 'sincronizando' });

        // Verifica se o ID foi mapeado anteriormente
        let targetIdDDS = op.idDDS;
        const mappedId = await offlineStorage.getRemoteId(targetIdDDS);
        if (mappedId) {
          targetIdDDS = mappedId;
        }

        try {
          if (op.tipo === 'SALVAR_DDS_COMPLETO') {
            const payload = {
              ...op.payload,
              idDDS: targetIdDDS,
              syncOperationId: op.id
            };

            const res = await api.salvarDDSCompletoRemoto(payload);

            if (res && res.sucesso) {
              const remoteIdDDS = res.idDDS || targetIdDDS;

              // Se o DDS tinha ID offline, grava mapeamento e atualiza registro local
              if (op.idDDS.startsWith('DDS-OFFLINE-') && remoteIdDDS) {
                await offlineStorage.saveIdMapping(op.idDDS, remoteIdDDS);

                const localDDS = await offlineStorage.getDDS(op.idDDS);
                if (localDDS) {
                  await offlineStorage.deleteDDS(op.idDDS);
                  const updatedDDS: DDS = {
                    ...localDDS,
                    idDDS: remoteIdDDS,
                    clientOfflineId: op.idDDS,
                    syncStatus: 'synced'
                  };
                  await offlineStorage.saveDDS(updatedDDS);

                  // Atualiza participantes vinculados
                  const parts = await offlineStorage.getParticipantes(op.idDDS);
                  if (parts && parts.length > 0) {
                    await offlineStorage.saveParticipantes(remoteIdDDS, parts);
                  }
                }
              } else {
                // DDS já existente atualizado com sucesso
                const localDDS = await offlineStorage.getDDS(targetIdDDS);
                if (localDDS) {
                  localDDS.syncStatus = 'synced';
                  await offlineStorage.saveDDS(localDDS);
                }
              }

              await offlineStorage.removeSyncOperation(op.id);
              processados++;
            } else {
              throw new Error(res?.message || 'Falha ao sincronizar DDS completo com o servidor.');
            }
          } else if (op.tipo === 'FINALIZAR_DDS') {
            const res = await api.finalizarDDSRemoto(targetIdDDS, op.id);
            if (res && res.success) {
              const localDDS = await offlineStorage.getDDS(targetIdDDS);
              if (localDDS) {
                localDDS.syncStatus = 'synced';
                await offlineStorage.saveDDS(localDDS);
              }
              await offlineStorage.removeSyncOperation(op.id);
              processados++;
            } else {
              throw new Error(res?.message || 'Falha ao finalizar DDS no servidor.');
            }
          } else if (op.tipo === 'SALVAR_PARTICIPANTES') {
            const res = await api.salvarParticipantesRemoto(targetIdDDS, op.payload.participantes, op.id);
            if (res && res.success) {
              await offlineStorage.removeSyncOperation(op.id);
              processados++;
            } else {
              throw new Error(res?.message || 'Falha ao salvar participantes no servidor.');
            }
          }
        } catch (opErr: any) {
          console.error(`[SyncManager] Erro ao sincronizar op ${op.id}:`, opErr);
          houveFalha = true;
          this.lastSyncError = opErr?.message || 'Erro durante a sincronização.';
          
          await offlineStorage.updateSyncOperation(op.id, {
            status: 'erro',
            tentativas: (op.tentativas || 0) + 1,
            ultimoErro: this.lastSyncError || undefined
          });

          // Atualiza status local para erro, mas NUNCA descarta o registro!
          const dds = await offlineStorage.getDDS(targetIdDDS);
          if (dds) {
            dds.syncStatus = 'error';
            await offlineStorage.saveDDS(dds);
          }
        }
      }

      // Sincroniza dados gerais se não houve falhas críticas
      if (!houveFalha) {
        try {
          await api.sincronizar();
        } catch {}
        this.lastSyncTime = Date.now();
      }
    } catch (err: any) {
      console.error('[SyncManager] Erro global no ciclo de sincronização:', err);
      this.lastSyncError = err?.message || 'Erro inesperado na sincronização.';
      houveFalha = true;
    } finally {
      this.isSyncing = false;
      await this.refreshPendingCount();
      this.notify();
    }

    if (houveFalha) {
      return {
        sucesso: false,
        mensagem: this.lastSyncError || 'Houve falha ao sincronizar alguns registros.',
        processados
      };
    }

    return {
      sucesso: true,
      mensagem: processados > 0 ? `${processados} registro(s) sincronizado(s) com sucesso.` : 'Todos os dados estão sincronizados.',
      processados
    };
  }
}

export const syncManager = new SyncManagerService();
