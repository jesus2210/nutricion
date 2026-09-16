// LAYER: Infrastructure
// Implementación de IDailyLogRepository con Supabase

import { SupabaseClient } from '@supabase/supabase-js';
import { IDailyLogRepository } from '../../application/ports/daily-log-repository.port';
import { DailyLog } from '../../domain/entities/daily-log';

export class SupabaseDailyLogRepository implements IDailyLogRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByDate(patientId: string, logDate: string): Promise<DailyLog | null> {
    const { data, error } = await this.supabase
      .from('daily_logs')
      .select('*')
      .eq('patient_id', patientId)
      .eq('log_date', logDate)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async findRecent(patientId: string, limitDays: number = 7): Promise<DailyLog[]> {
    const { data, error } = await this.supabase
      .from('daily_logs')
      .select('*')
      .eq('patient_id', patientId)
      .order('log_date', { ascending: false })
      .limit(limitDays);

    if (error || !data) return [];
    return data.map((row) => this.mapToDomain(row));
  }

  async saveLog(log: Omit<DailyLog, 'id' | 'createdAt'>): Promise<DailyLog> {
    const { data, error } = await this.supabase
      .from('daily_logs')
      .upsert(
        {
          patient_id: log.patientId,
          log_date: log.logDate,
          portions_consumed: log.portionsConsumed,
          water_liters: log.waterLiters,
          is_completed: log.isCompleted,
          notes: log.notes,
        },
        { onConflict: 'patient_id,log_date' }
      )
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Error al guardar registro diario: ${error?.message}`);
    }

    return this.mapToDomain(data);
  }

  private mapToDomain(row: any): DailyLog {
    return {
      id: row.id,
      patientId: row.patient_id,
      logDate: row.log_date,
      portionsConsumed: row.portions_consumed,
      waterLiters: row.water_liters ? Number(row.water_liters) : null,
      isCompleted: row.is_completed,
      notes: row.notes,
      createdAt: new Date(row.created_at),
    };
  }
}
