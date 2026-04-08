import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private supabase = inject(SupabaseService);

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
