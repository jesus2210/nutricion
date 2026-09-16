// LAYER: Infrastructure
// Implementación de ICheckinRepository con Supabase

import { SupabaseClient } from '@supabase/supabase-js';
import { ICheckinRepository } from '../../application/ports/checkin-repository.port';
import { WeeklyCheckin, CheckinPhoto, PhotoType } from '../../domain/entities/weekly-checkin';

export class SupabaseCheckinRepository implements ICheckinRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<WeeklyCheckin | null> {
    const { data, error } = await this.supabase
      .from('weekly_checkins')
      .select('*, checkin_photos(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async findByPatientId(patientId: string): Promise<WeeklyCheckin[]> {
    const { data, error } = await this.supabase
      .from('weekly_checkins')
      .select('*, checkin_photos(*)')
      .eq('patient_id', patientId)
      .order('checkin_date', { ascending: false });

    if (error || !data) return [];
    return data.map((row) => this.mapToDomain(row));
  }

  async create(checkin: Omit<WeeklyCheckin, 'id' | 'photos' | 'createdAt'>): Promise<WeeklyCheckin> {
    const { data, error } = await this.supabase
      .from('weekly_checkins')
      .insert({
        patient_id: checkin.patientId,
        checkin_date: checkin.checkinDate,
        weight_kg: checkin.weightKg,
        waist_cm: checkin.waistCm,
        hip_cm: checkin.hipCm,
        thigh_cm: checkin.thighCm,
        arm_cm: checkin.armCm,
        neck_cm: checkin.neckCm,
        chest_cm: checkin.chestCm,
        body_fat_percentage: checkin.bodyFatPercentage,
        adherence_score: checkin.adherenceScore,
        hunger_level: checkin.hungerLevel,
        energy_level: checkin.energyLevel,
        sleep_quality: checkin.sleepQuality,
        notes: checkin.notes,
      })
      .select('*, checkin_photos(*)')
      .single();

    if (error || !data) {
      throw new Error(`Error al registrar check-in: ${error?.message}`);
    }

    return this.mapToDomain(data);
  }

  async addPhoto(checkinId: string, photoType: PhotoType, storagePath: string): Promise<CheckinPhoto> {
    const { data, error } = await this.supabase
      .from('checkin_photos')
      .insert({
        checkin_id: checkinId,
        photo_type: photoType,
        storage_path: storagePath,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Error al vincular foto: ${error?.message}`);
    }

    return {
      id: data.id,
      checkinId: data.checkin_id,
      photoType: data.photo_type,
      storagePath: data.storage_path,
      createdAt: new Date(data.created_at),
    };
  }

  async updateFeedback(checkinId: string, feedback: string): Promise<void> {
    const { error } = await this.supabase
      .from('weekly_checkins')
      .update({ admin_feedback: feedback })
      .eq('id', checkinId);

    if (error) throw new Error(`Error al guardar feedback: ${error.message}`);
  }

  private mapToDomain(row: any): WeeklyCheckin {
    return {
      id: row.id,
      patientId: row.patient_id,
      checkinDate: row.checkin_date,
      weightKg: Number(row.weight_kg),
      waistCm: row.waist_cm ? Number(row.waist_cm) : null,
      hipCm: row.hip_cm ? Number(row.hip_cm) : null,
      thighCm: row.thigh_cm ? Number(row.thigh_cm) : null,
      armCm: row.arm_cm ? Number(row.arm_cm) : null,
      neckCm: row.neck_cm ? Number(row.neck_cm) : null,
      chestCm: row.chest_cm ? Number(row.chest_cm) : null,
      bodyFatPercentage: row.body_fat_percentage ? Number(row.body_fat_percentage) : null,
      adherenceScore: row.adherence_score,
      hungerLevel: row.hunger_level,
      energyLevel: row.energy_level,
      sleepQuality: row.sleep_quality,
      notes: row.notes,
      adminFeedback: row.admin_feedback,
      photos: (row.checkin_photos || []).map((p: any) => ({
        id: p.id,
        checkinId: p.checkin_id,
        photoType: p.photo_type,
        storagePath: p.storage_path,
        createdAt: new Date(p.created_at),
      })),
      createdAt: new Date(row.created_at),
    };
  }
}
