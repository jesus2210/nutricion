// LAYER: Interface
// Página de Registro Diario de Ingestas del Paciente

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import DailyLogClient from './DailyLogClient';
import { Utensils } from 'lucide-react';

export default async function PatientLogPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: patient } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!patient) return null;

  // Obtener plan activo para conocer porciones meta
  const { data: activePlan } = await supabase
    .from('diet_plans')
    .select('portions_json')
    .eq('patient_id', patient.id)
    .eq('is_current', true)
    .maybeSingle();

  const todayStr = new Date().toISOString().split('T')[0];

  // Obtener registro de hoy si existe
  const { data: todayLog } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('patient_id', patient.id)
    .eq('log_date', todayStr)
    .maybeSingle();

  const targetPortions = activePlan?.portions_json || {
    starch: 9,
    protein: 9,
    fat: 11,
    fruit: 2,
    dairy: 1,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
          Registro Diario de Ingestas
        </h1>
        <p className="text-xs text-[#94a3b8]">
          Marca las porciones consumidas en el día para asegurar tu adherencia al plan asignado
        </p>
      </div>

      <DailyLogClient
        targetPortions={targetPortions}
        initialLogDate={todayStr}
        initialConsumed={todayLog?.portions_consumed}
        initialWater={todayLog?.water_liters ? Number(todayLog.water_liters) : 2.5}
      />
    </div>
  );
}
