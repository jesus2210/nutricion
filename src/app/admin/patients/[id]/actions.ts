// LAYER: Interface / Application
// Server Actions para Gestión de Pacientes y Check-ins por el Administrador
'use server';

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { calculateNavyBodyFat } from '@/domain/formulas/body-composition';

const adminCheckinSchema = z.object({
  checkinDate: z.string().min(10, 'Fecha requerida'),
  weightKg: z.coerce.number().min(30).max(300),
  waistCm: z.coerce.number().optional(),
  hipCm: z.coerce.number().optional(),
  thighCm: z.coerce.number().optional(),
  armCm: z.coerce.number().optional(),
  neckCm: z.coerce.number().optional(),
  adherenceScore: z.coerce.number().min(1).max(10).default(10),
  hungerLevel: z.enum(['bajo', 'medio', 'alto']).optional(),
  energyLevel: z.enum(['bajo', 'medio', 'alto']).optional(),
  sleepQuality: z.enum(['mala', 'regular', 'buena']).optional(),
  notes: z.string().optional(),
});

export async function adminSubmitCheckinAction(patientId: string, formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'No autorizado. Debes iniciar sesión como administrador.' };
    }

    // 1. Verificar rol de administrador
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { error: 'Acceso denegado: sólo administradores pueden registrar check-ins en nombre de pacientes.' };
    }

    // 2. Obtener datos del paciente
    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id, user_id, gender, height_cm')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return { error: 'No se encontró el expediente del paciente.' };
    }

    const rawData = {
      checkinDate: formData.get('checkinDate') || new Date().toISOString().split('T')[0],
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

    const validation = adminCheckinSchema.safeParse(rawData);
    if (!validation.success) {
      return { error: validation.error.issues[0]?.message || 'Datos de formulario inválidos' };
    }

    const v = validation.data;

    // 3. Insertar o actualizar registro en weekly_checkins
    const { data: checkin, error: checkinError } = await supabase
      .from('weekly_checkins')
      .upsert(
        {
          patient_id: patient.id,
          checkin_date: v.checkinDate,
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
          notes: v.notes || 'Registrado por nutricionista/admin',
        },
        { onConflict: 'patient_id,checkin_date' }
      )
      .select('id')
      .single();

    if (checkinError || !checkin) {
      return { error: `Error al registrar reporte semanal: ${checkinError?.message || 'Error en BD'}` };
    }

    // 4. Actualizar peso actual y % de grasa en patient_profiles
    let newFatPct: number | null = null;
    if (v.waistCm && v.neckCm) {
      try {
        const navy = calculateNavyBodyFat(v.weightKg, {
          gender: (patient.gender as any) || 'female',
          heightCm: Number(patient.height_cm) || 165,
          neckCm: v.neckCm,
          waistCm: v.waistCm,
          hipCm: v.hipCm || (patient.gender === 'female' ? v.waistCm * 1.25 : v.waistCm),
        });
        newFatPct = navy.bodyFatPercentage;
      } catch (calcErr) {
        console.error('Error calculando Navy body fat:', calcErr);
      }
    }

    await supabase
      .from('patient_profiles')
      .update({
        current_weight_kg: v.weightKg,
        ...(newFatPct ? { body_fat_percentage: newFatPct } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', patient.id);

    // 5. Subir fotos si el admin las adjuntó
    const photoKeys = ['front', 'side', 'back'] as const;
    for (const pType of photoKeys) {
      try {
        const file = formData.get(`photo_${pType}`) as File | null;
        if (file && file.size > 0) {
          const ext = file.type === 'image/webp' ? 'webp' : 'jpg';
          const path = `${patient.user_id}/${checkin.id}_${pType}.${ext}`;

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

    revalidatePath(`/admin/patients/${patient.id}`);
    revalidatePath('/admin/patients');
    revalidatePath('/admin/dashboard');
    revalidatePath('/portal/progress');
    revalidatePath('/portal/plan');

    return { success: true };
  } catch (err: any) {
    console.error('Error en adminSubmitCheckinAction:', err);
    return { error: err?.message || 'Error al procesar el reporte' };
  }
}
