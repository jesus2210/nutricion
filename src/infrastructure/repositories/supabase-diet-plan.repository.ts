// LAYER: Infrastructure
// Implementación de IDietPlanRepository con Supabase

import { SupabaseClient } from '@supabase/supabase-js';
import { IDietPlanRepository } from '../../application/ports/diet-plan-repository.port';
import { DietPlan } from '../../domain/entities/diet-plan';

export class SupabaseDietPlanRepository implements IDietPlanRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<DietPlan | null> {
    const { data, error } = await this.supabase
      .from('diet_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async findCurrentByPatientId(patientId: string): Promise<DietPlan | null> {
    const { data, error } = await this.supabase
      .from('diet_plans')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_current', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async findHistoryByPatientId(patientId: string): Promise<DietPlan[]> {
    const { data, error } = await this.supabase
      .from('diet_plans')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row) => this.mapToDomain(row));
  }

  async archiveCurrentPlan(patientId: string): Promise<void> {
    await this.supabase
      .from('diet_plans')
      .update({ is_current: false, end_date: new Date().toISOString().split('T')[0] })
      .eq('patient_id', patientId)
      .eq('is_current', true);
  }

  async create(plan: Omit<DietPlan, 'id' | 'createdAt'>): Promise<DietPlan> {
    // Si este plan es marcado como actual, archivar los anteriores
    if (plan.isCurrent) {
      await this.archiveCurrentPlan(plan.patientId);
    }

    const { data, error } = await this.supabase
      .from('diet_plans')
      .insert({
        patient_id: plan.patientId,
        created_by: plan.createdBy,
        title: plan.title,
        goal: plan.goal,
        target_calories: plan.targetCalories,
        target_protein_g: plan.targetProteinG,
        target_fat_g: plan.targetFatG,
        target_carbs_g: plan.targetCarbsG,
        portions_json: plan.portions,
        meals_config_json: plan.meals,
        notes: plan.notes,
        is_current: plan.isCurrent,
        start_date: plan.startDate,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Error al crear plan nutricional: ${error?.message}`);
    }

    return this.mapToDomain(data);
  }

  private mapToDomain(row: any): DietPlan {
    return {
      id: row.id,
      patientId: row.patient_id,
      createdBy: row.created_by,
      title: row.title,
      goal: row.goal,
      targetCalories: Number(row.target_calories),
      targetProteinG: Number(row.target_protein_g),
      targetFatG: Number(row.target_fat_g),
      targetCarbsG: Number(row.target_carbs_g),
      portions: row.portions_json,
      meals: row.meals_config_json || [],
      notes: row.notes,
      isCurrent: row.is_current,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: new Date(row.created_at),
    };
  }
}
