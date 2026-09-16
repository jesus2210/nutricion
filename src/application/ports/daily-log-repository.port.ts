// LAYER: Application
// Puerto para el Repositorio de Bitácora Diaria

import { DailyLog } from '../../domain/entities/daily-log';

export interface IDailyLogRepository {
  findByDate(patientId: string, logDate: string): Promise<DailyLog | null>;
  findRecent(patientId: string, limitDays?: number): Promise<DailyLog[]>;
  saveLog(log: Omit<DailyLog, 'id' | 'createdAt'>): Promise<DailyLog>;
}
