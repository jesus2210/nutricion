// LAYER: Interface
// Página del Portal del Paciente: Mi Rutina y Registro de Entrenamiento (Pesos, Reps y RIR)

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { redirect } from 'next/navigation';
import { getPatientWorkoutData } from '@/app/admin/workouts/actions';
import WorkoutSessionTracker from '@/components/portal/WorkoutSessionTracker';
import { Dumbbell } from 'lucide-react';

export default async function PatientWorkoutPortalPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener expediente del paciente autenticado
  const { data: patientProfile } = await supabase
    .from('patient_profiles')
    .select('id, profiles(full_name)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!patientProfile) {
    redirect('/portal/onboarding');
  }

  const { activePlan, logs } = await getPatientWorkoutData(patientProfile.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-[#34d399]" />
            <h1 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
              Mi Rutina & Registro de Cargas
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Elige la sesión que te toca entrenar hoy y registra tus kilos, repeticiones y RIR serie por serie
          </p>
        </div>
      </div>

      <WorkoutSessionTracker
        patientId={patientProfile.id}
        activePlan={activePlan}
        initialLogs={logs}
        isAdminView={false}
      />
    </div>
  );
}

