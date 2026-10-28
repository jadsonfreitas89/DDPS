import { useState, useEffect } from 'react';
import { SyncState } from '../types';
import { syncManager } from '../services/syncManager';

export function useSyncState() {
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getState());

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  const syncNow = async () => {
    return await syncManager.syncNow();
  };

  return {
    syncState,
    syncNow
  };
}
