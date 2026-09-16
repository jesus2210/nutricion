// LAYER: Interface
// Server Actions para Autenticación (Login, Registro de Pacientes, Logout)
'use server';

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, 'El nombre completo es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  gender: z.enum(['male', 'female']),
  birthDate: z.string().min(10, 'Fecha de nacimiento requerida'),
  heightCm: z.coerce.number().min(100).max(250),
  initialWeightKg: z.coerce.number().min(30).max(300),
  targetGoal: z.enum(['Deficit', 'Superavit', 'Recomposicion', 'Mantenimiento']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'intense', 'very_intense']),
  notes: z.string().optional(),
});

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const validation = signInSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: error?.message || 'Credenciales incorrectas' };
  }

  // Obtener rol del perfil
  let { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  // Si el perfil no existe en la base de datos, crearlo a partir de la metadata
  if (!profile) {
    const meta = data.user.user_metadata || {};
    const role = (meta.role === 'admin' || email === 'admin@contrerasnutricion.com') ? 'admin' : 'patient';

    await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        email: data.user.email || email,
        full_name: meta.full_name || 'Usuario',
        role,
      },
      { onConflict: 'id' }
    );

    if (role === 'patient') {
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

    profile = { role };
  }

  if (profile?.role === 'admin') {
    return { success: true, redirect: '/admin/dashboard' };
  } else {
    return { success: true, redirect: '/portal/plan' };
  }
}

export async function signUpPatientAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validation = signUpSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const values = validation.data;
  const supabase = await createServerSupabaseClient();

  // 1. Crear usuario en Supabase Auth con toda la metadata del paciente
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        full_name: values.fullName,
        gender: values.gender,
        birth_date: values.birthDate,
        height_cm: values.heightCm,
        initial_weight_kg: values.initialWeightKg,
        target_goal: values.targetGoal,
        activity_level: values.activityLevel,
        allergies_or_notes: values.notes || null,
      },
    },
  });

  if (authError && !authData?.user) {
    return { error: authError.message || 'Error al registrar la cuenta' };
  }

  // Si el usuario ya existía de un intento anterior
  if (authData?.user?.identities && authData.user.identities.length === 0) {
    return {
      error:
        'Este correo ya fue registrado anteriormente. Por favor ingresa desde la pantalla de Iniciar Sesión con tu contraseña.',
    };
  }

  let userId = authData?.user?.id;

  // 2. Intentar iniciar sesión para activar cookies (funciona directo si Confirm Email está desactivado)
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });

  if (signInData?.user) {
    userId = signInData.user.id;
    // Crear o actualizar registro en profiles
    await supabase.from('profiles').upsert(
      {
        id: userId,
        email: values.email,
        full_name: values.fullName,
        role: 'patient',
      },
      { onConflict: 'id' }
    );

    // Crear o actualizar registro en patient_profiles
    await supabase.from('patient_profiles').upsert(
      {
        user_id: userId,
        gender: values.gender,
        birth_date: values.birthDate,
        height_cm: values.heightCm,
        initial_weight_kg: values.initialWeightKg,
        current_weight_kg: values.initialWeightKg,
        target_goal: values.targetGoal,
        activity_level: values.activityLevel,
        allergies_or_notes: values.notes || null,
      },
      { onConflict: 'user_id' }
    );

    return { success: true, redirect: '/portal/onboarding' };
  }

  // Si no se inició sesión porque requiere confirmación de correo
  if (signInError && signInError.message.toLowerCase().includes('email not confirmed')) {
    return {
      success: true,
      needsEmailConfirmation: true,
      email: values.email,
      message:
        '¡Tu cuenta ha sido creada con éxito! Hemos enviado un correo de verificación. Por favor revisa tu bandeja de entrada (y la carpeta de spam) y pulsa en el botón para confirmar tu correo y acceder.',
    };
  }

  return { success: true, redirect: '/portal/plan' };
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}
