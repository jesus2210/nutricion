// LAYER: Application
// Puerto para Servicio de Almacenamiento Blob (Supabase Storage)

export interface IStorageService {
  uploadFile(bucket: string, path: string, file: Blob | Buffer, contentType: string): Promise<string>;
  getSignedUrl(bucket: string, path: string, expiresInSeconds?: number): Promise<string>;
  deleteFile(bucket: string, path: string): Promise<void>;
}
