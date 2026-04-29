import { Injectable, computed, signal, inject } from '@angular/core';
import localforage from 'localforage';
import { SupabaseService } from './supabase.service';
import { AlertController, ToastController } from '@ionic/angular/standalone';

export interface SyncOperation {
  id: string;
  table: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: Record<string, unknown>;
  recordId?: string; // Para updates/deletes
  timestamp: number;
}

export type SyncState = 'Online' | 'Offline' | 'Sincronizando' | 'Conflicto';

/**
 * @class OfflineSyncService
 * @description Servicio core encargado de garantizar la integridad de los datos 
 * en entornos de conectividad intermitente (Arquitectura Offline-First).
 * Escucha eventos de red y encola operaciones CRUD temporalmente en IndexedDB
 * cuando el dispositivo pierde conexión, sincronizando automáticamente con el backend
 * al recuperar conectividad.
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  private supa = inject(SupabaseService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  private networkStatusSignal = signal<boolean>(navigator.onLine);
  private syncQueueSignal = signal<SyncOperation[]>([]);
  private syncStateSignal = signal<SyncState>(navigator.onLine ? 'Online' : 'Offline');

  readonly isOnline = computed(() => this.networkStatusSignal());
  readonly syncState = computed(() => this.syncStateSignal());
  readonly pendingOperations = computed(() => this.syncQueueSignal());
  readonly pendingCount = computed(() => this.syncQueueSignal().length);

  constructor() {
    this.initStorage();
    window.addEventListener('online', () => this.setNetworkStatus(true));
    window.addEventListener('offline', () => this.setNetworkStatus(false));
  }

  /**
   * @description Inicializa la base de datos IndexedDB usando localforage.
   * Restaura la cola de sincronización pendiente si el usuario cerró la app mientras estaba offline.
   * @private
   */
  private async initStorage() {
    localforage.config({
      name: 'VacaApp',
      storeName: 'sync_queue'
    });
    const queue = await localforage.getItem<SyncOperation[]>('vacapp_sync_queue');
    if (queue) {
      this.syncQueueSignal.set(queue);
    }
  }

  private async saveQueue(queue: SyncOperation[]) {
    await localforage.setItem('vacapp_sync_queue', queue);
    this.syncQueueSignal.set(queue);
  }

  private setNetworkStatus(isOnline: boolean) {
    this.networkStatusSignal.set(isOnline);
    this.syncStateSignal.set(isOnline ? 'Online' : 'Offline');
    if (isOnline) {
      this.processQueue();
    }
  }

  /**
   * @description Encola una operación de base de datos para ser procesada.
   * Si hay conexión, la procesa inmediatamente. Si no, la guarda en IndexedDB de forma persistente.
   * @param {string} table Nombre de la tabla destino en Supabase.
   * @param {'POST' | 'PUT' | 'DELETE'} method Acción CRUD a realizar.
   * @param {any} payload Los datos a insertar/actualizar.
   * @param {string} [recordId] UUID del registro (requerido para PUT/DELETE).
   */
  async enqueueOperation(table: string, method: 'POST' | 'PUT' | 'DELETE', payload: Record<string, unknown>, recordId?: string) {
    const operation: SyncOperation = {
      id: Math.random().toString(36).substr(2, 9),
      table,
      method,
      payload,
      recordId,
      timestamp: Date.now()
    };
    
    const queue = [...this.syncQueueSignal(), operation];
    await this.saveQueue(queue);
    
    if (this.isOnline()) {
      this.processQueue();
    }
  }

  /**
   * @description El motor de sincronización. Recorre la cola y despacha cada operación
   * secuencialmente hacia Supabase. Incorpora una estrategia de resolución de conflictos
   * simple (basada en el campo `updated_at`).
   */
  async processQueue() {
    if (!this.isOnline() || this.syncState() === 'Sincronizando' || this.syncState() === 'Conflicto') return;

    let queue = [...this.syncQueueSignal()];
    if (queue.length === 0) return;

    this.syncStateSignal.set('Sincronizando');

    // Autenticación Offline (Renovación de token si estuvimos mucho tiempo offline)
    if (this.supa.client) {
      const { data, error } = await this.supa.client.auth.getSession();
      if (!data.session || error) {
         await this.supa.client.auth.refreshSession();
      }
    }

    let remainingQueue: SyncOperation[] = [];
    let hasConflict = false;

    for (const op of queue) {
      if (op.method === 'PUT' && op.recordId && this.supa.client) {
         // Verificar last updated_at
         const { data: currentDbRecord } = await this.supa.client
            .from(op.table)
            .select('updated_at')
            .eq('id', op.recordId)
            .single();

         if (currentDbRecord && currentDbRecord.updated_at) {
            const dbTimestamp = new Date(currentDbRecord.updated_at).getTime();
            if (dbTimestamp > op.timestamp) {
               this.syncStateSignal.set('Conflicto');
               hasConflict = true;
               
               const resolve = await this.promptConflict(op.table, dbTimestamp, op.timestamp);
               if (resolve === 'discard') {
                 continue; // Ignorar esta op y continuar (Soft-Conflict Drop)
               }
               // Si resolve es 'force', seguimos con el loop y lo sobrescribe
            }
         }
      }

      // Procesar en Supabase nativo/mock
      let reqError = null;
      if (op.method === 'POST') {
         const { error } = await this.supa.create(op.table, op.payload);
         reqError = error;
      } else if (op.method === 'PUT' && op.recordId) {
         const { error } = await this.supa.update(op.table, op.recordId, op.payload);
         reqError = error;
      } else if (op.method === 'DELETE' && op.recordId) {
         const { error } = await this.supa.delete(op.table, op.recordId);
         reqError = error;
      }

      if (reqError) {
         console.error('[OfflineSync] Error sincronizando operation', op, reqError);
         remainingQueue.push(op); // Reencolar si falló transitoriamente
      }
    }

    await this.saveQueue(remainingQueue);
    
    if (!hasConflict) {
      this.syncStateSignal.set(this.isOnline() ? 'Online' : 'Offline');
      if (queue.length > remainingQueue.length) {
         const toast = await this.toastCtrl.create({
            message: 'Sincronización offline completada.',
            duration: 3000,
            color: 'success',
            position: 'bottom',
         });
         toast.present();
      }
    }
  }

  /**
   * @description Interfaz visual de resolución de conflictos.
   * @private
   */
  private async promptConflict(table: string, dbDataTime: number, localDataTime: number): Promise<'force' | 'discard'> {
    return new Promise(async (resolve) => {
       const alert = await this.alertCtrl.create({
         header: 'Conflicto de Sincronización',
         message: `Alguien modificó un registro en ${table}. Tu versión guardada offline es más antigua. ¿Qué deseas hacer?`,
         buttons: [
           { 
             text: 'Descartar mis cambios', 
             role: 'cancel', 
             handler: () => {
                this.syncStateSignal.set(this.isOnline() ? 'Online' : 'Offline');
                resolve('discard')
             } 
           },
           { 
             text: 'Sobrescribir datos', 
             role: 'destructive', 
             handler: () => {
                this.syncStateSignal.set(this.isOnline() ? 'Online' : 'Offline');
                resolve('force')
             } 
           }
         ]
       });
       await alert.present();
    });
  }

  /**
   * Worker background simulado: Ejecuta descarga masiva a IndexedDB
   * para consultas sin conexión.
   */
  async cacheFullDatasetBackground() {
    if (!this.supa.client || !this.isOnline()) return;
    try {
      const { data, error } = await this.supa.client.from('bovinos').select('*');
      if (data && !error) {
        await localforage.setItem('vacapp_bovinos_offline_cache', data);
        console.log('[OfflineSync] Caché de catálogo primario Bovinos actualizado en IndexedDB.');
      }
    } catch(e: unknown) {
      console.error('[OfflineSync] Error al cachear background dataset', e);
    }
  }

  async clearQueue() {
    await this.saveQueue([]);
  }
}
