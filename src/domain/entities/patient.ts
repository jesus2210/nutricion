// LAYER: Domain
// Entidad de Perfil y Expediente del Paciente

export type Gender = 'male' | 'female';
export type TargetGoal = 'Deficit' | 'Superavit' | 'Recomposicion' | 'Mantenimiento';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'intense' | 'very_intense';

export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD
  heightCm: number;
  initialWeightKg: number;
  currentWeightKg?: number;
  targetGoal: TargetGoal;
  activityLevel: ActivityLevel;
  bodyFatPercentage?: number | null;
  allergiesOrNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
