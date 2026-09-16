// LAYER: Interface
// Flujo Interactivo de Onboarding Clínico del Paciente (Paso a Paso)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { savePatientOnboardingAction } from './actions';
import confetti from 'canvas-confetti';
import {
  User,
  Ruler,
  Target,
  HeartPulse,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

export default function PatientOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [birthDate, setBirthDate] = useState('1998-06-15');
  const [heightCm, setHeightCm] = useState(165);
  const [weightKg, setWeightKg] = useState(60);

  // Medidas de circunferencias
  const [waistCm, setWaistCm] = useState<number | undefined>(72);
  const [hipCm, setHipCm] = useState<number | undefined>(96);
  const [neckCm, setNeckCm] = useState<number | undefined>(34);

  // Estilo de vida y objetivos
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [targetGoal, setTargetGoal] = useState('Recomposición');
  const [trainingDays, setTrainingDays] = useState(4);

  // Salud y Preferencias
  const [allergies, setAllergies] = useState('');
  const [dislikedFoods, setDislikedFoods] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  const steps = [
    { id: 1, title: 'Datos Físicos', icon: User },
    { id: 2, title: 'Circunferencias', icon: Ruler },
    { id: 3, title: 'Objetivos', icon: Target },
    { id: 4, title: 'Salud & Gustos', icon: HeartPulse },
  ];

  async function handleFinish() {
    if (!fullName.trim()) {
      setError('Por favor ingresa tu nombre completo');
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await savePatientOnboardingAction({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        gender,
        birthDate,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        waistCm: waistCm ? Number(waistCm) : undefined,
        hipCm: hipCm ? Number(hipCm) : undefined,
        neckCm: neckCm ? Number(neckCm) : undefined,
        targetGoal,
        activityLevel,
        trainingDays: Number(trainingDays),
        allergies: allergies.trim() || undefined,
        dislikedFoods: dislikedFoods.trim() || undefined,
        medicalNotes: medicalNotes.trim() || undefined,
      });

      if (res?.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        router.push('/portal/plan');
        router.refresh();
      } else {
        setError(res?.error || 'Error al guardar expediente');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al guardar');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-6">
      {/* Header */}
      <div className="text-center">
        <div className="relative mx-auto mb-3 h-14 w-14 overflow-hidden rounded-2xl border border-[#245748] bg-gradient-to-br from-[#1b4337] to-[#0f2720] p-1 shadow-lg shadow-[#1b4337]/30">
          <Image
            src="/logo_contreras_transparent.png"
            alt="Contreras Nutrición Fit"
            fill
            className="object-contain"
          />
        </div>
        <h1 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
          Completa tu Expediente Clínico
        </h1>
        <p className="mt-1 text-xs text-[#94a3b8]">
          Tu nutricionista usará estos datos exactos para diseñar tu plan de alimentación y calcular tus macros
        </p>
      </div>

      {/* Barra de Pasos / Stepper */}
      <div className="mt-8 flex items-center justify-between gap-2 border-b border-white/10 pb-4">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = s.id === currentStep;
          const isDone = s.id < currentStep;
          return (
            <div
              key={s.id}
              onClick={() => s.id <= currentStep && setCurrentStep(s.id)}
              className={`flex flex-1 items-center gap-2 cursor-pointer transition ${
                isActive
                  ? 'text-white'
                  : isDone
                  ? 'text-[#34d399]'
                  : 'text-[#64748b]'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#34d399] text-[#0a0f12] font-extrabold shadow-md'
                    : isDone
                    ? 'bg-[#14352b] text-[#34d399] border border-[#245748]'
                    : 'bg-[#162229] text-[#64748b]'
                }`}
              >
                {isDone ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className="hidden text-xs font-semibold sm:inline">{s.title}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Contenedor del Paso Actual */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-[#111a1f] p-6 shadow-2xl sm:p-8">
        {/* PASO 1: DATOS FÍSICOS BÁSICOS */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-white border-b border-white/10 pb-2">
              1. Datos Personales & Antropometría Básica
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#94a3b8]">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Génesis Ortiz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#34d399]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">WhatsApp / Teléfono</label>
                <input
                  type="tel"
                  placeholder="+58 412 0000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#34d399]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">Sexo Biológico *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="female">Femenino (Mujer)</option>
                  <option value="male">Masculino (Hombre)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">Altura (cm) *</label>
                <input
                  type="number"
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#94a3b8]">Peso Actual en Ayunas (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-[#64748b]">
                  Pésate por la mañana al despertar, después de orinar y antes de desayunar.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: CIRCUNFERENCIAS CORPORALES */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="font-heading text-lg font-bold text-white">
                2. Circunferencias Antropométricas
              </h2>
              <span className="rounded-full bg-[#14352b] px-2.5 py-0.5 text-[10px] font-bold text-[#34d399]">
                Para % de Grasa Corporal
              </span>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl bg-[#162229] p-3.5 text-xs text-[#94a3b8]">
              <Info className="h-4 w-4 text-[#38bdf8] shrink-0 mt-0.5" />
              <span>
                Usa una cinta métrica flexible sin apretar la piel. Estas medidas permiten calcular tu porcentaje de grasa por el Método US Navy oficial.
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">Cintura (cm) *</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Ej. 72"
                  value={waistCm || ''}
                  onChange={(e) => setWaistCm(e.target.value ? Number(e.target.value) : undefined)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#34d399]"
                />
                <span className="mt-1 block text-[10px] text-[#64748b]">A la altura del ombligo</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">Cadera (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Ej. 96"
                  value={hipCm || ''}
                  onChange={(e) => setHipCm(e.target.value ? Number(e.target.value) : undefined)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#34d399]"
                />
                <span className="mt-1 block text-[10px] text-[#64748b]">Parte más ancha de los glúteos</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">Cuello (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Ej. 34"
                  value={neckCm || ''}
                  onChange={(e) => setNeckCm(e.target.value ? Number(e.target.value) : undefined)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#34d399]"
                />
                <span className="mt-1 block text-[10px] text-[#64748b]">Debajo de la laringe</span>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: OBJETIVOS Y ACTIVIDAD */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-white border-b border-white/10 pb-2">
              3. Nivel de Actividad y Meta Nutricional
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">Objetivo Principal *</label>
                <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {[
                    { key: 'Recomposición', title: 'Recomposición Corporal', desc: 'Perder grasa y tonificar músculo simultáneamente' },
                    { key: 'Déficit', title: 'Pérdida de Grasa (Déficit)', desc: 'Reducir porcentaje graso manteniendo músculo' },
                    { key: 'Superávit', title: 'Aumento Muscular (Superávit)', desc: 'Incremento de masa magra con superávit controlado' },
                    { key: 'Mantenimiento', title: 'Mantenimiento & Salud', desc: 'Optimizar energía y rendimiento con peso estable' },
                  ].map((g) => (
                    <div
                      key={g.key}
                      onClick={() => setTargetGoal(g.key)}
                      className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                        targetGoal === g.key
                          ? 'border-[#34d399] bg-[#14352b] text-white shadow-md'
                          : 'border-white/10 bg-[#162229] text-[#94a3b8] hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{g.title}</div>
                      <div className="text-[11px] text-[#94a3b8] mt-0.5">{g.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">Nivel de Actividad Cotidiana *</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="sedentary">Sedentario (Trabajo de escritorio / poco movimiento)</option>
                  <option value="light">Ligero (1-3 días de actividad / caminatas)</option>
                  <option value="moderate">Moderado (3-5 días de entrenamiento con pesas o cardio)</option>
                  <option value="intense">Intenso (6-7 días de entrenamiento exigente)</option>
                  <option value="very_intense">Muy Intenso (Atleta competitivo / doble sesión diaria)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">Días de Entrenamiento a la Semana</label>
                <div className="mt-1 flex gap-2">
                  {[2, 3, 4, 5, 6, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setTrainingDays(days)}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                        trainingDays === days
                          ? 'bg-[#34d399] text-[#0a0f12]'
                          : 'bg-[#162229] text-[#94a3b8] border border-white/10 hover:text-white'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 4: SALUD, ALERGIAS Y NOTAS */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-white border-b border-white/10 pb-2">
              4. Preferencias Alimentarias & Historial de Salud
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">
                  Alergias o Intolerancias Alimentarias
                </label>
                <input
                  type="text"
                  placeholder="Ej. Intolerancia a la lactosa, celiaquía, alergia a mariscos..."
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#34d399]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">
                  Alimentos que no te gustan o prefieres evitar
                </label>
                <input
                  type="text"
                  placeholder="Ej. No me gusta el pescado, no tolero el brócoli..."
                  value={dislikedFoods}
                  onChange={(e) => setDislikedFoods(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#34d399]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8]">
                  Condiciones Médicas, Medicación o Notas para tu Nutricionista
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej. Resistencia a la insulina, hipotiroidismo controlado, horarios de trabajo rotativos..."
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#34d399]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Botones de Navegación Anterior / Siguiente / Finalizar */}
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#162229] px-4 py-2 text-xs font-bold text-[#94a3b8] hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleFinish}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2d6a4f] to-[#1b4337] px-6 py-2.5 text-xs font-bold text-white shadow-xl shadow-[#1b4337]/50 transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando expediente...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#a7f3d0]" />
                  Finalizar y Activar Expediente
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
