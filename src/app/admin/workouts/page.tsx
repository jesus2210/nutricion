// LAYER: Interface
// Página de Servidor: Constructor de Rutinas de Entrenamiento y Control de Cargas (Admin)

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { extractPatientIdentity } from '@/domain/entities/patient';
import { WorkoutPlan, WorkoutLogEntry } from '@/domain/entities/workout';
import WorkoutsAdminClient, { PatientWorkoutSummary } from './WorkoutsAdminClient';

export default async function AdminWorkoutsPage({
  searchParams,
}: {
  searchParams?: Promise<{ patientId?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const initialPatientId = params.patientId;
  const supabase = await createServerSupabaseClient();

  // 1. Obtener expedientes de pacientes
  const { data: rawPatients } = await supabase
    .from('patient_profiles')
    .select('*, profiles(full_name, email, phone)')
    .order('created_at', { ascending: false });

  // 2. Intentar obtener planes activos desde workout_plans
  const { data: rawWorkoutPlans } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('is_current', true);

  // 3. Intentar obtener historial de sesiones desde workout_logs
  const { data: rawWorkoutLogs } = await supabase
    .from('workout_logs')
    .select('*')
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false });

  const planMap = new Map<string, WorkoutPlan>();
  (rawWorkoutPlans || []).forEach((row: any) => {
    if (!planMap.has(row.patient_id)) {
      planMap.set(row.patient_id, {
        id: row.id,
        patientId: row.patient_id,
        title: row.title,
        goal: row.goal,
        daysPerWeek: row.days_per_week || (row.days_config_json?.length ?? 4),
        days: Array.isArray(row.days_config_json) ? row.days_config_json : [],
        notes: row.notes,
        isCurrent: row.is_current,
        createdAt: row.created_at,
      });
    }
  });

  const logsMap = new Map<string, WorkoutLogEntry[]>();
  (rawWorkoutLogs || []).forEach((row: any) => {
    const list = logsMap.get(row.patient_id) || [];
    list.push({
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
    });
    logsMap.set(row.patient_id, list);
  });

  const patients: PatientWorkoutSummary[] = (rawPatients || []).map((p: any) => {
    const identity = extractPatientIdentity(p);
    const clinicalData = identity.clinicalData || {};

    const activePlan = planMap.get(p.id) || clinicalData.workoutPlan || null;
    const logs =
      logsMap.get(p.id) ||
      (Array.isArray(clinicalData.workoutLogs) ? clinicalData.workoutLogs : []);

    return {
      id: p.id,
      fullName: identity.fullName,
      gender: p.gender || 'female',
      weightKg: Number(p.current_weight_kg || p.initial_weight_kg || 60),
      targetGoal: p.target_goal || 'Hipertrofia & Recomposición',
      activePlan,
      logs,
    };
  });

  return <WorkoutsAdminClient patients={patients} initialPatientId={initialPatientId} />;
}
