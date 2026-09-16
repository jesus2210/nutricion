// LAYER: Infrastructure
// Servicio de Almacenamiento de Fotos con Supabase Storage

import { SupabaseClient } from '@supabase/supabase-js';
import { IStorageService } from '../../application/ports/storage-service.port';

export class SupabaseStorageService implements IStorageService {
  constructor(private supabase: SupabaseClient) {}

  async uploadFile(bucket: string, path: string, file: Blob | Buffer, contentType: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error || !data) {
      throw new Error(`Error al subir archivo a storage: ${error?.message}`);
    }

    return data.path;
  }

  async getSignedUrl(bucket: string, path: string, expiresInSeconds: number = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data) {
      throw new Error(`Error al generar URL firmada: ${error?.message}`);
    }

    return data.signedUrl;
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);
    if (error) {
      throw new Error(`Error al eliminar archivo de storage: ${error.message}`);
    }
  }
}
