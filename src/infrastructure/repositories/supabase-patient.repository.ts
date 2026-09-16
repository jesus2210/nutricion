// LAYER: Infrastructure
// Implementación de IPatientRepository con Supabase

import { SupabaseClient } from '@supabase/supabase-js';
import { IPatientRepository } from '../../application/ports/patient-repository.port';
import { PatientProfile } from '../../domain/entities/patient';

export class SupabasePatientRepository implements IPatientRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<PatientProfile | null> {
    const { data, error } = await this.supabase
      .from('patient_profiles')
      .select('*, profiles(email, full_name)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async findByUserId(userId: string): Promise<PatientProfile | null> {
    const { data, error } = await this.supabase
      .from('patient_profiles')
      .select('*, profiles(email, full_name)')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async findAll(): Promise<PatientProfile[]> {
    const { data, error } = await this.supabase
      .from('patient_profiles')
      .select('*, profiles(email, full_name)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((item) => this.mapToDomain(item));
  }

  async create(patient: Omit<PatientProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<PatientProfile> {
    const { data, error } = await this.supabase
      .from('patient_profiles')
      .insert({
        user_id: patient.userId,
        gender: patient.gender,
        birth_date: patient.birthDate,
        height_cm: patient.heightCm,
        initial_weight_kg: patient.initialWeightKg,
        current_weight_kg: patient.currentWeightKg || patient.initialWeightKg,
        target_goal: patient.targetGoal,
        activity_level: patient.activityLevel,
        body_fat_percentage: patient.bodyFatPercentage,
        allergies_or_notes: patient.allergiesOrNotes,
      })
      .select('*, profiles(email, full_name)')
      .single();

    if (error || !data) {
      throw new Error(`Error al crear paciente: ${error?.message}`);
    }

    return this.mapToDomain(data);
  }

  async update(id: string, updates: Partial<PatientProfile>): Promise<PatientProfile> {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.currentWeightKg !== undefined) payload.current_weight_kg = updates.currentWeightKg;
    if (updates.targetGoal !== undefined) payload.target_goal = updates.targetGoal;
    if (updates.activityLevel !== undefined) payload.activity_level = updates.activityLevel;
    if (updates.bodyFatPercentage !== undefined) payload.body_fat_percentage = updates.bodyFatPercentage;
    if (updates.allergiesOrNotes !== undefined) payload.allergies_or_notes = updates.allergiesOrNotes;

    const { data, error } = await this.supabase
      .from('patient_profiles')
      .update(payload)
      .eq('id', id)
      .select('*, profiles(email, full_name)')
      .single();

    if (error || !data) {
      throw new Error(`Error al actualizar paciente: ${error?.message}`);
    }

    return this.mapToDomain(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('patient_profiles').delete().eq('id', id);
    if (error) throw new Error(`Error al eliminar paciente: ${error.message}`);
  }

  private mapToDomain(row: any): PatientProfile {
    return {
      id: row.id,
      userId: row.user_id,
      fullName: row.profiles?.full_name || 'Paciente',
      email: row.profiles?.email || '',
      gender: row.gender,
      birthDate: row.birth_date,
      heightCm: Number(row.height_cm),
      initialWeightKg: Number(row.initial_weight_kg),
      currentWeightKg: row.current_weight_kg ? Number(row.current_weight_kg) : Number(row.initial_weight_kg),
      targetGoal: row.target_goal,
      activityLevel: row.activity_level,
      bodyFatPercentage: row.body_fat_percentage ? Number(row.body_fat_percentage) : null,
      allergiesOrNotes: row.allergies_or_notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
