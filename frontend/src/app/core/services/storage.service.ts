import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

/**
 * @class StorageService
 * @description Gestor de activos multimedia y persistencia de archivos.
 * Encargado de la subida, recuperación y organización de fotografías de animales
 * en Supabase Storage, con soporte para simulación (Mock) local.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private supabase = inject(SupabaseService);

  /**
   * @description Sube una fotografía al bucket 'animal-photos'.
   * Genera una ruta organizada por finca para optimizar la privacidad y el acceso.
   * @param {File} file Archivo binario de la imagen.
   * @param {string} fincaId Identificador de la explotación.
   * @param {string} bovinoId Identificador único del animal.
   * @returns {Promise<{data: {publicUrl: string} | null, error: any}>}
   */
  async uploadAnimalPhoto(file: File, fincaId: string, bovinoId: string) {
    if (!this.supabase.client) {
      // Modo Mock: simulamos subida creando un object URL
      return { data: { publicUrl: URL.createObjectURL(file) }, error: null };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${fincaId}/${bovinoId}_${Math.random()}.${fileExt}`;
    const filePath = `photos/${fileName}`;

    const { error: uploadError } = await this.supabase.client.storage
      .from('animal-photos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    const { data: { publicUrl } } = this.supabase.client.storage
      .from('animal-photos')
      .getPublicUrl(filePath);

    return { data: { publicUrl }, error: null };
  }
}
