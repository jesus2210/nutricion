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
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: existingCheckin } = await supabase
    .from('weekly_checkins')
    .select('id')
    .eq('patient_id', patientProfile.id)
    .eq('checkin_date', todayStr)
    .maybeSingle();

  const basalPayload = {
    patient_id: patientProfile.id,
    checkin_date: todayStr,
    weight_kg: input.weightKg,
    waist_cm: input.waistCm || null,
    hip_cm: input.hipCm || null,
    neck_cm: input.neckCm || null,
    adherence_score: 10,
    energy_level: 'Excelente (Línea Base)',
    notes: 'Registro antropométrico inicial de onboarding',
  };

  if (existingCheckin?.id) {
    await supabase.from('weekly_checkins').update(basalPayload).eq('id', existingCheckin.id);
  } else {
    await supabase.from('weekly_checkins').insert(basalPayload);
  }

  revalidatePath('/portal/plan');
  revalidatePath('/portal/onboarding');
  revalidatePath('/admin/patients');
  revalidatePath(`/admin/patients/${patientProfile.id}`);
  revalidatePath('/admin/calculator');

  return { success: true };
}

export async function getPatientOnboardingDataAction() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 1. Obtener perfil básico
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle();

  // 2. Obtener expediente si ya existe
  const { data: patientProfile } = await supabase
    .from('patient_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  let clinicalData: any = {};
  if (patientProfile?.allergies_or_notes) {
    const match = patientProfile.allergies_or_notes.match(/CLINICAL_JSON:(.*)/);
    if (match && match[1]) {
      try {
        clinicalData = JSON.parse(match[1]);
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }

  return {
    fullName: profile?.full_name || user.user_metadata?.full_name || '',
    phone: profile?.phone || '',
    gender: (patientProfile?.gender || user.user_metadata?.gender || 'female') as 'male' | 'female',
    birthDate: patientProfile?.birth_date || user.user_metadata?.birth_date || '1998-06-15',
    heightCm: patientProfile?.height_cm ? Number(patientProfile.height_cm) : (user.user_metadata?.height_cm ? Number(user.user_metadata.height_cm) : 165),
    weightKg: patientProfile?.current_weight_kg ? Number(patientProfile.current_weight_kg) : (patientProfile?.initial_weight_kg ? Number(patientProfile.initial_weight_kg) : (user.user_metadata?.initial_weight_kg ? Number(user.user_metadata.initial_weight_kg) : 60)),
    waistCm: clinicalData.waistCm ? Number(clinicalData.waistCm) : undefined,
    hipCm: clinicalData.hipCm ? Number(clinicalData.hipCm) : undefined,
    neckCm: clinicalData.neckCm ? Number(clinicalData.neckCm) : undefined,
    targetGoal: patientProfile?.target_goal || user.user_metadata?.target_goal || 'Recomposición',
    activityLevel: patientProfile?.activity_level || user.user_metadata?.activity_level || 'moderate',
    trainingDays: clinicalData.trainingDays ? Number(clinicalData.trainingDays) : 4,
    allergies: clinicalData.allergies && clinicalData.allergies !== 'Ninguna reportada' ? clinicalData.allergies : '',
    dislikedFoods: clinicalData.dislikedFoods && clinicalData.dislikedFoods !== 'Ninguno' ? clinicalData.dislikedFoods : '',
    medicalNotes: clinicalData.medicalNotes && clinicalData.medicalNotes !== 'Sin observaciones médicas' ? clinicalData.medicalNotes : '',
    isCompleted: Boolean(clinicalData.onboardingCompletedAt || patientProfile?.body_fat_percentage),
  };
}
