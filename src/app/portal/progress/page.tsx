// LAYER: Interface
// Página de Progreso, Evolución y Galería de Fotos del Paciente

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { TrendingUp, Calendar, Image as ImageIcon, Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';
import ProgressCharts from '@/components/portal/ProgressCharts';
import PatientPhotoGalleryClient from '@/components/portal/PatientPhotoGalleryClient';

export default async function PatientProgressPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: patient } = await supabase
    .from('patient_profiles')
    .select('*, profiles(full_name)')
    .eq('user_id', user.id)
    .single();

  if (!patient) return null;

  // Obtener historial de check-ins con fotos
  const { data: checkins } = await supabase
    .from('weekly_checkins')
    .select('*, checkin_photos(*)')
    .eq('patient_id', patient.id)
    .order('checkin_date', { ascending: false });

  const initialWeight = Number(patient.initial_weight_kg);
  const currentWeight = Number(patient.current_weight_kg || patient.initial_weight_kg);
  const weightDiff = Number((currentWeight - initialWeight).toFixed(1));

  // Generar URLs firmadas para las fotos si existen
  const checkinsWithUrls = await Promise.all(
    (checkins || []).map(async (c: any) => {
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

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
          Mi Evolución y Progreso
        </h1>
        <p className="text-xs text-[#94a3b8]">
          Revisa el historial de tus cambios físicos, medidas corporales y fotografías semanales
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#94a3b8]">
            <span>Variación de Peso</span>
            <Scale className="h-4 w-4 text-[#34d399]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-3xl font-extrabold text-white">{currentWeight} kg</span>
            <span
              className={`flex items-center text-xs font-bold ${
                weightDiff > 0 ? 'text-[#34d399]' : weightDiff < 0 ? 'text-[#38bdf8]' : 'text-[#94a3b8]'
              }`}
            >
              {weightDiff > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">Peso inicial: {initialWeight} kg</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#94a3b8]">
            <span>Reportes Enviados</span>
            <Calendar className="h-4 w-4 text-[#38bdf8]" />
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-white">
            {checkins?.length || 0}
          </div>
          <div className="mt-1 text-[11px] text-[#34d399]">Check-ins semanales</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#94a3b8]">
            <span>Objetivo Clínico</span>
            <TrendingUp className="h-4 w-4 text-[#a855f7]" />
          </div>
          <div className="mt-2 font-heading text-xl font-extrabold text-white">
            {patient.target_goal}
          </div>
          <div className="mt-1 text-[11px] text-[#94a3b8]">Protocolo Contreras Fit</div>
        </div>
      </div>

      {/* Gráficas de Evolución */}
      {checkins && checkins.length > 0 && (
        <ProgressCharts
          checkins={checkins}
          targetGoal={patient.target_goal}
          initialWeight={initialWeight}
        />
      )}

      {/* Historial de Medidas */}
      <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="font-heading text-base font-bold text-white">Historial de Medidas</h2>
          <Link
            href="/portal/checkin"
            className="rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs font-bold text-[#34d399] hover:bg-[#1e2e38]"
          >
            Nuevo Check-in
          </Link>
        </div>

        <div className="mt-4">
          {(!checkins || checkins.length === 0) ? (
            <div className="py-8 text-center text-xs text-[#64748b]">
              Aún no has registrado ningún check-in semanal.{' '}
              <Link href="/portal/checkin" className="font-bold text-[#34d399] hover:underline">
                Haz tu primer reporte aquí
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-[11px] font-bold uppercase text-[#94a3b8]">
                  <tr>
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Peso</th>
                    <th className="pb-3">Cintura</th>
                    <th className="pb-3">Cadera</th>
                    <th className="pb-3">Muslo</th>
                    <th className="pb-3">Brazo</th>
                    <th className="pb-3">Adherencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {checkins.map((c: any) => (
                    <tr key={c.id}>
                      <td className="py-3 font-semibold text-white">{c.checkin_date}</td>
                      <td className="py-3 font-bold text-[#34d399]">{c.weight_kg} kg</td>
                      <td className="py-3 text-[#e2e8f0]">{c.waist_cm ? `${c.waist_cm} cm` : '-'}</td>
                      <td className="py-3 text-[#e2e8f0]">{c.hip_cm ? `${c.hip_cm} cm` : '-'}</td>
                      <td className="py-3 text-[#e2e8f0]">{c.thigh_cm ? `${c.thigh_cm} cm` : '-'}</td>
                      <td className="py-3 text-[#e2e8f0]">{c.arm_cm ? `${c.arm_cm} cm` : '-'}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-[#162229] px-2 py-0.5 text-[10px] font-bold text-[#fbbf24]">
                          {c.adherence_score}/10
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Galería de Fotos de Progreso Interactiva */}
      <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-[#38bdf8]" />
            <div>
              <h2 className="font-heading text-base font-bold text-white">Galería de Fotos de Progreso</h2>
              <p className="text-[11px] text-[#94a3b8]">Toca cualquier foto para abrir el visor deslizable estilo galería de celular</p>
            </div>
          </div>
        </div>

        <PatientPhotoGalleryClient checkinsWithUrls={checkinsWithUrls} />
      </div>
    </div>
  );
}
