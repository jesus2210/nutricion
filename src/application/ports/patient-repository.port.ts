// LAYER: Application
// Puerto para el Repositorio de Pacientes

import { PatientProfile } from '../../domain/entities/patient';

export interface IPatientRepository {
  findById(id: string): Promise<PatientProfile | null>;
  findByUserId(userId: string): Promise<PatientProfile | null>;
  findAll(): Promise<PatientProfile[]>;
  create(patient: Omit<PatientProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<PatientProfile>;
  update(id: string, patient: Partial<PatientProfile>): Promise<PatientProfile>;
  delete(id: string): Promise<void>;
}
