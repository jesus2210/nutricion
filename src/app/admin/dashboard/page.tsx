// LAYER: Interface
// Dashboard Principal del Administrador (Nutricionista)

import Link from 'next/link';
import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { Users, FileText, Activity, TrendingUp, Plus, ArrowRight, Calendar } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Consultar pacientes
  const { data: patients } = await supabase
    .from('patient_profiles')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false });

  // Consultar check-ins recientes
  const { data: recentCheckins } = await supabase
    .from('weekly_checkins')
    .select('*, patient_profiles(*, profiles(full_name))')
    .order('checkin_date', { ascending: false })
    .limit(5);

  // Consultar planes activos
  const { count: activePlansCount } = await supabase
    .from('diet_plans')
    .select('*', { count: 'exact', head: true })
    .eq('is_current', true);

  const totalPatients = patients?.length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
            Panel de Control Clínico
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Supervisa el progreso, check-ins y planes alimentarios de tus pacientes
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/calculator"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#1b4337]/40 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Crear / Calcular Plan
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-xs font-bold uppercase tracking-wider">Pacientes Totales</span>
            <Users className="h-5 w-5 text-[#38bdf8]" />
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-white">{totalPatients}</div>
          <div className="mt-1 text-xs text-[#34d399]">Expedientes registrados</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-xs font-bold uppercase tracking-wider">Planes Activos</span>
            <FileText className="h-5 w-5 text-[#34d399]" />
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-white">{activePlansCount || 0}</div>
          <div className="mt-1 text-xs text-[#94a3b8]">Planes en ejecución</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-xs font-bold uppercase tracking-wider">Check-ins Recientes</span>
            <Activity className="h-5 w-5 text-[#fbbf24]" />
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-white">{recentCheckins?.length || 0}</div>
          <div className="mt-1 text-xs text-[#94a3b8]">Reportes con medidas</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span className="text-xs font-bold uppercase tracking-wider">Protocolo</span>
            <TrendingUp className="h-5 w-5 text-[#a855f7]" />
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-white">16:9 HD</div>
          <div className="mt-1 text-xs text-[#34d399]">Contreras Nutrición Fit</div>
        </div>
      </div>

      {/* Secciones: Pacientes & Check-ins Recientes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pacientes */}
        <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-heading text-base font-bold text-white">Pacientes Registrados</h2>
            <Link href="/admin/patients" className="text-xs font-bold text-[#34d399] hover:underline">
              Ver todos ({totalPatients})
            </Link>
          </div>

          <div className="mt-4 divide-y divide-white/5">
            {(!patients || patients.length === 0) ? (
              <div className="py-8 text-center text-xs text-[#64748b]">
                No hay pacientes registrados aún.
              </div>
            ) : (
              patients.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-bold text-white">{p.profiles?.full_name || 'Paciente'}</div>
                    <div className="text-xs text-[#64748b]">{p.profiles?.email} • {p.initial_weight_kg} kg</div>
                  </div>
                  <Link
                    href={`/admin/patients/${p.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-[#a7f3d0] hover:underline"
                  >
                    Ver Ficha
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Check-ins Recientes */}
        <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-heading text-base font-bold text-white">Últimos Reportes Semanales</h2>
            <span className="text-xs text-[#94a3b8]">Medidas & Fotos</span>
          </div>

          <div className="mt-4 divide-y divide-white/5">
            {(!recentCheckins || recentCheckins.length === 0) ? (
              <div className="py-8 text-center text-xs text-[#64748b]">
                No hay reportes de check-in registrados todavía.
              </div>
            ) : (
              recentCheckins.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {c.patient_profiles?.profiles?.full_name || 'Paciente'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#64748b]">
                      <Calendar className="h-3 w-3" />
                      <span>{c.checkin_date}</span>
                      <span>• Peso: <strong className="text-white">{c.weight_kg} kg</strong></span>
                      {c.waist_cm && <span>• Cintura: {c.waist_cm} cm</span>}
                    </div>
                  </div>
                  <Link
                    href={`/admin/patients/${c.patient_id}`}
                    className="rounded-lg border border-white/10 bg-[#162229] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#1e2e38]"
                  >
                    Revisar
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
