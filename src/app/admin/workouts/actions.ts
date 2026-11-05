// LAYER: Application / Interface
// Server Actions para Gestión de Rutinas de Entrenamiento y Registro de Sesiones (Pesos, Reps y RIR)
'use server';

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  WorkoutDay,
  LoggedExercise,
  WorkoutPlan,
  WorkoutLogEntry,
  ExerciseCatalogItem,
  WORKOUT_TEMPLATES,
  WorkoutTemplate,
  MuscleGroup,
  TrainingLevel,
} from '@/domain/entities/workout';

export interface SaveWorkoutPlanInput {
  patientId: string;
  title: string;
  goal: string;
  level?: TrainingLevel;
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

export interface CreateCatalogExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  defaultSets?: number;
  defaultReps?: string;
  defaultRir?: string;
  defaultRestSeconds?: number;
  tips?: string;
  videoUrl?: string;
}

/**
 * Obtiene el catálogo completo de ejercicios desde la tabla exercise_catalog en Supabase.
 * Si la tabla está vacía por primera vez, siembra automáticamente los ejercicios base en la BD.
 */
export async function getExerciseCatalog(): Promise<ExerciseCatalogItem[]> {
  const supabase = await createServerSupabaseClient();

  const { data: rows, error } = await supabase
    .from('exercise_catalog')
    .select('*')
    .neq('muscle_group', '__ROUTINE_TEMPLATE__')
    .order('is_custom', { ascending: false })
    .order('name', { ascending: true });

  if (!error && rows) {
    return rows.map(mapRowToCatalogItem);
  }

  return [];
}

function mapRowToCatalogItem(row: any): ExerciseCatalogItem {
  let rawTips = String(row.tips || '');
  let extractedVideoUrl = row.video_url || undefined;
  const videoMatch = rawTips.match(/VIDEO_URL:(.+)$/m);
  if (videoMatch && videoMatch[1]) {
    extractedVideoUrl = videoMatch[1].trim();
    rawTips = rawTips.replace(/VIDEO_URL:.+$/m, '').trim();
  }

  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group as MuscleGroup,
    equipment: row.equipment || 'Máquina',
    defaultSets: Number(row.default_sets) || 3,
    defaultReps: row.default_reps || '8-12',
    defaultRir: row.default_rir || 'RIR 1-2',
    defaultRestSeconds: Number(row.default_rest_seconds) || 90,
    tips: rawTips || undefined,
    videoUrl: extractedVideoUrl,
    isCustom: Boolean(row.is_custom),
  };
}

/**
 * Crea un nuevo ejercicio permanentemente en la tabla exercise_catalog de la Base de Datos
 */
export async function createExerciseInCatalogAction(input: CreateCatalogExerciseInput) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'No autorizado' };
    }

    const cleanName = input.name.trim();
    if (!cleanName) {
      return { error: 'El nombre del ejercicio es obligatorio' };
    }

    const slug = cleanName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newId = `custom-${slug}-${Date.now().toString(36)}`;

    const cleanTips = input.tips?.trim() || '';
    const cleanVideo = input.videoUrl?.trim() || '';
    const combinedTips = cleanVideo
      ? cleanTips
        ? `${cleanTips}\nVIDEO_URL:${cleanVideo}`
        : `VIDEO_URL:${cleanVideo}`
      : cleanTips || null;

    const payload = {
      id: newId,
      name: cleanName,
      muscle_group: input.muscleGroup,
      equipment: input.equipment.trim() || 'Máquina',
      default_sets: input.defaultSets || 3,
      default_reps: input.defaultReps?.trim() || '8-12',
      default_rir: input.defaultRir?.trim() || 'RIR 1-2',
      default_rest_seconds: input.defaultRestSeconds || 90,
      tips: combinedTips,
      is_custom: true,
      created_by: user.id,
    };

    const { data: inserted, error } = await supabase
      .from('exercise_catalog')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return {
        error: `No se pudo guardar en la tabla exercise_catalog (${error.message}). Asegúrate de ejecutar la query de exercise_catalog en Supabase.`,
      };
    }

    revalidatePath('/admin/workouts');

    return {
      success: true,
      exercise: mapRowToCatalogItem(inserted),
    };
  } catch (err: any) {
    return { error: err?.message || 'Error al guardar el ejercicio en la base de datos' };
  }
}

/**
 * Elimina un ejercicio del catálogo en la Base de Datos
 */
export async function deleteExerciseFromCatalogAction(exerciseId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'No autorizado' };
    }

    const { error } = await supabase
      .from('exercise_catalog')
      .delete()
      .eq('id', exerciseId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/workouts');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error al eliminar ejercicio' };
  }
}

/**
 * Guarda o actualiza el link de YouTube predeterminado de un ejercicio en exercise_catalog
 */
export async function updateExerciseVideoUrlInCatalogAction(
  exerciseId: string,
  videoUrl: string
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'No autorizado' };
    }

    const { data: existing } = await supabase
      .from('exercise_catalog')
      .select('tips')
      .eq('id', exerciseId)
      .maybeSingle();

    const rawTips = String(existing?.tips || '')
      .replace(/VIDEO_URL:.+$/m, '')
      .trim();
    const cleanVideo = videoUrl.trim();
    const updatedTips = cleanVideo
      ? rawTips
        ? `${rawTips}\nVIDEO_URL:${cleanVideo}`
        : `VIDEO_URL:${cleanVideo}`
      : rawTips || null;

    const { error } = await supabase
      .from('exercise_catalog')
      .update({ tips: updatedTips })
      .eq('id', exerciseId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/workouts');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error al actualizar video del ejercicio' };
  }
}

export interface SaveWorkoutTemplateInput {
  title: string;
  goal: string;
  description?: string;
  days: WorkoutDay[];
}

/**
 * Obtiene todas las plantillas de rutinas (las base + las guardadas por el nutricionista en BD)
 * Funciona de inmediato usando exercise_catalog (muscle_group = '__ROUTINE_TEMPLATE__') y/o workout_templates
 */
export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const supabase = await createServerSupabaseClient();
  const customTemplates: WorkoutTemplate[] = [];

  // 1. Intentar leer desde tabla dedicada workout_templates (si existe)
  const { data: dedicatedRows, error: dedErr } = await supabase
    .from('workout_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (!dedErr && dedicatedRows && dedicatedRows.length > 0) {
    for (const row of dedicatedRows) {
      customTemplates.push({
        id: row.id,
        title: row.title,
        goal: row.goal || 'Hipertrofia & Fuerza',
        description: row.description || `${Array.isArray(row.days_config_json) ? row.days_config_json.length : 0} días`,
        days: Array.isArray(row.days_config_json) ? row.days_config_json : [],
        isCustom: true,
        createdAt: row.created_at,
      });
    }
  }

  // 2. Leer también desde exercise_catalog donde muscle_group = '__ROUTINE_TEMPLATE__' (respaldo sin requerir nueva tabla)
  const { data: catRows, error: catErr } = await supabase
    .from('exercise_catalog')
    .select('*')
    .eq('muscle_group', '__ROUTINE_TEMPLATE__')
    .order('created_at', { ascending: false });

  if (!catErr && catRows && catRows.length > 0) {
    const existingIds = new Set(customTemplates.map((t) => t.id));
    for (const row of catRows) {
      if (existingIds.has(row.id)) continue;
      try {
        const parsed = JSON.parse(row.tips || '{}');
        if (Array.isArray(parsed.days)) {
          customTemplates.push({
            id: row.id,
            title: row.name,
            goal: row.equipment || parsed.goal || 'Hipertrofia & Fuerza',
            description: parsed.description || `${parsed.days.length} días`,
            days: parsed.days,
            isCustom: true,
            createdAt: row.created_at,
          });
        }
      } catch {
        // Ignorar fila malformada
      }
    }
  }

  return [...customTemplates, ...WORKOUT_TEMPLATES];
}

/**
 * Guarda una rutina completa como Plantilla Reutilizable en la Base de Datos
 * para poder asignarla después a cualquier otro paciente con 1 clic
 */
export async function saveWorkoutTemplateAction(input: SaveWorkoutTemplateInput) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'No autorizado. Inicia sesión como administrador.' };
    }

    const cleanTitle = input.title.trim();
    if (!cleanTitle) {
      return { error: 'Escribe un nombre para identificar tu rutina guardada.' };
    }

    if (!input.days || input.days.length === 0) {
      return { error: 'La rutina debe tener al menos 1 día configurado.' };
    }

    const tplId = `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const cleanGoal = input.goal.trim() || 'Hipertrofia & Fuerza';
    const cleanDesc =
      input.description?.trim() ||
      `${input.days.length} días • Guardada para reutilizar`;

    const newTemplate: WorkoutTemplate = {
      id: tplId,
      title: cleanTitle,
      goal: cleanGoal,
      description: cleanDesc,
      days: input.days,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    // 1. Intentar guardar en workout_templates (si la tabla existe)
    const { error: dedError } = await supabase.from('workout_templates').insert({
      id: tplId,
      title: cleanTitle,
      goal: cleanGoal,
      description: cleanDesc,
      days_config_json: input.days,
      created_by: user.id,
    });

    // 2. Guardar siempre también en exercise_catalog (funciona de inmediato sin requerir nueva query SQL)
    const { error: catError } = await supabase.from('exercise_catalog').upsert({
      id: tplId,
      name: cleanTitle,
      muscle_group: '__ROUTINE_TEMPLATE__',
      equipment: cleanGoal,
      default_sets: input.days.length,
      default_reps: `${input.days.length} días`,
      default_rir: 'RIR 1-2',
      default_rest_seconds: 90,
      tips: JSON.stringify({
        goal: cleanGoal,
        description: cleanDesc,
        days: input.days,
      }),
      is_custom: true,
      created_by: user.id,
    });

    if (dedError && catError) {
      return {
        error: `No se pudo guardar la plantilla en la base de datos: ${catError.message}`,
      };
    }

    revalidatePath('/admin/workouts');
    return { success: true, template: newTemplate };
  } catch (err: any) {
    return { error: err?.message || 'Error al guardar la plantilla de rutina' };
  }
}

/**
 * Elimina una plantilla de rutina guardada por el administrador
 */
export async function deleteWorkoutTemplateAction(templateId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'No autorizado' };
    }

    await supabase.from('workout_templates').delete().eq('id', templateId);
    const { error } = await supabase
      .from('exercise_catalog')
      .delete()
      .eq('id', templateId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/workouts');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error al eliminar la plantilla' };
  }
}
