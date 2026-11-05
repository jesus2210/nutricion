// LAYER: Interface
// Constructor Avanzado de Rutinas de Entrenamiento y Gestor de Progresión de Cargas (Admin)
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  EXERCISE_LIBRARY,
  MUSCLE_GROUPS,
  WORKOUT_TEMPLATES,
  SET_METHOD_LABELS,
  SUPERSET_OPTIONS,
  MuscleGroup,
  SetMethod,
  WorkoutDay,
  RoutineExercise,
  WorkoutPlan,
  WorkoutLogEntry,
  ExerciseCatalogItem,
} from '@/domain/entities/workout';
import { saveWorkoutPlanAction } from './actions';
import WorkoutSessionTracker from '@/components/portal/WorkoutSessionTracker';
import RegisterPatientModalButton from '@/components/admin/RegisterPatientModalButton';
import {
  Dumbbell,
  Plus,
  Trash2,
  Search,
  Check,
  Sparkles,
  User,
  ArrowUp,
  ArrowDown,
  Link2,
  History,
  Settings2,
  CheckCircle2,
  Loader2,
  Copy,
  TrendingUp,
} from 'lucide-react';

export interface PatientWorkoutSummary {
  id: string;
  fullName: string;
  gender: 'male' | 'female';
  weightKg: number;
  targetGoal: string;
  activePlan: WorkoutPlan | null;
  logs: WorkoutLogEntry[];
}

interface WorkoutsAdminClientProps {
  patients: PatientWorkoutSummary[];
  initialPatientId?: string;
}

export default function WorkoutsAdminClient({
  patients,
  initialPatientId,
}: WorkoutsAdminClientProps) {
  const router = useRouter();
  const [patientsList, setPatientsList] = useState<PatientWorkoutSummary[]>(patients);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || patients[0]?.id || ''
  );

  const selectedPatient =
    patientsList.find((p) => p.id === selectedPatientId) || patientsList[0] || null;

  const [activeTab, setActiveTab] = useState<'builder' | 'tracker'>('builder');

  // Estado del constructor de rutina
  const defaultTemplate = WORKOUT_TEMPLATES[0];
  const initialPlan = selectedPatient?.activePlan;

  const [routineTitle, setRoutineTitle] = useState<string>(
    initialPlan?.title ||
      (selectedPatient
        ? `Rutina de Entrenamiento • ${selectedPatient.fullName}`
        : defaultTemplate.title)
  );
  const [routineGoal, setRoutineGoal] = useState<string>(
    initialPlan?.goal || selectedPatient?.targetGoal || 'Hipertrofia & Sobrecarga Progresiva'
  );
  const [routineDays, setRoutineDays] = useState<WorkoutDay[]>(
    initialPlan?.days && initialPlan.days.length > 0
      ? initialPlan.days
      : structuredClone(defaultTemplate.days)
  );
  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);

  // Filtros de la Biblioteca de Ejercicios
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'Todos'>('Todos');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('Todos');

  // Ejercicio personalizado al vuelo
  const [customExName, setCustomExName] = useState('');
  const [customExMuscle, setCustomExMuscle] = useState<MuscleGroup>('Pecho');
  const [customExEquipment, setCustomExEquipment] = useState('Máquina');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentDay: WorkoutDay | undefined = routineDays[activeDayIdx] || routineDays[0];

  // Sincronizar al cambiar de paciente en el selector
  function handleSelectPatient(newPatientId: string) {
    setSelectedPatientId(newPatientId);
    const pat = patientsList.find((p) => p.id === newPatientId);
    if (!pat) return;

    if (pat.activePlan && pat.activePlan.days?.length > 0) {
      setRoutineTitle(pat.activePlan.title);
      setRoutineGoal(pat.activePlan.goal);
      setRoutineDays(structuredClone(pat.activePlan.days));
      setActiveDayIdx(0);
    } else {
      setRoutineTitle(`Rutina de Entrenamiento • ${pat.fullName}`);
      setRoutineGoal(pat.targetGoal || 'Hipertrofia & Recomposición');
      setRoutineDays(structuredClone(defaultTemplate.days));
      setActiveDayIdx(0);
    }
    setSaveSuccess(false);
    setSaveError(null);
  }

  // Cargar una plantilla predefinida
  function handleLoadTemplate(templateId: string) {
    const tpl = WORKOUT_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setRoutineTitle(
      selectedPatient ? `${tpl.title} • ${selectedPatient.fullName}` : tpl.title
    );
    setRoutineGoal(tpl.goal);
    setRoutineDays(structuredClone(tpl.days));
    setActiveDayIdx(0);
  }

  // Gestión de días de la rutina
  function handleAddDay() {
    const nextNum = routineDays.length + 1;
    const newDay: WorkoutDay = {
      id: `day-${Date.now()}`,
      name: `Día ${nextNum} • Sesión ${nextNum}`,
      focus: 'Personalizado',
      exercises: [],
    };
    setRoutineDays((prev) => [...prev, newDay]);
    setActiveDayIdx(routineDays.length);
  }

  function handleDuplicateDay(dayIdx: number) {
    const source = routineDays[dayIdx];
    if (!source) return;
    const copy: WorkoutDay = {
      ...structuredClone(source),
      id: `day-${Date.now()}`,
      name: `${source.name} (Copia)`,
      exercises: source.exercises.map((ex) => ({
        ...ex,
        id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    };
    setRoutineDays((prev) => [...prev, copy]);
    setActiveDayIdx(routineDays.length);
  }

  function handleDeleteDay(dayIdx: number) {
    if (routineDays.length <= 1) return;
    setRoutineDays((prev) => prev.filter((_, idx) => idx !== dayIdx));
    setActiveDayIdx((prev) => Math.max(0, prev - 1));
  }

  function updateCurrentDayMeta(field: 'name' | 'focus', value: string) {
    setRoutineDays((prev) => {
      const copy = [...prev];
      if (!copy[activeDayIdx]) return prev;
      copy[activeDayIdx] = {
        ...copy[activeDayIdx],
        [field]: value,
      };
      return copy;
    });
  }

  // Agregar ejercicio desde la biblioteca al día actual
  function handleAddExerciseFromCatalog(item: ExerciseCatalogItem) {
    const newEx: RoutineExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      exerciseId: item.id,
      name: item.name,
      muscleGroup: item.muscleGroup,
      equipment: item.equipment,
      targetSets: item.defaultSets,
      targetReps: item.defaultReps,
      targetRir: item.defaultRir,
      restSeconds: item.defaultRestSeconds,
      setMethod: 'normal',
      supersetGroup: null,
      coachNotes: item.tips || '',
    };

    setRoutineDays((prev) => {
      const copy = [...prev];
      if (!copy[activeDayIdx]) return prev;
      copy[activeDayIdx] = {
        ...copy[activeDayIdx],
        exercises: [...copy[activeDayIdx].exercises, newEx],
      };
      return copy;
    });
  }

  // Agregar ejercicio personalizado creado por el admin
  function handleAddCustomExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!customExName.trim()) return;
    const customItem: ExerciseCatalogItem = {
      id: `custom-${Date.now()}`,
      name: customExName.trim(),
      muscleGroup: customExMuscle,
      equipment: customExEquipment,
      defaultSets: 3,
      defaultReps: '8-12',
      defaultRir: 'RIR 1-2',
      defaultRestSeconds: 90,
    };
    handleAddExerciseFromCatalog(customItem);
    setCustomExName('');
  }

  // Editar un ejercicio dentro del día actual
  function updateRoutineExercise(
    exIdx: number,
    field: keyof RoutineExercise,
    value: any
  ) {
    setRoutineDays((prev) => {
      const copy = [...prev];
      const day = { ...copy[activeDayIdx] };
      const exercises = [...day.exercises];
      exercises[exIdx] = {
        ...exercises[exIdx],
        [field]: value,
      };
      day.exercises = exercises;
      copy[activeDayIdx] = day;
      return copy;
    });
  }

  function moveExercise(exIdx: number, direction: -1 | 1) {
    setRoutineDays((prev) => {
      const copy = [...prev];
      const day = { ...copy[activeDayIdx] };
      const exercises = [...day.exercises];
      const targetIdx = exIdx + direction;
      if (targetIdx < 0 || targetIdx >= exercises.length) return prev;
      const temp = exercises[exIdx];
      exercises[exIdx] = exercises[targetIdx];
      exercises[targetIdx] = temp;
      day.exercises = exercises;
      copy[activeDayIdx] = day;
      return copy;
    });
  }

  function removeExercise(exIdx: number) {
    setRoutineDays((prev) => {
      const copy = [...prev];
      const day = { ...copy[activeDayIdx] };
      day.exercises = day.exercises.filter((_, idx) => idx !== exIdx);
      copy[activeDayIdx] = day;
      return copy;
    });
  }

  // Buscar última marca registrada por el paciente en un ejercicio para orientar al coach
  function getLastLoggedMarkForExercise(exerciseName: string, exerciseId?: string): string | null {
    const patLogs = selectedPatient?.logs || [];
    for (const log of patLogs) {
      const match = (log.exercises || []).find(
        (e) =>
          (exerciseId && e.exerciseId === exerciseId) ||
          e.exerciseName.toLowerCase().trim() === exerciseName.toLowerCase().trim()
      );
      if (match && match.sets?.length > 0) {
        const setsStr = match.sets
          .map((s) => `${s.weightKg}kg×${s.reps} (RIR ${s.rir})`)
          .join(', ');
        return `${log.logDate}: ${setsStr}`;
      }
    }
    return null;
  }

  // Filtrar catálogo de ejercicios
  const filteredCatalog = useMemo(() => {
    return EXERCISE_LIBRARY.filter((item) => {
      if (selectedMuscle !== 'Todos' && item.muscleGroup !== selectedMuscle) return false;
      if (
        selectedEquipment !== 'Todos' &&
        !item.equipment.toLowerCase().includes(selectedEquipment.toLowerCase())
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.muscleGroup.toLowerCase().includes(q) ||
          item.equipment.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, selectedMuscle, selectedEquipment]);

  async function handleSaveRoutine() {
    if (!selectedPatientId) {
      setSaveError('Por favor selecciona o registra un paciente primero.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await saveWorkoutPlanAction({
        patientId: selectedPatientId,
        title: routineTitle,
        goal: routineGoal,
        days: routineDays,
      });

      if (res?.success && res.plan) {
        setSaveSuccess(true);
        setPatientsList((prev) =>
          prev.map((p) =>
            p.id === selectedPatientId ? { ...p, activePlan: res.plan! } : p
          )
        );
        router.refresh();
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res?.error || 'Error al guardar la rutina');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Error inesperado al guardar');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabecera y Selector de Paciente */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
            Constructor de Rutinas & Control de Cargas
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Diseña rutinas detalladas (series, repeticiones, RIR, biseries, drop sets) y supervisa el progreso de pesos de cada paciente
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {patientsList.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111a1f] px-3.5 py-2 shadow-sm">
              <User className="h-4 w-4 text-[#34d399]" />
              <span className="text-xs text-[#94a3b8]">Paciente:</span>
              <select
                value={selectedPatientId}
                onChange={(e) => handleSelectPatient(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-white focus:outline-none cursor-pointer"
              >
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#111a1f] text-white">
                    {p.fullName} {p.activePlan ? '• (Con Rutina)' : '• (Sin Rutina)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <RegisterPatientModalButton
            buttonLabel="+ Nuevo Paciente"
            variant="secondary"
            onPatientCreated={(newPat) => {
              const summary: PatientWorkoutSummary = {
                id: newPat.id,
                fullName: newPat.fullName,
                gender: newPat.gender,
                weightKg: newPat.weightKg,
                targetGoal: newPat.targetGoal,
                activePlan: null,
                logs: [],
              };
              setPatientsList((prev) => [summary, ...prev]);
              setSelectedPatientId(summary.id);
              setRoutineTitle(`Rutina de Entrenamiento • ${summary.fullName}`);
            }}
          />
        </div>
      </div>

      {/* Pestañas Principales: Constructor de Rutina vs Registro & Progreso */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === 'builder'
                ? 'border border-[#245748] bg-[#14352b] text-white shadow-md'
                : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
            }`}
          >
            <Settings2 className="h-4 w-4 text-[#34d399]" />
            1. Armar / Editar Rutina ({routineDays.length} Días)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === 'tracker'
                ? 'border border-[#245748] bg-[#14352b] text-white shadow-md'
                : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
            }`}
          >
            <History className="h-4 w-4 text-[#38bdf8]" />
            2. Registrar Entreno / Ver Cargas ({selectedPatient?.logs?.length || 0} sesiones)
          </button>
        </div>

        {/* Botones de Plantillas Rápidas */}
        {activeTab === 'builder' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#94a3b8] mr-1">
              Plantillas base:
            </span>
            {WORKOUT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleLoadTemplate(tpl.id)}
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#162229] px-2.5 py-1.5 text-[11px] font-bold text-[#a7f3d0] hover:border-[#34d399] hover:text-white transition cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-[#34d399]" />
                {tpl.title.split('•')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ==================== TAB 1: CONSTRUCTOR DE RUTINAS ==================== */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* Título de la Rutina, Objetivo y Botón Guardar */}
          <div className="grid grid-cols-1 gap-4 rounded-3xl border border-white/10 bg-[#111a1f] p-5 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <label className="block text-xs font-bold text-[#94a3b8]">
                Nombre de la Rutina / Mesociclo
              </label>
              <input
                type="text"
                value={routineTitle}
                onChange={(e) => setRoutineTitle(e.target.value)}
                placeholder="Ej. Mesociclo 1 • Torso / Pierna Hipertrofia"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-xs font-bold text-white focus:border-[#34d399] focus:outline-none"
              />
            </div>

            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-[#94a3b8]">
                Enfoque / Objetivo del Plan
              </label>
              <input
                type="text"
                value={routineGoal}
                onChange={(e) => setRoutineGoal(e.target.value)}
                placeholder="Ej. Sobrecarga Progresiva RIR 1-2"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-xs text-white focus:border-[#34d399] focus:outline-none"
              />
            </div>

            <div className="lg:col-span-3">
              <button
                type="button"
                onClick={handleSaveRoutine}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-[#1b4337]/40 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Asignando Rutina...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Guardar y Asignar a {selectedPatient?.fullName.split(' ')[0] || 'Paciente'}
                  </>
                )}
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#34d399]/40 bg-[#14352b] p-4 text-xs font-bold text-[#a7f3d0]">
              <CheckCircle2 className="h-5 w-5 text-[#34d399]" />
              <span>
                ¡Rutina guardada y asignada exitosamente a {selectedPatient?.fullName}! Ya está disponible en su portal para registrar pesos, repeticiones y RIR.
              </span>
            </div>
          )}

          {saveError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
              {saveError}
            </div>
          )}

          {/* Barra de Días de Entrenamiento */}
          <div className="flex flex-wrap items-center gap-2">
            {routineDays.map((day, idx) => {
              const isSelected = idx === activeDayIdx;
              return (
                <button
                  key={day.id || idx}
                  type="button"
                  onClick={() => setActiveDayIdx(idx)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? 'border-[#34d399] bg-[#14352b] text-white shadow-md'
                      : 'border-white/10 bg-[#111a1f] text-[#94a3b8] hover:bg-[#162229] hover:text-white'
                  }`}
                >
                  <span>{day.name}</span>
                  <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-[#34d399]">
                    {day.exercises.length} ej.
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleAddDay}
              className="flex items-center gap-1.5 rounded-2xl border border-dashed border-[#34d399]/50 bg-[#14352b]/30 px-3.5 py-2.5 text-xs font-bold text-[#34d399] hover:bg-[#14352b]/60 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              + Añadir Día de Entreno
            </button>
          </div>

          {/* Grid Principal: Izquierda (Ejercicios del Día) | Derecha (Biblioteca de +125 Ejercicios) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* COLUMNA IZQUIERDA (7 cols): Configuración de los Ejercicios del Día Seleccionado */}
            <div className="space-y-4 lg:col-span-7">
              {currentDay && (
                <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-5 space-y-4">
                  {/* Datos del Día Actual */}
                  <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#94a3b8]">
                          Nombre de la Sesión / Día
                        </label>
                        <input
                          type="text"
                          value={currentDay.name}
                          onChange={(e) => updateCurrentDayMeta('name', e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs font-bold text-white focus:border-[#34d399] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#94a3b8]">
                          Grupos Musculares / Enfoque
                        </label>
                        <input
                          type="text"
                          value={currentDay.focus}
                          onChange={(e) => updateCurrentDayMeta('focus', e.target.value)}
                          placeholder="Ej. Pecho, Espalda y Brazos"
                          className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs text-white focus:border-[#34d399] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDuplicateDay(activeDayIdx)}
                        className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#162229] px-2.5 py-1.5 text-[11px] font-semibold text-[#94a3b8] hover:text-white transition cursor-pointer"
                        title="Duplicar este día"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Duplicar
                      </button>
                      {routineDays.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDay(activeDayIdx)}
                          className="flex items-center gap-1 rounded-xl border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 hover:bg-red-500/20 transition cursor-pointer"
                          title="Eliminar este día"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de Ejercicios del Día */}
                  {currentDay.exercises.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-xs text-[#64748b]">
                      <Dumbbell className="mx-auto mb-2 h-8 w-8 text-[#64748b]" />
                      No hay ejercicios en este día todavía. Haz clic en cualquier ejercicio de la biblioteca de la derecha para agregarlo.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentDay.exercises.map((ex, exIdx) => {
                        const lastMark = getLastLoggedMarkForExercise(ex.name, ex.exerciseId);
                        return (
                          <div
                            key={ex.id || exIdx}
                            className={`rounded-2xl border p-4 space-y-3 transition ${
                              ex.supersetGroup
                                ? 'border-purple-500/40 bg-[#171426]'
                                : 'border-white/10 bg-[#162229]'
                            }`}
                          >
                            {/* Fila superior: Nombre, Grupo, Orden y Eliminar */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#14352b] text-xs font-extrabold text-[#34d399]">
                                  {exIdx + 1}
                                </span>
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-heading text-sm font-extrabold text-white">
                                      {ex.name}
                                    </span>
                                    {ex.supersetGroup && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-950 px-2 py-0.5 text-[10px] font-extrabold text-purple-300 border border-purple-500/40">
                                        <Link2 className="h-2.5 w-2.5" />
                                        Biserie {ex.supersetGroup}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#94a3b8]">
                                    <span className="text-[#38bdf8] font-semibold">
                                      {ex.muscleGroup}
                                    </span>{' '}
                                    • {ex.equipment}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveExercise(exIdx, -1)}
                                  disabled={exIdx === 0}
                                  className="rounded-lg p-1 text-[#94a3b8] hover:bg-white/10 hover:text-white disabled:opacity-30 cursor-pointer"
                                  title="Subir ejercicio"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveExercise(exIdx, 1)}
                                  disabled={exIdx === currentDay.exercises.length - 1}
                                  className="rounded-lg p-1 text-[#94a3b8] hover:bg-white/10 hover:text-white disabled:opacity-30 cursor-pointer"
                                  title="Bajar ejercicio"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExercise(exIdx)}
                                  className="rounded-lg p-1 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                                  title="Quitar ejercicio"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Última marca del paciente si existe */}
                            {lastMark && (
                              <div className="flex items-center gap-1.5 rounded-xl border border-[#245748] bg-[#0f2720]/80 px-3 py-1.5 text-[11px] text-[#a7f3d0]">
                                <TrendingUp className="h-3.5 w-3.5 text-[#34d399] shrink-0" />
                                <span>
                                  <strong>Último registro del paciente:</strong> {lastMark}
                                </span>
                              </div>
                            )}

                            {/* Controles de Series, Reps, RIR, Descanso, Método y Biserie */}
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                              <div>
                                <label className="block text-[10px] font-bold text-[#94a3b8]">
                                  Series
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="12"
                                  value={ex.targetSets}
                                  onChange={(e) =>
                                    updateRoutineExercise(
                                      exIdx,
                                      'targetSets',
                                      Math.max(1, Number(e.target.value) || 1)
                                    )
                                  }
                                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-[#111a1f] px-2.5 py-1.5 text-xs font-bold text-white focus:border-[#34d399] focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#94a3b8]">
                                  Reps Objetivo
                                </label>
                                <input
                                  type="text"
                                  value={ex.targetReps}
                                  onChange={(e) =>
                                    updateRoutineExercise(exIdx, 'targetReps', e.target.value)
                                  }
                                  placeholder="8-10"
                                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-[#111a1f] px-2.5 py-1.5 text-xs font-bold text-[#38bdf8] focus:border-[#38bdf8] focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#94a3b8]">
                                  RIR Objetivo
                                </label>
                                <select
                                  value={ex.targetRir}
                                  onChange={(e) =>
                                    updateRoutineExercise(exIdx, 'targetRir', e.target.value)
                                  }
                                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-[#111a1f] px-2 py-1.5 text-xs font-bold text-[#fbbf24] focus:outline-none"
                                >
                                  <option value="RIR 0">RIR 0 (Fallo)</option>
                                  <option value="RIR 0-1">RIR 0-1</option>
                                  <option value="RIR 1">RIR 1</option>
                                  <option value="RIR 1-2">RIR 1-2</option>
                                  <option value="RIR 2">RIR 2</option>
                                  <option value="RIR 2-3">RIR 2-3</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#94a3b8]">
                                  Descanso (seg)
                                </label>
                                <select
                                  value={ex.restSeconds}
                                  onChange={(e) =>
                                    updateRoutineExercise(
                                      exIdx,
                                      'restSeconds',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-[#111a1f] px-2 py-1.5 text-xs text-white focus:outline-none"
                                >
                                  <option value={45}>45 seg</option>
                                  <option value={60}>60 seg (1m)</option>
                                  <option value={75}>75 seg</option>
                                  <option value={90}>90 seg (1.5m)</option>
                                  <option value={120}>120 seg (2m)</option>
                                  <option value={150}>150 seg (2.5m)</option>
                                  <option value={180}>180 seg (3m)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#94a3b8]">
                                  Método / Variante
                                </label>
                                <select
                                  value={ex.setMethod || 'normal'}
                                  onChange={(e) =>
                                    updateRoutineExercise(
                                      exIdx,
                                      'setMethod',
                                      e.target.value as SetMethod
                                    )
                                  }
                                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-[#111a1f] px-2 py-1.5 text-xs text-[#34d399] font-semibold focus:outline-none"
                                >
                                  {Object.entries(SET_METHOD_LABELS).map(([key, val]) => (
                                    <option key={key} value={key}>
                                      {val.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#94a3b8]">
                                  Biserie / Superserie
                                </label>
                                <select
                                  value={ex.supersetGroup || ''}
                                  onChange={(e) =>
                                    updateRoutineExercise(
                                      exIdx,
                                      'supersetGroup',
                                      e.target.value || null
                                    )
                                  }
                                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-[#111a1f] px-2 py-1.5 text-xs text-purple-300 font-semibold focus:outline-none"
                                >
                                  {SUPERSET_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Notas técnicas o pauta de progresión */}
                            <div>
                              <input
                                type="text"
                                value={ex.coachNotes || ''}
                                onChange={(e) =>
                                  updateRoutineExercise(exIdx, 'coachNotes', e.target.value)
                                }
                                placeholder="Indicación técnica o meta de la semana (ej. Subir a 40kg buscando 8 reps, pausa 1s abajo...)"
                                className="w-full rounded-xl border border-white/10 bg-[#111a1f] px-3 py-1.5 text-xs text-[#cbd5e1] focus:border-[#34d399] focus:outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA (5 cols): Biblioteca de +125 Ejercicios & Creación Personalizada */}
            <div className="space-y-4 lg:col-span-5">
              <div className="sticky top-6 rounded-3xl border border-white/10 bg-[#111a1f] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-heading text-base font-extrabold text-white">
                      Biblioteca de Ejercicios ({EXERCISE_LIBRARY.length}+)
                    </h3>
                    <p className="text-[11px] text-[#94a3b8]">
                      Pulsa en cualquier ejercicio para añadirlo a <strong>{currentDay?.name}</strong>
                    </p>
                  </div>
                </div>

                {/* Buscador */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748b]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar ej. Press inclinado, Sentadilla Hack, Jalón, Hip Thrust..."
                    className="w-full rounded-xl border border-white/10 bg-[#162229] pl-9 pr-3.5 py-2 text-xs text-white focus:border-[#34d399] focus:outline-none"
                  />
                </div>

                {/* Píldoras de Grupo Muscular */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedMuscle('Todos')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                      selectedMuscle === 'Todos'
                        ? 'bg-[#34d399] text-[#0d1518]'
                        : 'bg-[#162229] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  {MUSCLE_GROUPS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMuscle(m)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                        selectedMuscle === m
                          ? 'bg-[#34d399] text-[#0d1518]'
                          : 'bg-[#162229] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Filtro por Equipo / Variante */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#94a3b8] text-[11px]">Variante / Equipo:</span>
                  <select
                    value={selectedEquipment}
                    onChange={(e) => setSelectedEquipment(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-[#162229] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Todos">Todas las variantes</option>
                    <option value="Barra">Barra libre / Barra Z</option>
                    <option value="Mancuerna">Mancuernas</option>
                    <option value="Polea">Polea / Cable</option>
                    <option value="Máquina">Máquina</option>
                    <option value="Multipower">Multipower / Smith</option>
                    <option value="Unilateral">Unilateral</option>
                    <option value="Peso Corporal">Peso Corporal / Lastre</option>
                  </select>
                </div>

                {/* Lista Scrolleable de Ejercicios */}
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {filteredCatalog.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-[#162229] p-2.5 hover:border-[#34d399]/50 transition"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-white">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-[#94a3b8]">
                          <span className="text-[#38bdf8] font-semibold">{item.muscleGroup}</span> •{' '}
                          {item.equipment} • Sugerido: {item.defaultSets}×{item.defaultReps} (
                          {item.defaultRir})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddExerciseFromCatalog(item)}
                        className="flex shrink-0 items-center gap-1 rounded-xl bg-[#14352b] border border-[#245748] px-2.5 py-1.5 text-[11px] font-bold text-[#34d399] hover:bg-[#1b4337] hover:text-white transition cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Añadir
                      </button>
                    </div>
                  ))}
                </div>

                {/* Crear Ejercicio Personalizado */}
                <form
                  onSubmit={handleAddCustomExercise}
                  className="border-t border-white/10 pt-3 space-y-2"
                >
                  <div className="text-[11px] font-bold text-[#a7f3d0]">
                    ¿No encuentras una variante específica? Añádela al instante:
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Nombre del ejercicio..."
                      value={customExName}
                      onChange={(e) => setCustomExName(e.target.value)}
                      className="sm:col-span-2 rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs text-white focus:border-[#34d399] focus:outline-none"
                    />
                    <select
                      value={customExMuscle}
                      onChange={(e) => setCustomExMuscle(e.target.value as MuscleGroup)}
                      className="rounded-xl border border-white/10 bg-[#162229] px-2 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {MUSCLE_GROUPS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Equipo (ej. Máquina Pendular, Banda...)"
                      value={customExEquipment}
                      onChange={(e) => setCustomExEquipment(e.target.value)}
                      className="flex-1 rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-[#34d399] px-3 py-1.5 text-xs font-bold text-[#0d1518] hover:bg-[#34d399]/90 transition cursor-pointer"
                    >
                      + Crear y Añadir
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: REGISTRO Y PROGRESIÓN DE CARGAS ==================== */}
      {activeTab === 'tracker' && selectedPatient && (
        <WorkoutSessionTracker
          key={selectedPatient.id}
          patientId={selectedPatient.id}
          patientName={selectedPatient.fullName}
          activePlan={
            selectedPatient.activePlan || {
              id: 'draft',
              patientId: selectedPatient.id,
              title: routineTitle,
              goal: routineGoal,
              daysPerWeek: routineDays.length,
              days: routineDays,
              isCurrent: true,
              createdAt: new Date().toISOString(),
            }
          }
          initialLogs={selectedPatient.logs || []}
          isAdminView={true}
        />
      )}
    </div>
  );
}
