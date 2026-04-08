import { Injectable, computed, signal } from '@angular/core';

export interface SyncOperation {
  id: string;
  table: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;
  recordId?: string; // Para updates/deletes
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  private networkStatusSignal = signal<boolean>(navigator.onLine);
  private syncQueueSignal = signal<SyncOperation[]>(this.loadQueue());

  readonly isOnline = computed(() => this.networkStatusSignal());
  readonly pendingOperations = computed(() => this.syncQueueSignal());
  readonly pendingCount = computed(() => this.syncQueueSignal().length);

  constructor() {
    window.addEventListener('online', () => this.setNetworkStatus(true));
    window.addEventListener('offline', () => this.setNetworkStatus(false));
  }

  private setNetworkStatus(isOnline: boolean) {
    this.networkStatusSignal.set(isOnline);
    if (isOnline) {
      this.processQueue(); // Intentar sincronizar cuando vuelva la red
    }
  }

  private loadQueue(): SyncOperation[] {
    const queue = localStorage.getItem('vacapp_sync_queue');
    return queue ? JSON.parse(queue) : [];
  }

  private saveQueue(queue: SyncOperation[]) {
    localStorage.setItem('vacapp_sync_queue', JSON.stringify(queue));
    this.syncQueueSignal.set(queue);
  }

  /**
   * Encola una operación para ser sincronizada con el backend más tarde.
   */
  enqueueOperation(table: string, method: 'POST' | 'PUT' | 'DELETE', payload: any, recordId?: string) {
    const operation: SyncOperation = {
      id: Math.random().toString(36).substr(2, 9),
      table,
      method,
      payload,
      recordId,
      timestamp: Date.now()
    };
    
    const queue = this.loadQueue();
    queue.push(operation);
    this.saveQueue(queue);
    
    // Si estamos online, intentamos vaciar la cola rápido
    if (this.isOnline()) {
      this.processQueue();
    }
  }

  /**
   * Intenta procesar toda la cola. Las operaciones exitosas se retiran.
   */
  async processQueue() {
    if (!this.isOnline()) return;

    const queue = this.loadQueue();
    if (queue.length === 0) return;

    console.log(`[OfflineSync] Procesando ${queue.length} operaciones pendientes...`);
    const remainingQueue: SyncOperation[] = [];

    // En un escenario real, aquí inyectaríamos el SupabaseService y ejecutaríamos las operaciones reales.
    // Como SupabaseService injecta a OfflineSync (circular), el procesamiento real puede desencadenarse por SupabaseService, o podemos emitir un evento.
    // Para simplificar, expondremos la cola y dejaremos que SupabaseService la consuma.
  }
  
  clearQueue() {
    this.saveQueue([]);
  }
}
