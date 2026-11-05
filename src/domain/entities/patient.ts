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

export interface PatientIdentityInfo {
  fullName: string;
  email: string | null;
  phone: string | null;
  isManualPatient: boolean;
  clinicalData: Record<string, any>;
}

/**
 * Extrae el nombre, correo, teléfono y metadatos clínicos de un registro patient_profiles,
 * soportando tanto pacientes con cuenta (profiles) como pacientes registrados manualmente sin cuenta.
 */
export function extractPatientIdentity(patientRow: any): PatientIdentityInfo {
  let clinicalData: Record<string, any> = {};
  if (patientRow?.allergies_or_notes) {
    const match = String(patientRow.allergies_or_notes).match(/CLINICAL_JSON:(.+)$/m);
    if (match && match[1]) {
      try {
        clinicalData = JSON.parse(match[1]);
      } catch {
        clinicalData = {};
      }
    }
  }

  const profileObj = Array.isArray(patientRow?.profiles)
    ? patientRow.profiles[0]
    : patientRow?.profiles;

  const rawFullName =
    clinicalData.fullName ||
    profileObj?.full_name ||
    patientRow?.full_name ||
    'Paciente';

  const rawEmail = clinicalData.email || profileObj?.email || patientRow?.email || null;
  const isInternalPlaceholderEmail =
    !rawEmail ||
    String(rawEmail).endsWith('@sin-correo.local') ||
    String(rawEmail) === 'sin-correo@paciente.local';

  const cleanEmail = isInternalPlaceholderEmail ? null : String(rawEmail);
  const cleanPhone = clinicalData.phone || profileObj?.phone || patientRow?.phone || null;
  const isManualPatient = Boolean(
    !patientRow?.user_id || clinicalData.isManualPatient || isInternalPlaceholderEmail
  );

  return {
    fullName: rawFullName,
    email: cleanEmail,
    phone: cleanPhone,
    isManualPatient,
    clinicalData,
  };
}
