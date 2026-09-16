// LAYER: Interface
// Server Action para guardar el registro diario de ingestas
'use server';

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { revalidatePath } from 'next/cache';
import { DailyPortions } from '@/domain/entities/diet-plan';

export async function saveDailyLogAction(
  logDate: string,
  portionsConsumed: DailyPortions,
  waterLiters: number,
  notes?: string
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado' };

  const { data: patient } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!patient) return { error: 'Expediente no encontrado' };

  const { error } = await supabase.from('daily_logs').upsert(
    {
      patient_id: patient.id,
      log_date: logDate,
      portions_consumed: portionsConsumed,
      water_liters: waterLiters,
      is_completed: true,
      notes: notes || null,
    },
    { onConflict: 'patient_id,log_date' }
  );

  if (error) {
    return { error: `Error al guardar registro: ${error.message}` };
  }

  revalidatePath('/portal/log');
  revalidatePath('/portal/progress');
  return { success: true };
}
