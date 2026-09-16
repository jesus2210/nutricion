// LAYER: Domain
// Entidad de Check-in Semanal y Registro de Fotos de Progreso

export type PhotoType = 'front' | 'side' | 'back';

export interface CheckinPhoto {
  id: string;
  checkinId: string;
  photoType: PhotoType;
  storagePath: string;
  url?: string;
  createdAt: Date;
}

export interface WeeklyCheckin {
  id: string;
  patientId: string;
  checkinDate: string; // YYYY-MM-DD
  weightKg: number;
  waistCm?: number | null;
  hipCm?: number | null;
  thighCm?: number | null;
  armCm?: number | null;
  neckCm?: number | null;
  chestCm?: number | null;
  bodyFatPercentage?: number | null;
  adherenceScore: number; // 1 to 10
  hungerLevel?: 'bajo' | 'medio' | 'alto' | null;
  energyLevel?: 'bajo' | 'medio' | 'alto' | null;
  sleepQuality?: 'mala' | 'regular' | 'buena' | null;
  notes?: string | null;
  adminFeedback?: string | null;
  photos: CheckinPhoto[];
  createdAt: Date;
}
