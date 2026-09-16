// LAYER: Interface
// Lista de Pacientes Registrados en el Panel de Administrador

import Link from 'next/link';
import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { Users, Search, ChevronRight, Calendar, Activity, Plus } from 'lucide-react';

export default async function PatientsListPage() {
  const supabase = await createServerSupabaseClient();

  // 1. Obtener todos los usuarios con rol 'patient' en profiles
  const { data: allPatientUsers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'patient');

  // 2. Consultar expedientes en patient_profiles
  let { data: patients } = await supabase
    .from('patient_profiles')
    .select('*, profiles(full_name, email, phone)')
    .order('created_at', { ascending: false });

  const existingUserIds = new Set((patients || []).map((p: any) => p.user_id));
  const missingProfiles = (allPatientUsers || []).filter((u: any) => !existingUserIds.has(u.id));

  // 3. Sincronizar automáticamente cualquier paciente registrado que no tenga expediente aún
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
      .select('*, profiles(full_name, email, phone)')
      .order('created_at', { ascending: false });

    if (reQuery.data) {
      patients = reQuery.data;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
            Expedientes de Pacientes
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Gestiona la evolución, historial de medidas y planes asignados a cada paciente
          </p>
        </div>

        <Link
          href="/admin/calculator"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#1b4337]/40 transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Crear Nuevo Plan
        </Link>
      </div>

      {/* Lista de Pacientes */}
      <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-6 shadow-sm">
        {(!patients || patients.length === 0) ? (
          <div className="py-12 text-center text-sm text-[#64748b]">
            <Users className="mx-auto mb-2 h-8 w-8 text-[#64748b]" />
            No hay pacientes registrados todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                <tr>
                  <th className="pb-3">Paciente</th>
                  <th className="pb-3">Sexo / Edad</th>
                  <th className="pb-3">Peso Inicial / Actual</th>
                  <th className="pb-3">Objetivo</th>
                  <th className="pb-3">Nivel Actividad</th>
                  <th className="pb-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {patients.map((p: any) => {
                  const birthYear = p.birth_date ? new Date(p.birth_date).getFullYear() : null;
                  const age = birthYear ? new Date().getFullYear() - birthYear : '-';

                  return (
                    <tr key={p.id} className="transition hover:bg-white/[0.02]">
                      <td className="py-3.5">
                        <div className="font-bold text-white">{p.profiles?.full_name || 'Paciente'}</div>
                        <div className="text-[#64748b]">{p.profiles?.email}</div>
                      </td>
                      <td className="py-3.5 text-[#e2e8f0]">
                        {p.gender === 'female' ? 'Mujer' : 'Hombre'} • {age} años
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-white">{p.current_weight_kg || p.initial_weight_kg} kg</span>
                        <span className="ml-1 text-[10px] text-[#64748b]">(inicio: {p.initial_weight_kg} kg)</span>
                      </td>
                      <td className="py-3.5">
                        <span className="rounded-full bg-[#162229] px-2.5 py-1 text-[11px] font-semibold text-[#a7f3d0]">
                          {p.target_goal}
                        </span>
                      </td>
                      <td className="py-3.5 capitalize text-[#94a3b8]">{p.activity_level}</td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/admin/patients/${p.id}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs font-bold text-[#34d399] transition hover:bg-[#1e2e38]"
                        >
                          Ver Expediente
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
