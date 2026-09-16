// LAYER: Interface
// Vista del Plan Nutricional Activo del Paciente

import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import PatientPlanClient from './PatientPlanClient';
import { FileText, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default async function PatientPlanPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Obtener perfil del paciente
  const { data: patient } = await supabase
    .from('patient_profiles')
    .select('*, profiles(full_name)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!patient) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[#111a1f] p-8 text-center shadow-xl">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-[#f59e0b]" />
        <h2 className="font-heading text-xl font-bold text-white">¡Bienvenido a NutriEquiv Pro!</h2>
        <p className="mt-2 text-xs text-[#94a3b8] leading-relaxed">
          Para que tu nutricionista pueda preparar tu plan con tus medidas exactas y objetivos, completa tu expediente inicial.
        </p>
        <div className="mt-6">
          <Link
            href="/portal/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:brightness-110"
          >
            <Sparkles className="h-4 w-4 text-[#a7f3d0]" />
            Completar mis Datos Clínicos
          </Link>
        </div>
      </div>
    );
  }

  // Obtener plan actual asignado
  const { data: activePlan } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('patient_id', patient.id)
    .eq('is_current', true)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {!activePlan ? (
        <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-12 text-center shadow-xl">
          <FileText className="mx-auto mb-3 h-10 w-10 text-[#64748b]" />
          <h3 className="font-heading text-lg font-bold text-white">Tu nutricionista está preparando tu plan</h3>
          <p className="mt-2 text-xs text-[#94a3b8] max-w-md mx-auto leading-relaxed">
            Ya tenemos tus medidas registradas ({patient.current_weight_kg || patient.initial_weight_kg} kg • {patient.target_goal}). En cuanto tu plan esté asignado, podrás consultarlo aquí e imprimirlo o descargarlo en PDF en cualquier momento.
          </p>
        </div>
      ) : (
        <PatientPlanClient
          patientName={patient.profiles?.full_name || 'Paciente'}
          weightKg={Number(patient.current_weight_kg || patient.initial_weight_kg)}
          goal={activePlan.goal}
          portions={activePlan.portions_json}
          meals={activePlan.meals_config_json || []}
          planTitle={activePlan.title}
        />
      )}
    </div>
  );
}
