// LAYER: Interface
// Página de Servidor: Calculadora y Planes
import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import CalculatorClient from './CalculatorClient';

export default async function AdminCalculatorPage({
  searchParams,
}: {
  searchParams?: Promise<{ patientId?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const initialPatientId = params.patientId;
  const supabase = await createServerSupabaseClient();

  // 1. Obtener todos los perfiles de pacientes registrados
  const { data: allPatientUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'patient');

  // 2. Obtener expedientes existentes en patient_profiles
  let { data: rawPatients } = await supabase
    .from('patient_profiles')
    .select('id, user_id, initial_weight_kg, current_weight_kg, gender, birth_date, height_cm, target_goal, activity_level, body_fat_percentage, allergies_or_notes, profiles(full_name)')
    .order('created_at', { ascending: false });

  const existingUserIds = new Set((rawPatients || []).map((p: any) => p.user_id));
  const missingProfiles = (allPatientUsers || []).filter((u: any) => !existingUserIds.has(u.id));

  // 3. Sincronizar automáticamente cualquier usuario registrado que aún no tenga expediente
  if (missingProfiles.length > 0) {
    for (const p of missingProfiles) {
      await supabase.from('patient_profiles').upsert(
        {
          user_id: p.id,
          gender: 'female',
          birth_date: '1995-01-01',
          height_cm: 160,
          initial_weight_kg: 60,
          current_weight_kg: 60,
          target_goal: 'Recomposición',
          activity_level: 'moderate',
        },
        { onConflict: 'user_id' }
      );
    }

    const reQuery = await supabase
      .from('patient_profiles')
      .select('id, user_id, initial_weight_kg, current_weight_kg, gender, birth_date, height_cm, target_goal, activity_level, body_fat_percentage, allergies_or_notes, profiles(full_name)')
      .order('created_at', { ascending: false });

    if (reQuery.data) {
      rawPatients = reQuery.data;
    }
  }

  // 4. Obtener el último check-in registrado de cada paciente para tomar su peso y medidas más actualizadas
  const { data: latestCheckins } = await supabase
    .from('weekly_checkins')
    .select('patient_id, weight_kg, waist_cm, hip_cm, neck_cm, checkin_date')
    .order('checkin_date', { ascending: false });

  const checkinMap = new Map();
  (latestCheckins || []).forEach((c: any) => {
    if (!checkinMap.has(c.patient_id)) {
      checkinMap.set(c.patient_id, c);
    }
  });

  const patients = (rawPatients || []).map((p: any) => {
    const checkin = checkinMap.get(p.id);

    // Intentar extraer datos clínicos de onboarding si existen
    let clinicalData: any = {};
    if (p.allergies_or_notes) {
      const match = p.allergies_or_notes.match(/CLINICAL_JSON:(.+)$/m);
      if (match && match[1]) {
        try {
          clinicalData = JSON.parse(match[1]);
        } catch (e) {}
      }
    }

    // El peso actual prioriza: 1. Último check-in -> 2. current_weight_kg -> 3. initial_weight_kg
    const currentWeight = Number(
      checkin?.weight_kg || p.current_weight_kg || p.initial_weight_kg || 60
    );

    const waist = checkin?.waist_cm || clinicalData.waistCm || null;
    const hip = checkin?.hip_cm || clinicalData.hipCm || null;
    const neck = checkin?.neck_cm || clinicalData.neckCm || null;
    const bodyFat = p.body_fat_percentage ? Number(p.body_fat_percentage) : clinicalData.estimatedFatPct || null;

    return {
      id: p.id,
      fullName: p.profiles?.full_name || 'Paciente',
      weightKg: currentWeight,
      initialWeightKg: Number(p.initial_weight_kg) || currentWeight,
      gender: p.gender || 'female',
      birthDate: p.birth_date || '1995-01-01',
      heightCm: Number(p.height_cm) || 160,
      targetGoal: p.target_goal || 'Recomposición',
      activityLevel: p.activity_level || 'moderate',
      bodyFatPercentage: bodyFat,
      waistCm: waist,
      hipCm: hip,
      neckCm: neck,
    };
  });

  // Resolver el paciente inicial directamente en el servidor para evitar búsquedas client-side
  const initialPatient = (initialPatientId ? patients.find((p) => p.id === initialPatientId) : null) ?? patients[0] ?? null;

  return <CalculatorClient key={initialPatient?.id ?? 'default'} patients={patients} initialPatient={initialPatient} />;
}
