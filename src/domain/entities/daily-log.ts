// LAYER: Domain
// Entidad de Registro Diario de Ingestas (Daily Food Log)

import { DailyPortions } from './diet-plan';

export interface DailyLog {
  id: string;
  patientId: string;
  logDate: string; // YYYY-MM-DD
  portionsConsumed: DailyPortions;
  waterLiters?: number | null;
  isCompleted: boolean;
  notes?: string | null;
  createdAt: Date;
}
