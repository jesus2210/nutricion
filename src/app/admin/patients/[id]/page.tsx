// LAYER: Interface
// Expediente Clínico y Ficha Técnica Individual del Paciente
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import PatientDetailClient from './PatientDetailClient';

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // 1. Obtener datos del paciente
  const { data: patient } = await supabase
    .from('patient_profiles')
    .select('*, profiles(full_name, email, phone, created_at)')
    .eq('id', id)
    .single();

  if (!patient) notFound();

  // 2. Obtener plan actual
  const { data: activePlan } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('patient_id', id)
    .eq('is_current', true)
    .maybeSingle();

  // 3. Obtener historial de check-ins con fotos
  const { data: rawCheckins } = await supabase
    .from('weekly_checkins')
    .select('*, checkin_photos(*)')
    .eq('patient_id', id)
    .order('checkin_date', { ascending: false });

  // Generar URLs firmadas para las fotos si existen
  const checkins = await Promise.all(
    (rawCheckins || []).map(async (c: any) => {
      const photosWithUrls = await Promise.all(
        (c.checkin_photos || []).map(async (p: any) => {
          let url = '';
          try {
            const { data } = await supabase.storage
              .from('patient-photos')
              .createSignedUrl(p.storage_path, 3600);
            url = data?.signedUrl || '';
          } catch {
            url = '';
          }
          return { ...p, url };
        })
      );
      return { ...c, checkin_photos: photosWithUrls };
    })
  );

  // 4. Obtener registros diarios recientes
  const { data: dailyLogs } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('patient_id', id)
    .order('log_date', { ascending: false })
    .limit(7);

  return (
    <PatientDetailClient
      patient={patient}
      activePlan={activePlan}
      checkins={checkins || []}
      dailyLogs={dailyLogs || []}
    />
  );
}
