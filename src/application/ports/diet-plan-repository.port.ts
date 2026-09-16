// LAYER: Application
// Puerto para el Repositorio de Planes Nutricionales

import { DietPlan } from '../../domain/entities/diet-plan';

export interface IDietPlanRepository {
  findById(id: string): Promise<DietPlan | null>;
  findCurrentByPatientId(patientId: string): Promise<DietPlan | null>;
  findHistoryByPatientId(patientId: string): Promise<DietPlan[]>;
  create(plan: Omit<DietPlan, 'id' | 'createdAt'>): Promise<DietPlan>;
  archiveCurrentPlan(patientId: string): Promise<void>;
}
