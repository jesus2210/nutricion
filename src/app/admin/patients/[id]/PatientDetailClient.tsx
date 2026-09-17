// LAYER: Interface
// Componente Interactivo de Ficha Técnica Clínica y Expediente Completo del Paciente
'use client';

import { useState } from 'react';
import Link from 'next/link';
import SlideDeckPreview from '@/components/pdf/SlideDeckPreview';
import { calculateEnergyExpenditure } from '@/domain/formulas/energy-expenditure';
import { calculateNavyBodyFat } from '@/domain/formulas/body-composition';
import {
  ArrowLeft,
  User,
  FileText,
  Activity,
  Scale,
  Ruler,
  Flame,
  HeartPulse,
  Sparkles,
  AlertCircle,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Phone,
  Mail,
  ShieldAlert,
  Info,
} from 'lucide-react';
import PhotoGalleryModal, { GalleryPhoto } from '@/components/portal/PhotoGalleryModal';
import ProgressCharts from '@/components/portal/ProgressCharts';

interface PatientDetailClientProps {
  patient: any;
  activePlan: any;
  checkins: any[];
  dailyLogs: any[];
}

export default function PatientDetailClient({
  patient,
  activePlan,
  checkins,
  dailyLogs,
}: PatientDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'ficha' | 'plan' | 'checkins'>('ficha');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Aplanar todas las fotos disponibles de todos los checkins para la galería deslizable
  const allPhotos: GalleryPhoto[] = checkins
    .flatMap((c) =>
      (c.checkin_photos || []).map((p: any) => ({
        id: p.id,
        url: p.url || '',
        photoType: p.photo_type || 'front',
        checkinDate: c.checkin_date,
        weightKg: c.weight_kg,
      }))
    )
    .filter((p) => Boolean(p.url));

  const openGalleryAtPhoto = (photoId: string) => {
    const idx = allPhotos.findIndex((p) => p.id === photoId);
    setGalleryIndex(idx >= 0 ? idx : 0);
    setGalleryOpen(true);
  };

  const openGalleryAtCheckin = (checkinId: string) => {
    const idx = allPhotos.findIndex((p) => {
      const c = checkins.find((chk) => chk.id === checkinId);
      return c?.checkin_photos?.some((cp: any) => cp.id === p.id);
    });
    setGalleryIndex(idx >= 0 ? idx : 0);
    setGalleryOpen(true);
  };

  // Cálculos antropométricos
  const currentWeight = Number(patient.current_weight_kg || patient.initial_weight_kg || 60);
  const initialWeight = Number(patient.initial_weight_kg || 60);
  const weightDiff = currentWeight - initialWeight;
  const heightCm = Number(patient.height_cm || 165);
  const heightM = heightCm / 100;
  const bmi = Number((currentWeight / (heightM * heightM)).toFixed(1));

  // Diagnóstico IMC
  let bmiCategory = 'Peso Saludable';
  let bmiColor = 'text-[#34d399] bg-[#14352b] border-[#245748]';
  if (bmi < 18.5) {
    bmiCategory = 'Bajo Peso';
    bmiColor = 'text-amber-400 bg-amber-950/30 border-amber-500/30';
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = 'Sobrepeso (Grado I)';
    bmiColor = 'text-amber-400 bg-amber-950/30 border-amber-500/30';
  } else if (bmi >= 30) {
    bmiCategory = 'Obesidad';
    bmiColor = 'text-rose-400 bg-rose-950/30 border-rose-500/30';
  }

  // Rango de peso saludable (IMC 18.5 a 24.9)
  const healthyWeightMin = Number((18.5 * heightM * heightM).toFixed(1));
  const healthyWeightMax = Number((24.9 * heightM * heightM).toFixed(1));

  // Edad
  const birthYear = patient.birth_date ? new Date(patient.birth_date).getFullYear() : 1998;
  const age = new Date().getFullYear() - birthYear;

  // Gasto Energético (Mifflin-St Jeor & TDEE)
  const energy = calculateEnergyExpenditure({
    gender: patient.gender,
    weightKg: currentWeight,
    heightCm,
    age,
    activityLevel: patient.activity_level || 'moderate',
    bodyFatPercentage: patient.body_fat_percentage ? Number(patient.body_fat_percentage) : undefined,
  });

  // Intentar extraer datos estructurados de onboarding
  let clinicalData: any = {};
  if (patient.allergies_or_notes) {
    const match = patient.allergies_or_notes.match(/CLINICAL_JSON:(.+)$/m);
    if (match && match[1]) {
      try {
        clinicalData = JSON.parse(match[1]);
      } catch (e) {
        // Fallback
      }
    }
  }

  // Medidas de circunferencias (del onboarding o último check-in)
  const latestCheckin = checkins?.[0];
  const waistCm = latestCheckin?.waist_cm || clinicalData.waistCm || null;
  const hipCm = latestCheckin?.hip_cm || clinicalData.hipCm || null;
  const neckCm = latestCheckin?.neck_cm || clinicalData.neckCm || null;
  const thighCm = latestCheckin?.thigh_cm || null;
  const armCm = latestCheckin?.arm_cm || null;

  // Índice Cintura/Cadera (WHR)
  let whr: number | null = null;
  let whrRisk = 'Bajo Riesgo';
  if (waistCm && hipCm) {
    whr = Number((waistCm / hipCm).toFixed(2));
    if (patient.gender === 'female' && whr > 0.85) whrRisk = 'Riesgo Aumentado';
    if (patient.gender === 'male' && whr > 0.90) whrRisk = 'Riesgo Aumentado';
  }

  // % Grasa Corporal
  let bodyFatPct = patient.body_fat_percentage;
  if (!bodyFatPct && waistCm && neckCm) {
    const navy = calculateNavyBodyFat(currentWeight, {
      gender: patient.gender,
      heightCm,
      neckCm,
      waistCm,
      hipCm: hipCm || waistCm * 1.25,
    });
    bodyFatPct = navy.bodyFatPercentage;
  }

  return (
    <div className="space-y-6">
      {/* Volver & Header del Paciente */}
      <div>
        <Link
          href="/admin/patients"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#94a3b8] hover:text-white mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al Directorio de Pacientes
        </Link>

        {/* Tarjeta de Identidad del Paciente */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111a1f] to-[#162229] p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#14352b] text-[#34d399] border border-[#245748] text-xl font-extrabold shadow-md">
                {(patient.profiles?.full_name || 'P').slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-2xl font-extrabold text-white">
                    {patient.profiles?.full_name || 'Paciente'}
                  </h1>
                  <span className="rounded-full bg-[#245748]/50 border border-[#245748] px-2.5 py-0.5 text-[10px] font-bold text-[#a7f3d0]">
                    {patient.gender === 'female' ? 'Mujer' : 'Hombre'} • {age} años
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${bmiColor}`}>
                    IMC {bmi} ({bmiCategory})
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#94a3b8]">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-[#64748b]" />
                    {patient.profiles?.email || 'Sin correo'}
                  </span>
                  {patient.profiles?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-[#64748b]" />
                      {patient.profiles.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#64748b]" />
                    Alta: {new Date(patient.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/calculator?patientId=${patient.id}`}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-4 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-110"
              >
                <Flame className="h-3.5 w-3.5" />
                Diseñar / Ajustar Plan
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación del Expediente */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('ficha')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'ficha'
              ? 'border border-[#245748] bg-[#14352b] text-white shadow-md'
              : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
          }`}
        >
          <HeartPulse className="h-4 w-4 text-[#34d399]" />
          1. Ficha Técnica Antropométrica
        </button>

        <button
          onClick={() => setActiveTab('plan')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'plan'
              ? 'border border-[#245748] bg-[#14352b] text-white shadow-md'
              : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4 text-[#38bdf8]" />
          2. Plan Nutricional Activo
        </button>

        <button
          onClick={() => setActiveTab('checkins')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'checkins'
              ? 'border border-[#245748] bg-[#14352b] text-white shadow-md'
              : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
          }`}
        >
          <Activity className="h-4 w-4 text-[#f59e0b]" />
          3. Evolución & Check-ins ({checkins?.length || 0})
        </button>
      </div>

      {/* TAB 1: FICHA TÉCNICA ANTROPOMÉTRICA & CLÍNICA */}
      {activeTab === 'ficha' && (
        <div className="space-y-6">
          {/* Métricas Principales en Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Peso */}
            <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-4 text-center">
              <div className="text-xs text-[#94a3b8]">Peso Actual / Inicial</div>
              <div className="mt-1 font-heading text-2xl font-extrabold text-white">
                {currentWeight} <span className="text-xs font-normal text-[#94a3b8]">kg</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[#64748b]">
                {weightDiff === 0
                  ? 'Sin variación'
                  : weightDiff > 0
                  ? `+${weightDiff.toFixed(1)} kg desde inicio`
                  : `${weightDiff.toFixed(1)} kg perdidos`}
              </div>
            </div>

            {/* Altura e IMC */}
            <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-4 text-center">
              <div className="text-xs text-[#94a3b8]">Altura & IMC</div>
              <div className="mt-1 font-heading text-2xl font-extrabold text-white">
                {heightCm} <span className="text-xs font-normal text-[#94a3b8]">cm</span>
              </div>
              <div className="mt-0.5 text-[11px] font-bold text-[#34d399]">IMC: {bmi} kg/m²</div>
            </div>

            {/* Tasa Metabólica Basal */}
            <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-4 text-center">
              <div className="text-xs text-[#94a3b8]">Metabolismo Basal (BMR)</div>
              <div className="mt-1 font-heading text-2xl font-extrabold text-[#38bdf8]">
                {Math.round(energy.bmrMifflin)} <span className="text-xs font-normal text-[#94a3b8]">kcal</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[#64748b]">Mifflin-St Jeor</div>
            </div>

            {/* Gasto Total (TDEE) */}
            <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-4 text-center">
              <div className="text-xs text-[#94a3b8]">Gasto Diario (TDEE)</div>
              <div className="mt-1 font-heading text-2xl font-extrabold text-[#f59e0b]">
                {Math.round(energy.tdee)} <span className="text-xs font-normal text-[#94a3b8]">kcal</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[#64748b]">Factor: {patient.activity_level}</div>
            </div>
          </div>

          {/* Dos Columnas: Medidas Antropométricas y Diagnóstico Metabólico */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Medidas Corporales & Circunferencias */}
            <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-[#34d399]" />
                  <h3 className="font-heading text-base font-bold text-white">
                    Circunferencias & Composición Corporal
                  </h3>
                </div>
                {bodyFatPct && (
                  <span className="rounded-full bg-[#14352b] px-2.5 py-0.5 text-xs font-bold text-[#34d399]">
                    ~{bodyFatPct}% Grasa
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-[#162229] p-3.5">
                  <span className="text-[#94a3b8] block">Cintura:</span>
                  <strong className="text-base text-white">{waistCm ? `${waistCm} cm` : 'No registrada'}</strong>
                </div>

                <div className="rounded-2xl bg-[#162229] p-3.5">
                  <span className="text-[#94a3b8] block">Cadera:</span>
                  <strong className="text-base text-white">{hipCm ? `${hipCm} cm` : 'No registrada'}</strong>
                </div>

                <div className="rounded-2xl bg-[#162229] p-3.5">
                  <span className="text-[#94a3b8] block">Cuello:</span>
                  <strong className="text-base text-white">{neckCm ? `${neckCm} cm` : 'No registrado'}</strong>
                </div>

                <div className="rounded-2xl bg-[#162229] p-3.5">
                  <span className="text-[#94a3b8] block">Ratio Cintura/Cadera:</span>
                  <strong className="text-base text-white">{whr ? `${whr} (${whrRisk})` : 'N/A'}</strong>
                </div>

                <div className="rounded-2xl bg-[#162229] p-3.5">
                  <span className="text-[#94a3b8] block">Muslo:</span>
                  <strong className="text-base text-white">{thighCm ? `${thighCm} cm` : 'Sin datos'}</strong>
                </div>

                <div className="rounded-2xl bg-[#162229] p-3.5">
                  <span className="text-[#94a3b8] block">Brazo:</span>
                  <strong className="text-base text-white">{armCm ? `${armCm} cm` : 'Sin datos'}</strong>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#162229] p-3.5 text-xs text-[#94a3b8]">
                <div className="font-bold text-white mb-1">Rango de Peso Ideal Sugerido:</div>
                De <strong>{healthyWeightMin} kg</strong> a <strong>{healthyWeightMax} kg</strong> para una estatura de {heightCm} cm.
              </div>
            </div>

            {/* Diagnóstico Metabólico & Objetivos */}
            <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-[#f59e0b]" />
                  <h3 className="font-heading text-base font-bold text-white">
                    Gasto Calórico & Estrategia
                  </h3>
                </div>
                <span className="rounded-full bg-[#14352b] px-2.5 py-0.5 text-xs font-bold text-[#a7f3d0]">
                  Meta: {patient.target_goal}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-[#162229] p-3">
                  <span className="text-[#94a3b8]">Mantenimiento Energético:</span>
                  <strong className="text-white font-heading text-sm">{Math.round(energy.tdee)} kcal</strong>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#162229] p-3 border-l-4 border-rose-500">
                  <div>
                    <span className="text-white font-bold block">Déficit Moderado (-15%):</span>
                    <span className="text-[11px] text-[#94a3b8]">Para pérdida de grasa</span>
                  </div>
                  <strong className="text-rose-300 font-heading text-sm">
                    {Math.round(energy.targetCaloriesByGoal.moderateDeficit)} kcal
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#162229] p-3 border-l-4 border-blue-500">
                  <div>
                    <span className="text-white font-bold block">Superávit Limpio (+10%):</span>
                    <span className="text-[11px] text-[#94a3b8]">Para ganancia muscular</span>
                  </div>
                  <strong className="text-blue-300 font-heading text-sm">
                    {Math.round(energy.targetCaloriesByGoal.cleanSurplus)} kcal
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#162229] p-3 border-l-4 border-emerald-500">
                  <div>
                    <span className="text-white font-bold block">Plan Nutricional Asignado:</span>
                    <span className="text-[11px] text-[#94a3b8]">Calorías activas en sistema</span>
                  </div>
                  <strong className="text-[#34d399] font-heading text-sm">
                    {activePlan ? `${Math.round(activePlan.target_calories)} kcal` : 'Sin plan asignado'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Historial Clínico, Alergias & Preferencias Alimentarias */}
          <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldAlert className="h-5 w-5 text-[#ef4444]" />
              <h3 className="font-heading text-base font-bold text-white">
                Historial Clínico, Alergias & Notas del Paciente
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
              <div className="rounded-2xl bg-[#162229] p-4 space-y-1.5 border border-red-500/20">
                <div className="font-bold text-red-400">Alergias o Intolerancias:</div>
                <div className="text-white text-xs">
                  {clinicalData.allergies || 'Ninguna alergia registrada'}
                </div>
              </div>

              <div className="rounded-2xl bg-[#162229] p-4 space-y-1.5 border border-amber-500/20">
                <div className="font-bold text-amber-400">Alimentos no deseados:</div>
                <div className="text-white text-xs">
                  {clinicalData.dislikedFoods || 'Ninguno especificado'}
                </div>
              </div>

              <div className="rounded-2xl bg-[#162229] p-4 space-y-1.5 border border-blue-500/20">
                <div className="font-bold text-blue-400">Días de Entrenamiento:</div>
                <div className="text-white text-xs">
                  {clinicalData.trainingDays ? `${clinicalData.trainingDays} días por semana` : 'No especificado'}
                </div>
              </div>
            </div>

            {/* Observaciones Generales */}
            <div className="rounded-2xl bg-[#162229] p-4 text-xs text-[#cbd5e1] space-y-1">
              <div className="font-bold text-white">Observaciones / Historial Completo:</div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-[#94a3b8]">
                {patient.allergies_or_notes
                  ? patient.allergies_or_notes.replace(/CLINICAL_JSON:.+$/m, '').trim()
                  : 'Sin notas registradas por el paciente.'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLAN NUTRICIONAL ACTIVO */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {!activePlan ? (
            <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-12 text-center shadow-xl">
              <FileText className="mx-auto mb-3 h-10 w-10 text-[#64748b]" />
              <h3 className="font-heading text-lg font-bold text-white">Este paciente no tiene un plan activo</h3>
              <p className="mt-1 text-xs text-[#94a3b8]">
                Puedes calcular sus requerimientos calóricos y diseñarle un plan con diapositivas en 16:9 ahora mismo.
              </p>
              <div className="mt-6">
                <Link
                  href={`/admin/calculator?patientId=${patient.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:brightness-110"
                >
                  <Flame className="h-4 w-4" />
                  Ir a la Calculadora y Generar Plan
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111a1f] p-4">
                <div>
                  <h3 className="font-heading text-sm font-bold text-white">{activePlan.title}</h3>
                  <p className="text-xs text-[#94a3b8]">
                    {Math.round(activePlan.target_calories)} kcal • P: {activePlan.target_protein_g}g • G: {activePlan.target_fat_g}g • C: {activePlan.target_carbs_g}g
                  </p>
                </div>
                <Link
                  href={`/admin/calculator?patientId=${patient.id}`}
                  className="rounded-xl border border-white/10 bg-[#162229] px-3.5 py-1.5 text-xs font-bold text-[#a7f3d0] hover:bg-[#1e2e38]"
                >
                  Modificar Plan
                </Link>
              </div>

              <div className="w-full overflow-hidden">
                <SlideDeckPreview
                  patientName={patient.profiles?.full_name || 'Paciente'}
                  weightKg={currentWeight}
                  goal={activePlan.goal}
                  portions={activePlan.portions_json}
                  meals={activePlan.meals_config_json || []}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HISTORIAL DE CHECK-INS Y EVOLUCIÓN */}
      {activeTab === 'checkins' && (
        <div className="space-y-6">
          {/* Gráficas interactivas completas */}
          {checkins && checkins.length > 0 && (
            <ProgressCharts
              checkins={checkins}
              targetGoal={patient.target_goal}
              initialWeight={initialWeight}
            />
          )}

          {/* Galería visual rápida de fotos del paciente */}
          {allPhotos.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-[#34d399]" />
                  <h3 className="font-heading text-base font-bold text-white">
                    Galería Fotográfica de Evolución
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setGalleryIndex(0);
                    setGalleryOpen(true);
                  }}
                  className="rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs font-bold text-[#34d399] hover:bg-[#1e2e38] transition cursor-pointer"
                >
                  Abrir Galería Completa ({allPhotos.length} fotos)
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {allPhotos.map((photo, idx) => (
                  <button
                    key={photo.id || idx}
                    onClick={() => {
                      setGalleryIndex(idx);
                      setGalleryOpen(true);
                    }}
                    className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 text-left transition hover:border-[#34d399]/60 cursor-pointer"
                  >
                    <img
                      src={photo.url}
                      alt={photo.photoType}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-90" />
                    <div className="absolute bottom-2 inset-x-2 text-[10px]">
                      <span className="block font-bold capitalize text-white">
                        {photo.photoType === 'front'
                          ? 'Frente'
                          : photo.photoType === 'side'
                          ? 'Perfil'
                          : 'Espalda'}
                      </span>
                      <span className="text-[#94a3b8]">{photo.checkinDate}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de Mediciones Semanales */}
          <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#38bdf8]" />
                <h3 className="font-heading text-base font-bold text-white">
                  Historial de Mediciones Semanales & Fotos
                </h3>
              </div>
              <span className="text-xs text-[#94a3b8]">{checkins?.length || 0} reportes registrados</span>
            </div>

            {(!checkins || checkins.length === 0) ? (
              <div className="py-12 text-center text-xs text-[#64748b]">
                El paciente no ha enviado reportes de check-in semanales todavía.
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
                      <th className="pb-3">Fotos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {checkins.map((c: any) => {
                      const photoCount = c.checkin_photos?.length || 0;
                      return (
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
                          <td className="py-3">
                            {photoCount > 0 ? (
                              <button
                                onClick={() => openGalleryAtCheckin(c.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-2.5 py-1 text-[11px] font-bold text-[#38bdf8] hover:bg-[#38bdf8]/20 transition cursor-pointer"
                              >
                                <ImageIcon className="h-3.5 w-3.5" />
                                Ver {photoCount} fotos
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#64748b]">Sin fotos</span>
                            )}
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
      )}

      {/* Visor Modal de Fotos estilo móvil */}
      <PhotoGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        photos={allPhotos}
        initialIndex={galleryIndex}
      />
    </div>
  );
}
