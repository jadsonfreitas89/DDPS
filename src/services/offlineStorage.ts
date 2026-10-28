import { DDS, Participante, Funcionario, Usuario, DDPSStatus, SyncQueueItem } from '../types';

const DB_NAME = 'ddps_offline_db';
const DB_VERSION = 1;

// Storage keys para fallback localStorage e sincronização transparente
const STORAGE_KEYS = {
  STATE: 'ddps_local_state_v2',
  FUNCIONARIOS: 'ddps_cached_funcionarios_v1',
  QUEUE: 'ddps_sync_queue_v1',
  MAPPINGS: 'ddps_id_mappings_v1',
  USER: 'ddps_cached_user_v1',
  STATUS: 'ddps_cached_status_v1'
};

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private isInitPromise: Promise<boolean> | null = null;

  constructor() {
    this.init();
  }

  public async init(): Promise<boolean> {
    if (this.isInitPromise) return this.isInitPromise;

    this.isInitPromise = new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('[OfflineStorage] IndexedDB indisponível. Usando localStorage.');
        resolve(false);
        return;
      }

      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains('dds')) {
            const ddsStore = db.createObjectStore('dds', { keyPath: 'idDDS' });
            ddsStore.createIndex('syncStatus', 'syncStatus', { unique: false });
            ddsStore.createIndex('semana', 'semana', { unique: false });
          }

          if (!db.objectStoreNames.contains('participantes')) {
            db.createObjectStore('participantes', { keyPath: 'idDDS' });
          }

          if (!db.objectStoreNames.contains('funcionarios')) {
            db.createObjectStore('funcionarios', { keyPath: 'idFuncionario' });
          }

          if (!db.objectStoreNames.contains('sync_queue')) {
            const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
            queueStore.createIndex('status', 'status', { unique: false });
            queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          if (!db.objectStoreNames.contains('id_mappings')) {
            db.createObjectStore('id_mappings', { keyPath: 'clientOfflineId' });
          }

          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
          }
        };

        req.onsuccess = (event: Event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.migrateLocalStorageToIndexedDB().catch(() => {});
          resolve(true);
        };

        req.onerror = (err) => {
          console.warn('[OfflineStorage] Erro ao abrir IndexedDB, usando fallback:', err);
          resolve(false);
        };
      } catch (err) {
        console.warn('[OfflineStorage] Falha ao inicializar IndexedDB:', err);
        resolve(false);
      }
    });

    return this.isInitPromise;
  }

  // Migra dados de versões anteriores do localStorage para IndexedDB de forma transparente
  private async migrateLocalStorageToIndexedDB(): Promise<void> {
    try {
      const rawState = localStorage.getItem(STORAGE_KEYS.STATE);
      if (rawState) {
        const state = JSON.parse(rawState);
        if (state.ddsList && Array.isArray(state.ddsList)) {
          for (const d of state.ddsList) {
            await this.saveDDS(d);
          }
        }
        if (state.participantesMap && typeof state.participantesMap === 'object') {
          for (const [idDDS, parts] of Object.entries(state.participantesMap)) {
            if (Array.isArray(parts)) {
              await this.saveParticipantes(idDDS, parts as Participante[]);
            }
          }
        }
      }
    } catch {
      // Ignora erro de migração
    }
  }

  // ==========================================================
  // DDS
  // ==========================================================

  public async saveDDS(dds: DDS): Promise<void> {
    await this.init();

    // 1. Grava no IndexedDB
    if (this.db) {
      try {
        const tx = this.db.transaction('dds', 'readwrite');
        const store = tx.objectStore('dds');
        store.put({
          ...dds,
          updatedAt: Date.now()
        });
      } catch (e) {
        console.warn('[OfflineStorage] Erro ao gravar DDS no IndexedDB:', e);
      }
    }

    // 2. Sincroniza espelho com localStorage para manter retrocompatibilidade imediata
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATE);
      const state = raw ? JSON.parse(raw) : { ddsList: [], participantesMap: {} };
      const idx = state.ddsList.findIndex((item: DDS) => item.idDDS === dds.idDDS);
      if (idx >= 0) {
        state.ddsList[idx] = { ...state.ddsList[idx], ...dds };
      } else {
        state.ddsList.push(dds);
      }
      localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(state));
    } catch {
      // Quota localStorage cheia
    }
  }

  public async getDDS(idDDS: string): Promise<DDS | null> {
    await this.init();

    if (this.db) {
      try {
        return await new Promise<DDS | null>((resolve) => {
          const tx = this.db!.transaction('dds', 'readonly');
          const store = tx.objectStore('dds');
          const req = store.get(idDDS);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });
      } catch {
        // Fallback para localStorage
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATE);
      if (raw) {
        const state = JSON.parse(raw);
        return state.ddsList.find((item: DDS) => item.idDDS === idDDS) || null;
      }
    } catch {}

    return null;
  }

  public async getAllDDS(): Promise<DDS[]> {
    await this.init();

    if (this.db) {
      try {
        const list = await new Promise<DDS[]>((resolve) => {
          const tx = this.db!.transaction('dds', 'readonly');
          const store = tx.objectStore('dds');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
        if (list && list.length > 0) {
          return list;
        }
      } catch {
        // Fallback
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATE);
      if (raw) {
        const state = JSON.parse(raw);
        return Array.isArray(state.ddsList) ? state.ddsList : [];
      }
    } catch {}

    return [];
  }

  public async deleteDDS(idDDS: string): Promise<void> {
    await this.init();

    if (this.db) {
      try {
        const tx = this.db.transaction(['dds', 'participantes'], 'readwrite');
        tx.objectStore('dds').delete(idDDS);
        tx.objectStore('participantes').delete(idDDS);
      } catch (e) {
        console.warn('[OfflineStorage] Erro ao deletar DDS no IndexedDB:', e);
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATE);
      if (raw) {
        const state = JSON.parse(raw);
        state.ddsList = state.ddsList.filter((d: DDS) => d.idDDS !== idDDS);
        if (state.participantesMap && state.participantesMap[idDDS]) {
          delete state.participantesMap[idDDS];
        }
        localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(state));
      }
    } catch {}
  }

  // ==========================================================
  // PARTICIPANTES
  // ==========================================================

  public async saveParticipantes(idDDS: string, parts: Participante[]): Promise<void> {
    await this.init();

    if (this.db) {
      try {
        const tx = this.db.transaction('participantes', 'readwrite');
        tx.objectStore('participantes').put({
          idDDS,
          participantes: parts,
          updatedAt: Date.now()
        });
      } catch (e) {
        console.warn('[OfflineStorage] Erro ao gravar participantes no IndexedDB:', e);
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATE);
      const state = raw ? JSON.parse(raw) : { ddsList: [], participantesMap: {} };
      state.participantesMap[idDDS] = parts;
      const dds = state.ddsList.find((d: DDS) => d.idDDS === idDDS);
      if (dds) {
        dds.participantesQtd = parts.length;
        dds.participantes = parts;
      }
      localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(state));
    } catch {}
  }

  public async getParticipantes(idDDS: string): Promise<Participante[]> {
    await this.init();

    if (this.db) {
      try {
        const res = await new Promise<any>((resolve) => {
          const tx = this.db!.transaction('participantes', 'readonly');
          const store = tx.objectStore('participantes');
          const req = store.get(idDDS);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });
        if (res && Array.isArray(res.participantes)) {
          return res.participantes;
        }
      } catch {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATE);
      if (raw) {
        const state = JSON.parse(raw);
        return state.participantesMap[idDDS] || [];
      }
    } catch {}

    return [];
  }

  // ==========================================================
  // FUNCIONÁRIOS
  // ==========================================================

  public async saveCachedFuncionarios(list: Funcionario[]): Promise<void> {
    await this.init();

    if (this.db && Array.isArray(list) && list.length > 0) {
      try {
        const tx = this.db.transaction('funcionarios', 'readwrite');
        const store = tx.objectStore('funcionarios');
        for (const func of list) {
          store.put(func);
        }
      } catch {}
    }

    try {
      localStorage.setItem(STORAGE_KEYS.FUNCIONARIOS, JSON.stringify(list));
    } catch {}
  }

  public async getCachedFuncionarios(): Promise<Funcionario[]> {
    await this.init();

    if (this.db) {
      try {
        const list = await new Promise<Funcionario[]>((resolve) => {
          const tx = this.db!.transaction('funcionarios', 'readonly');
          const store = tx.objectStore('funcionarios');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
        if (list && list.length > 0) return list;
      } catch {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FUNCIONARIOS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    return [];
  }

  public async saveFuncionarios(list: Funcionario[]): Promise<void> {
    return this.saveCachedFuncionarios(list);
  }

  public async getFuncionarios(): Promise<Funcionario[]> {
    return this.getCachedFuncionarios();
  }

  // ==========================================================
  // FILA DE SINCRONIZAÇÃO (SYNC QUEUE)
  // ==========================================================

  public async enqueueOperation(
    op: Omit<SyncQueueItem, 'id' | 'timestamp' | 'tentativas' | 'status'>
  ): Promise<SyncQueueItem> {
    await this.init();

    const item: SyncQueueItem = {
      ...op,
      id: `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      timestamp: Date.now(),
      tentativas: 0,
      status: 'pendente'
    };

    if (this.db) {
      try {
        const tx = this.db.transaction('sync_queue', 'readwrite');
        tx.objectStore('sync_queue').put(item);
      } catch (e) {
        console.warn('[OfflineStorage] Erro ao enfileirar operação no IndexedDB:', e);
      }
    }

    try {
      const queue = await this.getSyncQueue();
      queue.push(item);
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
    } catch {}

    return item;
  }

  public async getSyncQueue(): Promise<SyncQueueItem[]> {
    await this.init();

    if (this.db) {
      try {
        const list = await new Promise<SyncQueueItem[]>((resolve) => {
          const tx = this.db!.transaction('sync_queue', 'readonly');
          const store = tx.objectStore('sync_queue');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
        if (list && list.length > 0) {
          return list.sort((a, b) => a.timestamp - b.timestamp);
        }
      } catch {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.QUEUE);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          return list.sort((a, b) => a.timestamp - b.timestamp);
        }
      }
    } catch {}

    return [];
  }

  public async updateSyncOperation(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    await this.init();

    if (this.db) {
      try {
        const tx = this.db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result) {
            store.put({ ...req.result, ...updates });
          }
        };
      } catch {}
    }

    try {
      const queue = await this.getSyncQueue();
      const idx = queue.findIndex(item => item.id === id);
      if (idx >= 0) {
        queue[idx] = { ...queue[idx], ...updates };
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
      }
    } catch {}
  }

  public async removeSyncOperation(id: string): Promise<void> {
    await this.init();

    if (this.db) {
      try {
        const tx = this.db.transaction('sync_queue', 'readwrite');
        tx.objectStore('sync_queue').delete(id);
      } catch {}
    }

    try {
      const queue = await this.getSyncQueue();
      const filtered = queue.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(filtered));
    } catch {}
  }

  // ==========================================================
  // MAPEAMENTO DE IDS (CLIENT OFFLINE ID -> REMOTE ID)
  // ==========================================================

  public async saveIdMapping(clientOfflineId: string, remoteIdDDS: string): Promise<void> {
    await this.init();

    if (this.db) {
      try {
        const tx = this.db.transaction('id_mappings', 'readwrite');
        tx.objectStore('id_mappings').put({
          clientOfflineId,
          remoteIdDDS,
          timestamp: Date.now()
        });
      } catch {}
    }

    try {
      const mappings = await this.getAllIdMappings();
      mappings[clientOfflineId] = remoteIdDDS;
      localStorage.setItem(STORAGE_KEYS.MAPPINGS, JSON.stringify(mappings));
    } catch {}
  }

  public async getRemoteId(clientOfflineId: string): Promise<string | null> {
    await this.init();

    if (this.db) {
      try {
        const res = await new Promise<any>((resolve) => {
          const tx = this.db!.transaction('id_mappings', 'readonly');
          const req = tx.objectStore('id_mappings').get(clientOfflineId);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });
        if (res && res.remoteIdDDS) return res.remoteIdDDS;
      } catch {}
    }

    try {
      const mappings = await this.getAllIdMappings();
      return mappings[clientOfflineId] || null;
    } catch {}

    return null;
  }

  public async getAllIdMappings(): Promise<Record<string, string>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MAPPINGS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  // ==========================================================
  // SESSÃO E METADADOS DO USUÁRIO OFFLINE
  // ==========================================================

  public async saveCachedUser(user: Usuario | null): Promise<void> {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch {}
  }

  public async getCachedUser(): Promise<Usuario | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public async saveCachedStatus(status: DDPSStatus | null): Promise<void> {
    try {
      if (status) {
        localStorage.setItem(STORAGE_KEYS.STATUS, JSON.stringify(status));
      } else {
        localStorage.removeItem(STORAGE_KEYS.STATUS);
      }
    } catch {}
  }

  public async getCachedStatus(): Promise<DDPSStatus | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATUS);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export const offlineStorage = new OfflineStorageService();
