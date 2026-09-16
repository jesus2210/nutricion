// LAYER: Interface
// Route Handler para el intercambio de código de autenticación de Supabase (Email Confirmation / OAuth)

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/portal/onboarding';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      const meta = data.user.user_metadata || {};
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          email: data.user.email!,
          full_name: meta.full_name || 'Paciente',
          role: 'patient',
        },
        { onConflict: 'id' }
      );

      if (meta.birth_date || meta.initial_weight_kg) {
        await supabase.from('patient_profiles').upsert(
          {
            user_id: data.user.id,
            gender: meta.gender || 'female',
            birth_date: meta.birth_date || '1995-01-01',
            height_cm: Number(meta.height_cm) || 160,
            initial_weight_kg: Number(meta.initial_weight_kg) || 60,
            current_weight_kg: Number(meta.initial_weight_kg) || 60,
            target_goal: meta.target_goal || 'Recomposición',
            activity_level: meta.activity_level || 'moderate',
            allergies_or_notes: meta.allergies_or_notes || null,
          },
          { onConflict: 'user_id' }
        );
      }

      // Si el intercambio es exitoso, redirigir al portal
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si no hay código o hubo error, ir a login con aviso
  return NextResponse.redirect(`${origin}/login`);
}
