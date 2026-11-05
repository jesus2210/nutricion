// LAYER: Interface
// Server Action para guardar y asignar planes nutricionales a un paciente
'use server';

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { revalidatePath } from 'next/cache';
import { DailyPortions, MealDistribution } from '@/domain/entities/diet-plan';
import { calculateMacros } from '@/domain/formulas/macro-calculator';
import { calculateNavyBodyFat } from '@/domain/formulas/body-composition';

export interface SaveDietPlanInput {
  patientId: string;
  title: string;
  goal: string;
  portions: DailyPortions;
  meals: MealDistribution[];
  notes?: string;
  weightKg: number;
}

export async function saveDietPlanAction(input: SaveDietPlanInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const macros = calculateMacros(input.portions, input.weightKg);

  // 1. Archivar planes anteriores del paciente
  await supabase
    .from('diet_plans')
    .update({ is_current: false, end_date: new Date().toISOString().split('T')[0] })
    .eq('patient_id', input.patientId)
    .eq('is_current', true);

  // 2. Insertar nuevo plan activo
  const { data, error } = await supabase
    .from('diet_plans')
    .insert({
      patient_id: input.patientId,
      created_by: user.id,
      title: input.title,
      goal: input.goal,
      target_calories: macros.totalCalories,
      target_protein_g: macros.totalProtein,
      target_fat_g: macros.totalFat,
      target_carbs_g: macros.totalCarbs,
      portions_json: input.portions,
      meals_config_json: input.meals,
      notes: input.notes || null,
      is_current: true,
      start_date: new Date().toISOString().split('T')[0],
    })
    .select('*')
    .single();

  if (error || !data) {
    return { error: error?.message || 'Error al guardar el plan' };
  }

  revalidatePath('/admin/patients');
  revalidatePath(`/admin/patients/${input.patientId}`);
  revalidatePath('/portal/plan');

  return { success: true, planId: data.id };
}

export interface CreatePatientInput {
  fullName: string;
  email?: string;
  phone?: string;
  gender: 'male' | 'female';
  birthDate: string;
  heightCm: number;
  initialWeightKg: number;
  targetGoal: string;
  activityLevel: string;
  waistCm?: number;
  hipCm?: number;
  neckCm?: number;
  bodyFatPercentage?: number;
  allergies?: string;
  dislikedFoods?: string;
  trainingDays?: number;
  notes?: string;
}

export async function createPatientByAdminAction(input: CreatePatientInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const cleanFullName = input.fullName.trim();
  const cleanEmail = input.email?.trim().toLowerCase() || '';
  const cleanPhone = input.phone?.trim() || '';

  if (!cleanFullName) {
    return { error: 'El nombre completo del paciente es requerido' };
  }

  // 1. Calcular % de grasa corporal si se suministraron circunferencias o porcentaje manual
  let estimatedFatPct: number | null = input.bodyFatPercentage ? Number(input.bodyFatPercentage) : null;
  if (!estimatedFatPct && input.waistCm && input.neckCm) {
    try {
      const navy = calculateNavyBodyFat(input.initialWeightKg, {
        gender: input.gender,
        heightCm: input.heightCm,
        neckCm: input.neckCm,
        waistCm: input.waistCm,
        hipCm: input.hipCm || (input.gender === 'female' ? input.waistCm * 1.25 : input.waistCm),
      });
      estimatedFatPct = navy.bodyFatPercentage;
    } catch {
      estimatedFatPct = null;
    }
  }

  // 2. Estructurar metadatos clínicos e identidad del paciente (incluyendo pacientes sin cuenta)
  const clinicalPayload = {
    fullName: cleanFullName,
    email: cleanEmail || null,
    phone: cleanPhone || null,
    isManualPatient: true,
    waistCm: input.waistCm || null,
    hipCm: input.hipCm || null,
    neckCm: input.neckCm || null,
    trainingDays: input.trainingDays || null,
    allergies: input.allergies?.trim() || 'Ninguna reportada',
    dislikedFoods: input.dislikedFoods?.trim() || 'Ninguno',
    medicalNotes: input.notes?.trim() || 'Paciente registrado directamente por el nutricionista (sin cuenta)',
    estimatedFatPct,
    onboardingCompletedAt: new Date().toISOString(),
  };

  const formattedNotes = [
    `Registro Clínico Directo (Nutricionista): ${cleanFullName}${cleanPhone ? ` • Tel: ${cleanPhone}` : ''}${cleanEmail ? ` • Email: ${cleanEmail}` : ' • Sin cuenta de correo'}.`,
    `Medidas Iniciales: Cintura ${input.waistCm ? input.waistCm + 'cm' : 'N/A'}, Cadera ${input.hipCm ? input.hipCm + 'cm' : 'N/A'}, Cuello ${input.neckCm ? input.neckCm + 'cm' : 'N/A'}.`,
    `Alergias / Intolerancias: ${input.allergies?.trim() || 'Ninguna'}.`,
    `Observaciones: ${input.notes?.trim() || 'Sin observaciones adicionales'}.`,
    `CLINICAL_JSON:${JSON.stringify(clinicalPayload)}`,
  ].join('\n');

  let createdPatientProfile: any = null;
  let lastErrorMsg = '';

  // INTENTO 1: Insertar directamente en profiles y patient_profiles sin usar Supabase Auth
  const directProfileId = crypto.randomUUID();
  const { error: directProfileError } = await supabase.from('profiles').insert({
    id: directProfileId,
    email: cleanEmail || 'sin-correo@paciente.local',
    full_name: cleanFullName,
    phone: cleanPhone || null,
    role: 'patient',
  });

  if (!directProfileError) {
    const { data: ppData, error: ppError } = await supabase
      .from('patient_profiles')
      .insert({
        user_id: directProfileId,
        gender: input.gender,
        birth_date: input.birthDate,
        height_cm: input.heightCm,
        initial_weight_kg: input.initialWeightKg,
        current_weight_kg: input.initialWeightKg,
        target_goal: input.targetGoal,
        activity_level: input.activityLevel,
        body_fat_percentage: estimatedFatPct,
        allergies_or_notes: formattedNotes,
      })
      .select('id, initial_weight_kg, gender, birth_date, height_cm, target_goal, activity_level')
      .single();

    if (!ppError && ppData) {
      createdPatientProfile = ppData;
    } else if (ppError) {
      lastErrorMsg = ppError.message;
    }
  }

  // INTENTO 2: Si profiles tiene FK estricta a auth.users, insertar en patient_profiles con user_id = null
  if (!createdPatientProfile) {
    const { data: nullUserData, error: nullUserError } = await supabase
      .from('patient_profiles')
      .insert({
        user_id: null as any,
        gender: input.gender,
        birth_date: input.birthDate,
        height_cm: input.heightCm,
        initial_weight_kg: input.initialWeightKg,
        current_weight_kg: input.initialWeightKg,
        target_goal: input.targetGoal,
        activity_level: input.activityLevel,
        body_fat_percentage: estimatedFatPct,
        allergies_or_notes: formattedNotes,
      })
      .select('id, initial_weight_kg, gender, birth_date, height_cm, target_goal, activity_level')
      .single();

    if (!nullUserError && nullUserData) {
      createdPatientProfile = nullUserData;
    } else if (nullUserError) {
      lastErrorMsg = nullUserError.message;
    }
  }

  // INTENTO 3 (Fallback de compatibilidad si la BD aún tiene user_id NOT NULL y FK a auth.users):
  // Crear identificador silencioso sin enviar correos reales al paciente
  if (!createdPatientProfile) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      '';

    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const internalEmail = `paciente.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@sin-correo.local`;
    const tempPassword = 'P' + Math.random().toString(36).slice(2, 10) + '!9A';

    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: internalEmail,
      password: tempPassword,
      options: {
        data: {
          full_name: cleanFullName,
          gender: input.gender,
          birth_date: input.birthDate,
          height_cm: input.heightCm,
          initial_weight_kg: input.initialWeightKg,
          target_goal: input.targetGoal,
          activity_level: input.activityLevel,
        },
      },
    });

    const newUserId = authData?.user?.id;
    if (authError && !newUserId) {
      return {
        error:
          authError.message ||
          lastErrorMsg ||
          'No se pudo registrar el paciente. Ejecuta el script schema.sql actualizado en Supabase.',
      };
    }

    if (newUserId) {
      const profilePayload = {
        id: newUserId,
        email: cleanEmail || internalEmail,
        full_name: cleanFullName,
        phone: cleanPhone || null,
        role: 'patient' as const,
      };

      // Intentar tanto con el cliente temporal (si hay sesión activa) como con el cliente admin
      if (authData?.session) {
        await tempClient.from('profiles').upsert(profilePayload, { onConflict: 'id' });
      }
      await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });

      const { data: fallbackPatient, error: fallbackError } = await supabase
        .from('patient_profiles')
        .upsert(
          {
            user_id: newUserId,
            gender: input.gender,
            birth_date: input.birthDate,
            height_cm: input.heightCm,
            initial_weight_kg: input.initialWeightKg,
            current_weight_kg: input.initialWeightKg,
            target_goal: input.targetGoal,
            activity_level: input.activityLevel,
            body_fat_percentage: estimatedFatPct,
            allergies_or_notes: formattedNotes,
          },
          { onConflict: 'user_id' }
        )
        .select('id, initial_weight_kg, gender, birth_date, height_cm, target_goal, activity_level')
        .single();

      if (fallbackError || !fallbackPatient) {
        return { error: fallbackError?.message || 'Error al crear expediente del paciente' };
      }

      createdPatientProfile = fallbackPatient;
    }
  }

  if (!createdPatientProfile) {
    return { error: lastErrorMsg || 'No se pudo generar el expediente del paciente' };
  }

  // 3. Crear check-in basal inicial para que el paciente ya tenga punto de partida en gráficas
  const todayStr = new Date().toISOString().split('T')[0];
  await supabase.from('weekly_checkins').upsert(
    {
      patient_id: createdPatientProfile.id,
      checkin_date: todayStr,
      weight_kg: input.initialWeightKg,
      waist_cm: input.waistCm || null,
      hip_cm: input.hipCm || null,
      neck_cm: input.neckCm || null,
      adherence_score: 10,
      energy_level: 'medio',
      hunger_level: 'bajo',
      sleep_quality: 'buena',
      notes: 'Medición basal inicial registrada por el nutricionista',
    },
    { onConflict: 'patient_id,checkin_date' }
  );

  revalidatePath('/admin/patients');
  revalidatePath(`/admin/patients/${createdPatientProfile.id}`);
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/calculator');

  return {
    success: true,
    patient: {
      id: createdPatientProfile.id,
      fullName: cleanFullName,
      email: cleanEmail || null,
      phone: cleanPhone || null,
      weightKg: Number(createdPatientProfile.initial_weight_kg),
      initialWeightKg: Number(createdPatientProfile.initial_weight_kg),
      gender: createdPatientProfile.gender,
      birthDate: createdPatientProfile.birth_date,
      heightCm: Number(createdPatientProfile.height_cm),
      targetGoal: createdPatientProfile.target_goal,
      activityLevel: createdPatientProfile.activity_level,
      bodyFatPercentage: estimatedFatPct,
      waistCm: input.waistCm || null,
      hipCm: input.hipCm || null,
      neckCm: input.neckCm || null,
    },
  };
}

