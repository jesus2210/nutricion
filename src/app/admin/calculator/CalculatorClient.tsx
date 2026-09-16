// LAYER: Interface
// Componente Interactivo de la Calculadora Antropométrica & Generador de Planes
'use client';

import { useState, useEffect } from 'react';
import { calculateEnergyExpenditure, EnergyExpenditureResult } from '@/domain/formulas/energy-expenditure';
import {
  calculateJacksonPollock3,
  calculateJacksonPollock7,
  calculateNavyBodyFat,
  BodyCompositionResult,
} from '@/domain/formulas/body-composition';
import { calculateMacros, autoDistributeMeals } from '@/domain/formulas/macro-calculator';
import { DailyPortions, MealDistribution } from '@/domain/entities/diet-plan';
import { saveDietPlanAction, createPatientByAdminAction } from './actions';
import SlideDeckPreview from '@/components/pdf/SlideDeckPreview';
import {
  Calculator,
  Flame,
  Activity,
  Sparkles,
  Check,
  ChevronRight,
  User,
  Plus,
  Minus,
  X,
  UserPlus,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface PatientOption {
  id: string;
  fullName: string;
  weightKg: number;
  initialWeightKg: number;
  gender: 'male' | 'female';
  birthDate: string;
  heightCm: number;
  targetGoal: string;
  activityLevel: string;
  bodyFatPercentage?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  neckCm?: number | null;
}

export default function CalculatorClient({
  patients,
  initialPatient,
}: {
  patients: PatientOption[];
  initialPatient?: PatientOption | null;
}) {
  const [activeTab, setActiveTab] = useState<'tdee' | 'composition' | 'plan'>('tdee');

  // El paciente predeterminado ya viene resuelto desde el servidor
  const defaultPatient = initialPatient ?? patients[0];

  // Lista local de pacientes para reflejar altas en caliente
  const [patientsList, setPatientsList] = useState<PatientOption[]>(patients);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(defaultPatient?.id || '');
  const selectedPatient = patientsList.find((p) => p.id === selectedPatientId);

  // Valores iniciales basados en el paciente predeterminado
  const initialWeight = Number(defaultPatient?.weightKg) || Number(defaultPatient?.initialWeightKg) || 55;
  const initialHeight = Number(defaultPatient?.heightCm) || 165;
  const initialGender = defaultPatient?.gender || 'female';
  const initialBirth = defaultPatient?.birthDate ? new Date(defaultPatient.birthDate) : new Date(1998, 5, 15);
  const initialAge = Math.max(15, new Date().getFullYear() - initialBirth.getFullYear());

  // Estados del modal de alta rápida de paciente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientGender, setNewPatientGender] = useState<'male' | 'female'>('female');
  const [newPatientBirthDate, setNewPatientBirthDate] = useState('1998-05-15');
  const [newPatientHeight, setNewPatientHeight] = useState<number>(165);
  const [newPatientWeight, setNewPatientWeight] = useState<number>(60);
  const [newPatientGoal, setNewPatientGoal] = useState('Recomposición');
  const [newPatientActivity, setNewPatientActivity] = useState('moderate');
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [createPatientError, setCreatePatientError] = useState<string | null>(null);

  // Estados para TDEE
  const [gender, setGender] = useState<'male' | 'female'>(initialGender);
  const [age, setAge] = useState<number>(initialAge);
  const [weightKg, setWeightKg] = useState<number>(initialWeight);
  const [heightCm, setHeightCm] = useState<number>(initialHeight);
  const [activityLevel, setActivityLevel] = useState<any>(defaultPatient?.activityLevel || 'moderate');
  const [bodyFatPct, setBodyFatPct] = useState<number | undefined>(
    defaultPatient?.bodyFatPercentage ? Number(defaultPatient.bodyFatPercentage) : undefined
  );

  // Resultados TDEE
  const tdeeResult: EnergyExpenditureResult = calculateEnergyExpenditure({
    gender,
    weightKg,
    heightCm,
    age,
    activityLevel,
    bodyFatPercentage: bodyFatPct,
  });

  // Estados para Composición Corporal (% Grasa)
  const [compMethod, setCompMethod] = useState<'jp3' | 'jp7' | 'navy'>(
    defaultPatient?.waistCm ? 'navy' : 'jp3'
  );
  const [jp3Folds, setJp3Folds] = useState({ chestOrTriceps: 15, abdomenOrSuprailiac: 18, thigh: 20 });
  const [jp7Folds, setJp7Folds] = useState({
    chest: 12,
    midaxillary: 14,
    triceps: 15,
    subscapular: 16,
    abdomen: 18,
    suprailiac: 19,
    thigh: 20,
  });
  const [navyMeasures, setNavyMeasures] = useState({
    neckCm: defaultPatient?.neckCm || 34,
    waistCm: defaultPatient?.waistCm || 70,
    hipCm: defaultPatient?.hipCm || 95,
  });

  let compResult: BodyCompositionResult;
  if (compMethod === 'jp3') {
    compResult = calculateJacksonPollock3(gender, age, weightKg, jp3Folds);
  } else if (compMethod === 'jp7') {
    compResult = calculateJacksonPollock7(gender, age, weightKg, jp7Folds);
  } else {
    compResult = calculateNavyBodyFat(weightKg, {
      gender,
      heightCm,
      neckCm: navyMeasures.neckCm,
      waistCm: navyMeasures.waistCm,
      hipCm: navyMeasures.hipCm,
    });
  }

  // Estados para Plan de Porciones y Comidas
  const [planTitle, setPlanTitle] = useState(
    defaultPatient ? `Plan de Alimentación • ${defaultPatient.fullName}` : 'Plan de Alimentación • Fase 1'
  );
  const [planGoal, setPlanGoal] = useState(defaultPatient?.targetGoal || 'Superávit Limpio / Recomposición');
  const [portions, setPortions] = useState<DailyPortions>({
    starch: 9,
    protein: 9,
    fat: 11,
    fruit: 2,
    dairy: 1,
  });

  const [meals, setMeals] = useState<MealDistribution[]>(() =>
    autoDistributeMeals({
      starch: 9,
      protein: 9,
      fat: 11,
      fruit: 2,
      dairy: 1,
    })
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sincronizar todos los campos de cálculo con el expediente del paciente
  function applyPatientData(p: PatientOption) {
    if (!p) return;
    const targetWeight = Number(p.weightKg || p.initialWeightKg || 60);
    setGender(p.gender || 'female');
    setWeightKg(targetWeight);
    setHeightCm(Number(p.heightCm) || 165);
    setPlanGoal(p.targetGoal || 'Recomposición');
    if (p.fullName) {
      setPlanTitle(`Plan de Alimentación • ${p.fullName}`);
    }
    setActivityLevel(p.activityLevel || 'moderate');
    if (p.birthDate) {
      const birth = new Date(p.birthDate);
      const diff = new Date().getFullYear() - birth.getFullYear();
      if (!isNaN(diff) && diff > 0) setAge(diff);
    }
    if (p.bodyFatPercentage) {
      setBodyFatPct(Number(p.bodyFatPercentage));
    }
    if (p.waistCm || p.neckCm || p.hipCm) {
      setNavyMeasures({
        neckCm: Number(p.neckCm) || 34,
        waistCm: Number(p.waistCm) || 70,
        hipCm: Number(p.hipCm) || 95,
      });
      setCompMethod('navy');
    }
  }

  // Sincronizar lista si las props del servidor se actualizan (alta de paciente en caliente)
  useEffect(() => {
    if (patients && patients.length > 0) {
      setPatientsList(patients);
    }
  }, [patients]);

  // Sincronizar datos al seleccionar un paciente existente manualmente en el dropdown
  function handleSelectPatient(patientId: string) {
    setSelectedPatientId(patientId);
    const p = patientsList.find((item) => item.id === patientId);
    if (p) {
      applyPatientData(p);
    }
  }

  // Dar de alta un nuevo paciente directamente desde la calculadora
  async function handleCreatePatient(e: React.FormEvent) {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientEmail.trim()) {
      setCreatePatientError('Por favor ingresa nombre y correo electrónico');
      return;
    }
    setIsCreatingPatient(true);
    setCreatePatientError(null);
    try {
      const res = await createPatientByAdminAction({
        fullName: newPatientName.trim(),
        email: newPatientEmail.trim(),
        gender: newPatientGender,
        birthDate: newPatientBirthDate,
        heightCm: Number(newPatientHeight),
        initialWeightKg: Number(newPatientWeight),
        targetGoal: newPatientGoal,
        activityLevel: newPatientActivity,
      });

      if (res?.success && res.patient) {
        const created: PatientOption = {
          ...res.patient,
          weightKg: res.patient.weightKg || res.patient.initialWeightKg,
        };
        setPatientsList((prev) => [created, ...prev]);
        setSelectedPatientId(created.id);
        applyPatientData(created);
        setIsModalOpen(false);
        setNewPatientName('');
        setNewPatientEmail('');
      } else {
        setCreatePatientError(res?.error || 'Error al registrar paciente');
      }
    } catch (err: any) {
      setCreatePatientError(err?.message || 'Error al registrar paciente');
    } finally {
      setIsCreatingPatient(false);
    }
  }

  function handleApplyBodyFat() {
    setBodyFatPct(compResult.bodyFatPercentage);
    setActiveTab('tdee');
  }

  function handleSelectCalorieGoal(targetCalories: number, goalLabel: string) {
    setPlanGoal(goalLabel);
    setActiveTab('plan');
  }

  function updatePortion(key: keyof DailyPortions, delta: number) {
    setPortions((prev) => {
      const updated = {
        ...prev,
        [key]: Math.max(0, prev[key] + delta),
      };
      setMeals(autoDistributeMeals(updated));
      return updated;
    });
  }

  function handleAutoDistributeMeals() {
    setMeals(autoDistributeMeals(portions));
  }

  function updateMealPortion(
    mealIdx: number,
    macro: 'starch' | 'protein' | 'fat' | 'fruit' | 'dairy',
    val: number
  ) {
    setMeals((prev) => {
      const copy = [...prev];
      if (!copy[mealIdx]) return prev;
      copy[mealIdx] = {
        ...copy[mealIdx],
        portions: {
          ...copy[mealIdx].portions,
          [macro]: Math.max(0, val),
        },
      };
      return copy;
    });
  }

  async function handleSavePlan() {
    if (!selectedPatientId) {
      alert('Por favor selecciona un paciente para asignarle el plan');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await saveDietPlanAction({
        patientId: selectedPatientId,
        title: planTitle,
        goal: planGoal,
        portions,
        meals,
        weightKg,
      });

      if (res?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert(res?.error || 'Error al guardar');
      }
    } finally {
      setIsSaving(false);
    }
  }

  const currentMacros = calculateMacros(portions, weightKg);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
            Calculadora Antropométrica & Generador
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Calcula el gasto energético, porcentaje de grasa y diseña planes con diapositivas 16:9 HD
          </p>
        </div>

        {/* Selector de Paciente & Botón Registrar */}
        <div className="flex flex-wrap items-center gap-2">
          {patientsList.length > 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111a1f] px-3 py-1.5 shadow-sm">
              <User className="h-4 w-4 text-[#34d399]" />
              <span className="text-xs text-[#94a3b8]">Paciente:</span>
              <select
                value={selectedPatientId}
                onChange={(e) => handleSelectPatient(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#111a1f] text-white">
                    {p.fullName} ({p.weightKg || p.initialWeightKg} kg)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
              Sin pacientes registrados
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            + Registrar Paciente
          </button>
        </div>
      </div>

      {/* Banner de Sincronización con el Paciente Seleccionado */}
      {selectedPatient && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#245748] bg-[#0f2720]/60 p-3 px-4 text-xs">
          <div className="flex items-center gap-2.5 text-[#a7f3d0]">
            <CheckCircle2 className="h-4 w-4 text-[#34d399] shrink-0" />
            <span>
              Expediente activo: <strong className="text-white">{selectedPatient.fullName}</strong> • Peso actual: <strong className="text-white">{weightKg} kg</strong> • Altura: <strong className="text-white">{heightCm} cm</strong> • Edad: <strong className="text-white">{age} años</strong>
            </span>
          </div>
          <span className="rounded-md bg-[#14352b] px-2 py-0.5 text-[11px] font-semibold text-[#34d399] border border-[#245748]">
            Objetivo: {planGoal}
          </span>
        </div>
      )}

      {/* Aviso amigable si la lista está vacía */}
      {patientsList.length === 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#34d399]/30 bg-[#14352b]/40 p-4 text-xs text-[#a7f3d0]">
          <div className="flex items-center gap-2.5">
            <UserPlus className="h-5 w-5 text-[#34d399] shrink-0" />
            <span>
              <strong>Aún no tienes pacientes registrados en el sistema.</strong> Puedes registrar a tu paciente ahora mismo con el botón para cargar sus medidas y asignarle este plan directamente.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="whitespace-nowrap rounded-xl bg-[#34d399] px-3 py-1.5 font-bold text-[#0d1518] hover:bg-[#34d399]/90 transition"
          >
            + Registrar Paciente Ahora
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('tdee')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'tdee'
              ? 'border border-[#245748] bg-[#14352b] text-white shadow-md'
              : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
          }`}
        >
          <Flame className="h-4 w-4 text-[#f59e0b]" />
          1. Gasto Energético (TDEE)
        </button>

        <button
          onClick={() => setActiveTab('composition')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'composition'
              ? 'border border-[#245748] bg-[#14352b] text-white shadow-md'
              : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
          }`}
        >
          <Activity className="h-4 w-4 text-[#38bdf8]" />
          2. Composición Corporal (% Grasa)
        </button>

        <button
          onClick={() => setActiveTab('plan')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'plan'
              ? 'border border-[#245748] bg-[#14352b] text-white shadow-md'
              : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4 text-[#34d399]" />
          3. Generador de Plan (16:9 HD)
        </button>
      </div>

      {/* TAB 1: TDEE */}
      {activeTab === 'tdee' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Inputs */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111a1f] p-6">
            <h2 className="font-heading text-base font-bold text-white">Parámetros del Paciente</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#94a3b8]">Sexo</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="female">Femenino</option>
                  <option value="male">Masculino</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8]">Edad</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#94a3b8]">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8]">Altura (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#94a3b8]">Nivel de Actividad Física</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="sedentary">Sedentario (x1.20) • Trabajo de escritorio</option>
                <option value="light">Ligero (x1.375) • Ejercicio 1-3 días</option>
                <option value="moderate">Moderado (x1.55) • Pesas + Cardio 3-5 días</option>
                <option value="intense">Intenso (x1.725) • Ejercicio 6-7 días</option>
                <option value="very_intense">Muy Intenso (x1.90) • Atleta / Doble sesión</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#94a3b8]">% Grasa Corporal (Opcional)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 18.5"
                  value={bodyFatPct || ''}
                  onChange={(e) => setBodyFatPct(e.target.value ? Number(e.target.value) : undefined)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  onClick={() => setActiveTab('composition')}
                  className="mt-1 shrink-0 rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs font-semibold text-[#a7f3d0] hover:bg-[#1e2e38]"
                >
                  Medir % GC
                </button>
              </div>
            </div>
          </div>

          {/* Resultados TDEE & Fórmulas */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111a1f] p-6 lg:col-span-2">
            <h2 className="font-heading text-base font-bold text-white">Gasto Energético Calculado</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#245748] bg-gradient-to-br from-[#14352b] to-[#0f2720] p-5 text-center shadow-lg shadow-[#14352b]/40">
                <div className="text-xs font-bold uppercase tracking-wider text-[#a7f3d0]">
                  Gasto Total Diario (TDEE)
                </div>
                <div className="mt-1 font-heading text-4xl font-extrabold text-white">
                  {tdeeResult.tdee.toLocaleString('es-ES')}
                </div>
                <div className="text-xs text-[#94a3b8]">kcal necesarias para mantener peso</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#162229] p-5">
                <div className="border-b border-white/10 pb-2 text-xs font-bold text-white">
                  Comparativa de BMR (Metabolismo Basal)
                </div>
                <div className="mt-2 space-y-1.5 text-xs text-[#94a3b8]">
                  <div className="flex justify-between">
                    <span>Mifflin-St Jeor:</span> <strong className="text-white">{tdeeResult.bmrMifflin} kcal</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Harris-Benedict:</span> <strong className="text-white">{tdeeResult.bmrHarrisBenedict} kcal</strong>
                  </div>
                  {tdeeResult.bmrKatchMcArdle && (
                    <div className="flex justify-between text-[#34d399]">
                      <span>Katch-McArdle (% GC):</span> <strong>{tdeeResult.bmrKatchMcArdle} kcal</strong>
                    </div>
                  )}
                  {tdeeResult.bmrCunningham && (
                    <div className="flex justify-between">
                      <span>Cunningham:</span> <strong className="text-white">{tdeeResult.bmrCunningham} kcal</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Objetivos calóricos con botón de transferencia directa al Plan */}
            <div>
              <div className="text-xs font-bold text-white mb-3">Objetivos Calóricos Sugeridos:</div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <button
                  onClick={() => handleSelectCalorieGoal(tdeeResult.targetCaloriesByGoal.moderateDeficit, 'Déficit Moderado')}
                  className="rounded-xl border border-white/10 bg-[#162229] p-3 text-left transition hover:border-[#34d399] hover:bg-[#1e2e38]"
                >
                  <div className="text-xs text-[#94a3b8]">Déficit Moderado (-18%)</div>
                  <div className="font-heading text-lg font-bold text-[#f59e0b]">
                    {tdeeResult.targetCaloriesByGoal.moderateDeficit} kcal
                  </div>
                  <div className="text-[10px] text-[#34d399]">Transferir a Plan →</div>
                </button>

                <button
                  onClick={() => handleSelectCalorieGoal(tdeeResult.targetCaloriesByGoal.recomposition, 'Recomposición')}
                  className="rounded-xl border border-white/10 bg-[#162229] p-3 text-left transition hover:border-[#34d399] hover:bg-[#1e2e38]"
                >
                  <div className="text-xs text-[#94a3b8]">Recomposición (-5%)</div>
                  <div className="font-heading text-lg font-bold text-[#38bdf8]">
                    {tdeeResult.targetCaloriesByGoal.recomposition} kcal
                  </div>
                  <div className="text-[10px] text-[#34d399]">Transferir a Plan →</div>
                </button>

                <button
                  onClick={() => handleSelectCalorieGoal(tdeeResult.targetCaloriesByGoal.cleanSurplus, 'Superávit Limpio')}
                  className="rounded-xl border border-white/10 bg-[#162229] p-3 text-left transition hover:border-[#34d399] hover:bg-[#1e2e38]"
                >
                  <div className="text-xs text-[#94a3b8]">Superávit Limpio (+10%)</div>
                  <div className="font-heading text-lg font-bold text-[#34d399]">
                    {tdeeResult.targetCaloriesByGoal.cleanSurplus} kcal
                  </div>
                  <div className="text-[10px] text-[#34d399]">Transferir a Plan →</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPOSICIÓN CORPORAL */}
      {activeTab === 'composition' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Configuración de Método */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111a1f] p-6">
            <h2 className="font-heading text-base font-bold text-white">Método Antropométrico</h2>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setCompMethod('jp3')}
                className={`rounded-xl border p-3 text-left text-xs font-bold transition ${
                  compMethod === 'jp3'
                    ? 'border-[#34d399] bg-[#14352b] text-white'
                    : 'border-white/10 bg-[#162229] text-[#94a3b8] hover:text-white'
                }`}
              >
                Jackson-Pollock 3 Pliegues
              </button>
              <button
                onClick={() => setCompMethod('jp7')}
                className={`rounded-xl border p-3 text-left text-xs font-bold transition ${
                  compMethod === 'jp7'
                    ? 'border-[#34d399] bg-[#14352b] text-white'
                    : 'border-white/10 bg-[#162229] text-[#94a3b8] hover:text-white'
                }`}
              >
                Jackson-Pollock 7 Pliegues
              </button>
              <button
                onClick={() => setCompMethod('navy')}
                className={`rounded-xl border p-3 text-left text-xs font-bold transition ${
                  compMethod === 'navy'
                    ? 'border-[#34d399] bg-[#14352b] text-white'
                    : 'border-white/10 bg-[#162229] text-[#94a3b8] hover:text-white'
                }`}
              >
                Método US Navy (Cinta Métrica)
              </button>
            </div>

            {/* Inputs según método */}
            {compMethod === 'jp3' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-[#94a3b8]">
                    {gender === 'male' ? 'Pecho (mm)' : 'Tríceps (mm)'}
                  </label>
                  <input
                    type="number"
                    value={jp3Folds.chestOrTriceps}
                    onChange={(e) => setJp3Folds({ ...jp3Folds, chestOrTriceps: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8]">
                    {gender === 'male' ? 'Abdomen (mm)' : 'Suprailiaco (mm)'}
                  </label>
                  <input
                    type="number"
                    value={jp3Folds.abdomenOrSuprailiac}
                    onChange={(e) => setJp3Folds({ ...jp3Folds, abdomenOrSuprailiac: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8]">Muslo Anterior (mm)</label>
                  <input
                    type="number"
                    value={jp3Folds.thigh}
                    onChange={(e) => setJp3Folds({ ...jp3Folds, thigh: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {compMethod === 'navy' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-[#94a3b8]">Cuello (cm)</label>
                  <input
                    type="number"
                    value={navyMeasures.neckCm}
                    onChange={(e) => setNavyMeasures({ ...navyMeasures, neckCm: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8]">Cintura (cm)</label>
                  <input
                    type="number"
                    value={navyMeasures.waistCm}
                    onChange={(e) => setNavyMeasures({ ...navyMeasures, waistCm: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                {gender === 'female' && (
                  <div>
                    <label className="block text-xs text-[#94a3b8]">Cadera (cm)</label>
                    <input
                      type="number"
                      value={navyMeasures.hipCm}
                      onChange={(e) => setNavyMeasures({ ...navyMeasures, hipCm: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resultados de Composición */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111a1f] p-6 lg:col-span-2">
            <h2 className="font-heading text-base font-bold text-white">Composición Corporal Estimada</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#245748] bg-[#14352b] p-5 text-center shadow-lg">
                <div className="text-xs font-bold uppercase text-[#a7f3d0]">% Grasa Corporal</div>
                <div className="mt-1 font-heading text-4xl font-extrabold text-white">
                  {compResult.bodyFatPercentage}%
                </div>
                <div className="text-xs capitalize text-[#34d399]">Categoría: {compResult.category}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#162229] p-5 text-center">
                <div className="text-xs text-[#94a3b8]">Masa Magra (Músculo + Hueso)</div>
                <div className="mt-1 font-heading text-3xl font-extrabold text-[#38bdf8]">
                  {compResult.leanMassKg} kg
                </div>
                <div className="text-xs text-[#64748b]">LBM estimado</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#162229] p-5 text-center">
                <div className="text-xs text-[#94a3b8]">Masa Grasa</div>
                <div className="mt-1 font-heading text-3xl font-extrabold text-[#f59e0b]">
                  {compResult.fatMassKg} kg
                </div>
                <div className="text-xs text-[#64748b]">Tejido adiposo</div>
              </div>
            </div>

            <button
              onClick={handleApplyBodyFat}
              className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#1b4337]/50 transition hover:brightness-110"
            >
              <Check className="h-4 w-4" />
              Aplicar este % Grasa ({compResult.bodyFatPercentage}%) al cálculo de TDEE
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: GENERADOR DE PLAN */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {/* Controles de Porciones y Comidas */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111a1f] p-5 lg:col-span-4 xl:col-span-3">
              <h2 className="font-heading text-base font-bold text-white">Configuración del Plan</h2>

              <div>
                <label className="block text-xs text-[#94a3b8]">Título del Plan</label>
                <input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#94a3b8]">Objetivo</label>
                <input
                  type="text"
                  value={planGoal}
                  onChange={(e) => setPlanGoal(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Steppers de Porciones */}
              <div className="space-y-2.5 pt-2">
                <div className="text-xs font-bold text-[#e2e8f0]">Porciones Diarias:</div>

                {[
                  { key: 'starch', label: 'Almidones', color: 'border-l-4 border-[#d97706]' },
                  { key: 'protein', label: 'Proteínas', color: 'border-l-4 border-[#2563eb]' },
                  { key: 'fat', label: 'Grasas', color: 'border-l-4 border-[#15803d]' },
                  { key: 'fruit', label: 'Frutas', color: 'border-l-4 border-[#dc2626]' },
                  { key: 'dairy', label: 'Lácteos', color: 'border-l-4 border-[#0891b2]' },
                ].map(({ key, label, color }) => (
                  <div
                    key={key}
                    className={`flex items-center justify-between rounded-xl bg-[#162229] p-2.5 ${color}`}
                  >
                    <span className="text-xs font-semibold text-white">{label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updatePortion(key as any, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">
                        {portions[key as keyof DailyPortions]}
                      </span>
                      <button
                        onClick={() => updatePortion(key as any, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Distribución de Comidas (Como en el Vanilla JS) */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                      Distribución en Comidas
                    </h3>
                    <p className="text-[11px] text-[#94a3b8]">Porciones asignadas por comida</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoDistributeMeals}
                    className="flex items-center gap-1 rounded-lg bg-[#1b4337] px-2.5 py-1 text-[11px] font-semibold text-[#a7f3d0] border border-[#245748] hover:bg-[#2d6a4f] transition shadow-sm"
                    title="Auto-distribuir las porciones del día en las 4 comidas"
                  >
                    <Sparkles className="h-3 w-3" />
                    Auto
                  </button>
                </div>

                <div className="space-y-2.5">
                  {meals.map((meal, mealIdx) => (
                    <div
                      key={meal.id || mealIdx}
                      className="rounded-xl border border-white/10 bg-[#162229] p-2.5 space-y-1.5"
                    >
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span className="text-[#a7f3d0]">{meal.name}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-center">
                        <div className="bg-[#111a1f] p-1 rounded border border-white/5" title="Almidones">
                          <span className="text-[9px] text-[#d97706] font-bold block">🌾 Alm</span>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={meal.portions.starch}
                            onChange={(e) => updateMealPortion(mealIdx, 'starch', parseInt(e.target.value) || 0)}
                            className="w-full text-center bg-transparent text-xs font-bold text-white focus:outline-none"
                          />
                        </div>
                        <div className="bg-[#111a1f] p-1 rounded border border-white/5" title="Proteínas">
                          <span className="text-[9px] text-[#3b82f6] font-bold block">🍗 Prot</span>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={meal.portions.protein}
                            onChange={(e) => updateMealPortion(mealIdx, 'protein', parseInt(e.target.value) || 0)}
                            className="w-full text-center bg-transparent text-xs font-bold text-white focus:outline-none"
                          />
                        </div>
                        <div className="bg-[#111a1f] p-1 rounded border border-white/5" title="Grasas">
                          <span className="text-[9px] text-[#10b981] font-bold block">🥑 Gra</span>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={meal.portions.fat}
                            onChange={(e) => updateMealPortion(mealIdx, 'fat', parseInt(e.target.value) || 0)}
                            className="w-full text-center bg-transparent text-xs font-bold text-white focus:outline-none"
                          />
                        </div>
                        <div className="bg-[#111a1f] p-1 rounded border border-white/5" title="Frutas">
                          <span className="text-[9px] text-[#ef4444] font-bold block">🍎 Fru</span>
                          <input
                            type="number"
                            min="0"
                            max="15"
                            value={meal.portions.fruit ?? 0}
                            onChange={(e) => updateMealPortion(mealIdx, 'fruit', parseInt(e.target.value) || 0)}
                            className="w-full text-center bg-transparent text-xs font-bold text-white focus:outline-none"
                          />
                        </div>
                        <div className="bg-[#111a1f] p-1 rounded border border-white/5" title="Lácteos">
                          <span className="text-[9px] text-[#06b6d4] font-bold block">🥛 Lác</span>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={meal.portions.dairy ?? 0}
                            onChange={(e) => updateMealPortion(mealIdx, 'dairy', parseInt(e.target.value) || 0)}
                            className="w-full text-center bg-transparent text-xs font-bold text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {saveSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-[#14352b] p-3 text-xs text-[#a7f3d0]">
                  <Check className="h-4 w-4 text-[#34d399]" />
                  <span>¡Plan guardado y asignado al paciente con éxito!</span>
                </div>
              )}
            </div>

            {/* Vista Previa de Diapositivas 16:9 con PDF Export */}
            <div className="lg:col-span-8 xl:col-span-9">
              <SlideDeckPreview
                patientName={selectedPatient?.fullName || 'Paciente'}
                weightKg={weightKg}
                goal={planGoal}
                portions={portions}
                meals={meals}
                onSaveToPatient={handleSavePlan}
                isSaving={isSaving}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para Registrar Paciente en Caliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#111a1f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#34d399]" />
                <h3 className="font-heading text-lg font-bold text-white">Registrar Nuevo Paciente</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-[#94a3b8] hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="mt-4 space-y-4">
              {createPatientError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  {createPatientError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#94a3b8]">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Génesis Ortiz"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34d399]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#94a3b8]">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="paciente@correo.com"
                    value={newPatientEmail}
                    onChange={(e) => setNewPatientEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34d399]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">Sexo</label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="female">Femenino</option>
                    <option value="male">Masculino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    required
                    value={newPatientBirthDate}
                    onChange={(e) => setNewPatientBirthDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">Peso Actual (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newPatientWeight}
                    onChange={(e) => setNewPatientWeight(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">Altura (cm) *</label>
                  <input
                    type="number"
                    required
                    value={newPatientHeight}
                    onChange={(e) => setNewPatientHeight(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">Objetivo Principal</label>
                  <select
                    value={newPatientGoal}
                    onChange={(e) => setNewPatientGoal(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Recomposición">Recomposición</option>
                    <option value="Déficit">Déficit Calórico</option>
                    <option value="Superávit">Superávit Calórico</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">Nivel de Actividad</label>
                  <select
                    value={newPatientActivity}
                    onChange={(e) => setNewPatientActivity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="sedentary">Sedentario (Oficina / Sin ejercicio)</option>
                    <option value="light">Ligero (1-3 días/semana)</option>
                    <option value="moderate">Moderado (3-5 días/semana)</option>
                    <option value="intense">Intenso (6-7 días/semana)</option>
                    <option value="very_intense">Muy Intenso (Atleta / Doble sesión)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#94a3b8] hover:bg-white/10 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPatient}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-4 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-50"
                >
                  {isCreatingPatient ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Guardar y Seleccionar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
