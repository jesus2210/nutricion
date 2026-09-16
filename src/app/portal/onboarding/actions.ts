// LAYER: Application / Interface
// Server Action para Guardar el Onboarding Clínico del Paciente
'use server';

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { revalidatePath } from 'next/cache';
import { calculateNavyBodyFat } from '@/domain/formulas/body-composition';

export interface PatientOnboardingInput {
  fullName: string;
  phone?: string;
  gender: 'male' | 'female';
  birthDate: string;
  heightCm: number;
  weightKg: number;
  waistCm?: number;
  hipCm?: number;
  neckCm?: number;
  targetGoal: string;
  activityLevel: string;
  trainingDays?: number;
  allergies?: string;
  dislikedFoods?: string;
  medicalNotes?: string;
}

export async function savePatientOnboardingAction(input: PatientOnboardingInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Debes iniciar sesión para completar tu onboarding' };
  }

  // 1. Actualizar datos en profiles (nombre, teléfono)
  await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim(),
      phone: input.phone ? input.phone.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  // 2. Estimar % de grasa corporal si envió medidas
  let estimatedFatPct: number | null = null;
  if (input.waistCm && input.neckCm) {
    const navy = calculateNavyBodyFat(input.weightKg, {
      gender: input.gender,
      heightCm: input.heightCm,
      neckCm: input.neckCm,
      waistCm: input.waistCm,
      hipCm: input.hipCm || (input.gender === 'female' ? input.waistCm * 1.25 : input.waistCm),
    });
    estimatedFatPct = navy.bodyFatPercentage;
  }

  // 3. Estructurar notas clínicas completas
  const clinicalPayload = {
    waistCm: input.waistCm || null,
    hipCm: input.hipCm || null,
    neckCm: input.neckCm || null,
    trainingDays: input.trainingDays || null,
    allergies: input.allergies || 'Ninguna reportada',
    dislikedFoods: input.dislikedFoods || 'Ninguno',
    medicalNotes: input.medicalNotes || 'Sin observaciones médicas',
    estimatedFatPct,
    onboardingCompletedAt: new Date().toISOString(),
  };

  const formattedNotes = [
    `Medidas Iniciales: Cintura ${input.waistCm ? input.waistCm + 'cm' : 'N/A'}, Cadera ${input.hipCm ? input.hipCm + 'cm' : 'N/A'}, Cuello ${input.neckCm ? input.neckCm + 'cm' : 'N/A'}.`,
    `Días de entreno: ${input.trainingDays || 'N/A'} días/semana.`,
    `Alergias / Intolerancias: ${input.allergies || 'Ninguna'}.`,
    `Alimentos rechazados: ${input.dislikedFoods || 'Ninguno'}.`,
    `Antecedentes/Notas: ${input.medicalNotes || 'Sin observaciones'}.`,
    `CLINICAL_JSON:${JSON.stringify(clinicalPayload)}`,
  ].join('\n');

  // 4. Guardar o actualizar patient_profiles
  const { data: patientProfile, error: profileError } = await supabase
    .from('patient_profiles')
    .upsert(
      {
        user_id: user.id,
        gender: input.gender,
        birth_date: input.birthDate,
        height_cm: input.heightCm,
        initial_weight_kg: input.weightKg,
        current_weight_kg: input.weightKg,
        target_goal: input.targetGoal,
        activity_level: input.activityLevel,
        body_fat_percentage: estimatedFatPct,
        allergies_or_notes: formattedNotes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('id')
    .single();

  if (profileError || !patientProfile) {
    return { error: profileError?.message || 'Error al guardar expediente clínico' };
  }

  // 5. Crear check-in basal inicial en weekly_checkins
  await supabase.from('weekly_checkins').upsert(
    {
      patient_id: patientProfile.id,
      checkin_date: new Date().toISOString().split('T')[0],
      weight_kg: input.weightKg,
      waist_cm: input.waistCm || null,
      hip_cm: input.hipCm || null,
      neck_cm: input.neckCm || null,
      adherence_score: 10,
      energy_level: 'Excelente (Línea Base)',
      notes: 'Registro antropométrico inicial de onboarding',
    },
    { onConflict: 'patient_id,checkin_date' }
  );

  revalidatePath('/portal/plan');
  revalidatePath('/portal/onboarding');
  revalidatePath('/admin/patients');
  revalidatePath(`/admin/patients/${patientProfile.id}`);
  revalidatePath('/admin/calculator');

  return { success: true };
}
