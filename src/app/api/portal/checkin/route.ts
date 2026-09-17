// LAYER: Interface
// Endpoint POST para registrar check-in semanal.
// Las fotos son subidas directamente al Storage de Supabase desde el cliente (browser),
// y este endpoint solo recibe los storage_path resultantes como texto (JSON).
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { z } from 'zod';
import { calculateNavyBodyFat } from '@/domain/formulas/body-composition';

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
  // Paths de fotos ya subidas al Storage desde el cliente (opcionales)
  photoFrontPath: z.string().optional(),
  photoSidePath: z.string().optional(),
  photoBackPath: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userAuthError } = await supabase.auth.getUser();

    if (userAuthError || !user) {
      return NextResponse.json({ error: 'No autorizado o sesión expirada' }, { status: 401 });
    }

    // Parsear JSON en lugar de multipart/form-data
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
    }

    // Obtener patient_id
    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id, gender, height_cm')
      .eq('user_id', user.id)
      .maybeSingle();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'No se encontró tu expediente clínico de paciente. Por favor completa tu onboarding.' },
        { status: 400 }
      );
    }

    const validation = checkinSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Datos de formulario inválidos' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: `Error al registrar mediciones: ${checkinError?.message || 'Error en base de datos'}` },
        { status: 500 }
      );
    }

    // 2. Actualizar peso actual y % de grasa en patient_profiles
    try {
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

    // 3. Registrar paths de fotos en checkin_photos (ya subidas al Storage desde el cliente)
    const photoPaths: Array<{ type: 'front' | 'side' | 'back'; path: string }> = [];
    if (v.photoFrontPath) photoPaths.push({ type: 'front', path: v.photoFrontPath });
    if (v.photoSidePath) photoPaths.push({ type: 'side', path: v.photoSidePath });
    if (v.photoBackPath) photoPaths.push({ type: 'back', path: v.photoBackPath });

    for (const photo of photoPaths) {
      try {
        await supabase.from('checkin_photos').insert({
          checkin_id: checkin.id,
          photo_type: photo.type,
          storage_path: photo.path,
        });
      } catch (photoErr) {
        console.error(`Error registrando foto ${photo.type}:`, photoErr);
      }
    }

    return NextResponse.json({ success: true, checkinId: checkin.id });
  } catch (err: any) {
    console.error('Error en /api/portal/checkin:', err);
    return NextResponse.json(
      { error: err?.message || 'Ocurrió un error inesperado al procesar el reporte' },
      { status: 500 }
    );
  }
}
