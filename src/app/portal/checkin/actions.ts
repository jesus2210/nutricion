// LAYER: Interface
// Server Action para registrar check-in semanal de paciente y fotos
'use server';

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const checkinSchema = z.object({
  weightKg: z.coerce.number().min(30).max(300),
  waistCm: z.coerce.number().optional(),
  hipCm: z.coerce.number().optional(),
  thighCm: z.coerce.number().optional(),
  armCm: z.coerce.number().optional(),
  neckCm: z.coerce.number().optional(),
  adherenceScore: z.coerce.number().min(1).max(10),
  hungerLevel: z.enum(['bajo', 'medio', 'alto']).optional(),
  energyLevel: z.enum(['bajo', 'medio', 'alto']).optional(),
  sleepQuality: z.enum(['mala', 'regular', 'buena']).optional(),
  notes: z.string().optional(),
});

export async function submitCheckinAction(formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado o sesión expirada' };

    // Obtener patient_id
    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id, gender, height_cm')
      .eq('user_id', user.id)
      .maybeSingle();

    if (patientError || !patient) {
      return { error: 'No se encontró tu expediente clínico de paciente. Por favor completa tu onboarding.' };
    }

    const rawData = {
      weightKg: formData.get('weightKg'),
      waistCm: formData.get('waistCm') || undefined,
      hipCm: formData.get('hipCm') || undefined,
      thighCm: formData.get('thighCm') || undefined,
      armCm: formData.get('armCm') || undefined,
      neckCm: formData.get('neckCm') || undefined,
      adherenceScore: formData.get('adherenceScore') || 10,
      hungerLevel: formData.get('hungerLevel') || undefined,
      energyLevel: formData.get('energyLevel') || undefined,
      sleepQuality: formData.get('sleepQuality') || undefined,
      notes: formData.get('notes') || undefined,
    };

    const validation = checkinSchema.safeParse(rawData);
    if (!validation.success) {
      return { error: validation.error.issues[0]?.message || 'Datos de formulario inválidos' };
    }

    const v = validation.data;

    // 1. Guardar registro en weekly_checkins
    const { data: checkin, error: checkinError } = await supabase
      .from('weekly_checkins')
      .insert({
        patient_id: patient.id,
        checkin_date: new Date().toISOString().split('T')[0],
        weight_kg: v.weightKg,
        waist_cm: v.waistCm || null,
        hip_cm: v.hipCm || null,
        thigh_cm: v.thighCm || null,
        arm_cm: v.armCm || null,
        neck_cm: v.neckCm || null,
        adherence_score: v.adherenceScore,
        hunger_level: v.hungerLevel || null,
        energy_level: v.energyLevel || null,
        sleep_quality: v.sleepQuality || null,
        notes: v.notes || null,
      })
      .select('id')
      .single();

    if (checkinError || !checkin) {
      return { error: `Error al registrar mediciones: ${checkinError?.message || 'Error en base de datos'}` };
    }

    // 2. Actualizar peso actual y % de grasa en patient_profiles
    try {
      const { calculateNavyBodyFat } = await import('@/domain/formulas/body-composition');
      let newFatPct: number | null = null;
      if (v.waistCm && v.neckCm) {
        const navy = calculateNavyBodyFat(v.weightKg, {
          gender: (patient.gender as any) || 'female',
          heightCm: Number(patient.height_cm) || 165,
          neckCm: v.neckCm,
          waistCm: v.waistCm,
          hipCm: v.hipCm || (patient.gender === 'female' ? v.waistCm * 1.25 : v.waistCm),
        });
        newFatPct = navy.bodyFatPercentage;
      }

      await supabase
        .from('patient_profiles')
        .update({
          current_weight_kg: v.weightKg,
          ...(newFatPct ? { body_fat_percentage: newFatPct } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', patient.id);
    } catch (e) {
      console.error('Error calculando composición corporal:', e);
    }

    // 3. Procesar fotos si fueron adjuntadas
    const photoKeys = ['front', 'side', 'back'] as const;
    for (const pType of photoKeys) {
      try {
        const file = formData.get(`photo_${pType}`) as File | null;
        if (file && file.size > 0) {
          const ext = file.type === 'image/webp' ? 'webp' : 'jpg';
          const path = `${user.id}/${checkin.id}_${pType}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('patient-photos')
            .upload(path, file, { contentType: file.type, upsert: true });

          if (!uploadError) {
            await supabase.from('checkin_photos').insert({
              checkin_id: checkin.id,
              photo_type: pType,
              storage_path: path,
            });
          } else {
            console.error(`Error subiendo foto ${pType}:`, uploadError.message);
          }
        }
      } catch (photoErr) {
        console.error(`Error procesando foto ${pType}:`, photoErr);
      }
    }

    try {
      revalidatePath('/portal/progress');
      revalidatePath('/portal/checkin');
      revalidatePath('/portal/plan');
      revalidatePath('/admin/patients');
      revalidatePath(`/admin/patients/${patient.id}`);
      revalidatePath('/admin/calculator');
    } catch (revErr) {
      console.error('Error revalidando caché:', revErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error en submitCheckinAction:', err);
    return { error: err?.message || 'Ocurrió un error inesperado al procesar el reporte' };
  }
}
