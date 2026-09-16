// LAYER: Interface
// Server Action para guardar y asignar planes nutricionales a un paciente
'use server';

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { revalidatePath } from 'next/cache';
import { DailyPortions, MealDistribution } from '@/domain/entities/diet-plan';
import { calculateMacros } from '@/domain/formulas/macro-calculator';

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
  email: string;
  gender: 'male' | 'female';
  birthDate: string;
  heightCm: number;
  initialWeightKg: number;
  targetGoal: string;
  activityLevel: string;
  notes?: string;
}

export async function createPatientByAdminAction(input: CreatePatientInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  // 1. Crear usuario en Supabase Auth mediante cliente sin persistencia de sesión
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

  const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const tempPassword = 'P' + Math.random().toString(36).slice(2, 10) + '!9';

  const { data: authData, error: authError } = await tempClient.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: tempPassword,
    options: {
      data: {
        full_name: input.fullName.trim(),
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
    return { error: authError.message || 'Error al crear el usuario del paciente' };
  }

  if (newUserId) {
    // 2. Insertar en profiles
    await supabase.from('profiles').upsert(
      {
        id: newUserId,
        email: input.email.trim().toLowerCase(),
        full_name: input.fullName.trim(),
        role: 'patient',
      },
      { onConflict: 'id' }
    );

    // 3. Insertar en patient_profiles
    const { data: patientProfile, error: profileError } = await supabase
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
          allergies_or_notes: input.notes || null,
        },
        { onConflict: 'user_id' }
      )
      .select('id, initial_weight_kg, gender, birth_date, height_cm, target_goal, activity_level, profiles(full_name)')
      .single();

    if (profileError || !patientProfile) {
      return { error: profileError?.message || 'Error al crear expediente' };
    }

    revalidatePath('/admin/patients');
    revalidatePath('/admin/calculator');

    return {
      success: true,
      patient: {
        id: patientProfile.id,
        fullName: input.fullName,
        weightKg: Number(patientProfile.initial_weight_kg),
        initialWeightKg: Number(patientProfile.initial_weight_kg),
        gender: patientProfile.gender,
        birthDate: patientProfile.birth_date,
        heightCm: Number(patientProfile.height_cm),
        targetGoal: patientProfile.target_goal,
        activityLevel: patientProfile.activity_level,
      },
    };
  }

  return { error: 'No se pudo generar el identificador del paciente' };
}

