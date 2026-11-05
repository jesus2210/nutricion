// LAYER: Application / Interface
// Server Actions para Gestión de Rutinas de Entrenamiento y Registro de Sesiones (Pesos, Reps y RIR)
'use server';

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { revalidatePath } from 'next/cache';
import { WorkoutDay, LoggedExercise, WorkoutPlan, WorkoutLogEntry } from '@/domain/entities/workout';

export interface SaveWorkoutPlanInput {
  patientId: string;
  title: string;
  goal: string;
  days: WorkoutDay[];
  notes?: string;
}

export interface SaveWorkoutLogInput {
  patientId?: string; // Opcional si lo llama el propio paciente desde su portal
  workoutPlanId?: string | null;
  logDate: string;
  dayId: string;
  dayName: string;
  exercises: LoggedExercise[];
  durationMinutes?: number;
  notes?: string;
}

function parseClinicalJsonFromNotes(rawNotes: string | null | undefined): {
  prefixText: string;
  clinicalData: Record<string, any>;
} {
  if (!rawNotes) {
    return { prefixText: '', clinicalData: {} };
  }
  const match = String(rawNotes).match(/CLINICAL_JSON:(.+)$/m);
  let clinicalData: Record<string, any> = {};
  if (match && match[1]) {
    try {
      clinicalData = JSON.parse(match[1]);
    } catch {
      clinicalData = {};
    }
  }
  const prefixText = String(rawNotes).replace(/CLINICAL_JSON:.+$/m, '').trim();
  return { prefixText, clinicalData };
}

function serializeClinicalJsonToNotes(prefixText: string, clinicalData: Record<string, any>): string {
  const cleanPrefix = prefixText.trim();
  return cleanPrefix
    ? `${cleanPrefix}\nCLINICAL_JSON:${JSON.stringify(clinicalData)}`
    : `CLINICAL_JSON:${JSON.stringify(clinicalData)}`;
}

/**
 * Obtiene la rutina activa y el historial de entrenamientos de un paciente
 * (Soporta tablas nativas workout_plans / workout_logs y respaldo automático en CLINICAL_JSON)
 */
export async function getPatientWorkoutData(patientId: string): Promise<{
  activePlan: WorkoutPlan | null;
  logs: WorkoutLogEntry[];
}> {
  const supabase = await createServerSupabaseClient();

  let activePlan: WorkoutPlan | null = null;
  let logs: WorkoutLogEntry[] = [];

  // 1. Intentar consultar tabla nativa workout_plans
  const { data: dbPlan, error: planErr } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_current', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!planErr && dbPlan) {
    activePlan = {
      id: dbPlan.id,
      patientId: dbPlan.patient_id,
      title: dbPlan.title,
      goal: dbPlan.goal,
      daysPerWeek: dbPlan.days_per_week || (dbPlan.days_config_json?.length ?? 4),
      days: Array.isArray(dbPlan.days_config_json) ? dbPlan.days_config_json : [],
      notes: dbPlan.notes,
      isCurrent: dbPlan.is_current,
      createdAt: dbPlan.created_at,
    };
  }

  // 2. Intentar consultar tabla nativa workout_logs
  const { data: dbLogs, error: logsErr } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('patient_id', patientId)
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60);

  if (!logsErr && dbLogs && dbLogs.length > 0) {
    logs = dbLogs.map((row: any) => ({
      id: row.id,
      patientId: row.patient_id,
      workoutPlanId: row.workout_plan_id,
      logDate: row.log_date,
      dayId: row.day_id,
      dayName: row.day_name,
      exercises: Array.isArray(row.exercises_logged_json) ? row.exercises_logged_json : [],
      durationMinutes: row.duration_minutes,
      notes: row.notes,
      createdAt: row.created_at,
    }));
  }

  // 3. Consultar respaldo en patient_profiles por si aún no se han creado las tablas SQL nuevas
  if (!activePlan || logs.length === 0) {
    const { data: patientRow } = await supabase
      .from('patient_profiles')
      .select('allergies_or_notes')
      .eq('id', patientId)
      .maybeSingle();

    if (patientRow?.allergies_or_notes) {
      const { clinicalData } = parseClinicalJsonFromNotes(patientRow.allergies_or_notes);
      if (!activePlan && clinicalData.workoutPlan) {
        activePlan = clinicalData.workoutPlan;
      }
      if (logs.length === 0 && Array.isArray(clinicalData.workoutLogs)) {
        logs = clinicalData.workoutLogs;
      }
    }
  }

  return { activePlan, logs };
}

/**
 * Guarda y asigna una rutina de entrenamiento completa a un paciente
 */
export async function saveWorkoutPlanAction(input: SaveWorkoutPlanInput) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'No autorizado. Inicia sesión como administrador.' };
    }

    if (!input.patientId) {
      return { error: 'Selecciona un paciente para asignarle la rutina.' };
    }

    const planObject: WorkoutPlan = {
      id: crypto.randomUUID(),
      patientId: input.patientId,
      title: input.title.trim() || 'Rutina de Entrenamiento Personalizada',
      goal: input.goal.trim() || 'Hipertrofia & Fuerza',
      daysPerWeek: input.days.length,
      days: input.days,
      notes: input.notes?.trim() || null,
      isCurrent: true,
      createdAt: new Date().toISOString(),
    };

    // 1. Intentar guardar en tabla nativa workout_plans
    await supabase
      .from('workout_plans')
      .update({ is_current: false })
      .eq('patient_id', input.patientId)
      .eq('is_current', true);

    const { data: insertedPlan, error: tableError } = await supabase
      .from('workout_plans')
      .insert({
        patient_id: input.patientId,
        created_by: user.id,
        title: planObject.title,
        goal: planObject.goal,
        days_per_week: planObject.daysPerWeek,
        days_config_json: planObject.days,
        notes: planObject.notes,
        is_current: true,
      })
      .select('id')
      .maybeSingle();

    if (!tableError && insertedPlan?.id) {
      planObject.id = insertedPlan.id;
    }

    // 2. Sincronizar también en CLINICAL_JSON de patient_profiles (garantiza disponibilidad inmediata)
    const { data: patientRow } = await supabase
      .from('patient_profiles')
      .select('allergies_or_notes')
      .eq('id', input.patientId)
      .maybeSingle();

    const { prefixText, clinicalData } = parseClinicalJsonFromNotes(patientRow?.allergies_or_notes);
    clinicalData.workoutPlan = planObject;

    const updatedNotes = serializeClinicalJsonToNotes(prefixText, clinicalData);
    await supabase
      .from('patient_profiles')
      .update({
        allergies_or_notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.patientId);

    revalidatePath('/admin/workouts');
    revalidatePath(`/admin/patients/${input.patientId}`);
    revalidatePath('/portal/workout');
    revalidatePath('/portal/plan');

    return { success: true, plan: planObject };
  } catch (err: any) {
    return { error: err?.message || 'Error al guardar la rutina de entrenamiento' };
  }
}

/**
 * Registra una sesión de entrenamiento completada (con series, kilos, repeticiones y RIR)
 * Puede ser invocada por el Paciente desde su portal o por el Admin desde su panel
 */
export async function saveWorkoutLogAction(input: SaveWorkoutLogInput) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Debes iniciar sesión para guardar tu entrenamiento.' };
    }

    let targetPatientId = input.patientId;

    // Si no se especificó patientId, buscar el expediente del usuario autenticado (Portal del Paciente)
    if (!targetPatientId) {
      const { data: myPatientProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!myPatientProfile) {
        return { error: 'No se encontró tu expediente de paciente.' };
      }
      targetPatientId = myPatientProfile.id;
    }

    if (!targetPatientId) {
      return { error: 'No se pudo identificar el expediente del paciente.' };
    }

    const logEntry: WorkoutLogEntry = {
      id: crypto.randomUUID(),
      patientId: targetPatientId,
      workoutPlanId: input.workoutPlanId || null,
      logDate: input.logDate || new Date().toISOString().split('T')[0],
      dayId: input.dayId,
      dayName: input.dayName,
      exercises: input.exercises,
      durationMinutes: input.durationMinutes || null,
      notes: input.notes?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    // 1. Intentar insertar en la tabla nativa workout_logs
    const { data: insertedLog, error: logTableError } = await supabase
      .from('workout_logs')
      .insert({
        patient_id: targetPatientId,
        workout_plan_id: input.workoutPlanId || null,
        log_date: logEntry.logDate,
        day_id: logEntry.dayId,
        day_name: logEntry.dayName,
        exercises_logged_json: logEntry.exercises,
        duration_minutes: logEntry.durationMinutes,
        notes: logEntry.notes,
      })
      .select('id')
      .maybeSingle();

    if (!logTableError && insertedLog?.id) {
      logEntry.id = insertedLog.id;
    }

    // 2. Sincronizar también en CLINICAL_JSON de patient_profiles (respaldo automático)
    const { data: patientRow } = await supabase
      .from('patient_profiles')
      .select('allergies_or_notes')
      .eq('id', targetPatientId)
      .maybeSingle();

    const { prefixText, clinicalData } = parseClinicalJsonFromNotes(patientRow?.allergies_or_notes);
    const existingLogs: WorkoutLogEntry[] = Array.isArray(clinicalData.workoutLogs)
      ? clinicalData.workoutLogs
      : [];

    // Mantener los últimos 50 registros en el JSON de respaldo
    clinicalData.workoutLogs = [logEntry, ...existingLogs].slice(0, 50);

    const updatedNotes = serializeClinicalJsonToNotes(prefixText, clinicalData);
    await supabase
      .from('patient_profiles')
      .update({
        allergies_or_notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetPatientId);

    revalidatePath('/portal/workout');
    revalidatePath('/admin/workouts');
    revalidatePath(`/admin/patients/${targetPatientId}`);

    return { success: true, log: logEntry };
  } catch (err: any) {
    return { error: err?.message || 'Error al registrar el entrenamiento' };
  }
}
