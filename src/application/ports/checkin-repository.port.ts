// LAYER: Application
// Puerto para el Repositorio de Check-ins y Fotos

import { WeeklyCheckin, CheckinPhoto, PhotoType } from '../../domain/entities/weekly-checkin';

export interface ICheckinRepository {
  findById(id: string): Promise<WeeklyCheckin | null>;
  findByPatientId(patientId: string): Promise<WeeklyCheckin[]>;
  create(checkin: Omit<WeeklyCheckin, 'id' | 'photos' | 'createdAt'>): Promise<WeeklyCheckin>;
  addPhoto(checkinId: string, photoType: PhotoType, storagePath: string): Promise<CheckinPhoto>;
  updateFeedback(checkinId: string, feedback: string): Promise<void>;
}
