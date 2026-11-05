// LAYER: Interface
// Componente Interactivo de Registro de Entrenamiento (Checklist de Series, Kilos, Reps y RIR + Historial de Sobrecarga Progresiva)
'use client';

import { useState, useEffect } from 'react';
import {
  WorkoutPlan,
  WorkoutDay,
  WorkoutLogEntry,
  LoggedExercise,
  LoggedSet,
  SET_METHOD_LABELS,
} from '@/domain/entities/workout';
import { saveWorkoutLogAction } from '@/app/admin/workouts/actions';
import {
  Dumbbell,
  Check,
  Plus,
  Minus,
  Calendar,
  Clock,
  Flame,
  TrendingUp,
  History,
  Link2,
  Info,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WorkoutSessionTrackerProps {
  patientId?: string; // Opcional en portal del paciente, requerido cuando el admin registra por el paciente
  patientName?: string;
  activePlan: WorkoutPlan | null;
  initialLogs: WorkoutLogEntry[];
  isAdminView?: boolean;
}

export default function WorkoutSessionTracker({
  patientId,
  patientName,
  activePlan,
  initialLogs,
  isAdminView = false,
}: WorkoutSessionTrackerProps) {
  const [logs, setLogs] = useState<WorkoutLogEntry[]>(initialLogs || []);
  const [activeSubTab, setActiveSubTab] = useState<'train' | 'history'>('train');

  const days = activePlan?.days || [];
  const [selectedDayId, setSelectedDayId] = useState<string>(days[0]?.id || '');
  const selectedDay: WorkoutDay | undefined =
    days.find((d) => d.id === selectedDayId) || days[0];

  const [logDate, setLogDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(60);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [exercisesState, setExercisesState] = useState<LoggedExercise[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(initialLogs?.[0]?.id || null);

  useEffect(() => {
    setLogs(initialLogs || []);
  }, [initialLogs]);

  // Buscar la última vez que se registró un ejercicio específico en el historial
  function findPreviousExerciseLog(exerciseName: string, exerciseId?: string): {
    date: string;
    loggedExercise: LoggedExercise;
  } | null {
    for (const log of logs) {
      const found = (log.exercises || []).find(
        (ex) =>
          (exerciseId && ex.exerciseId === exerciseId) ||
          ex.exerciseName.toLowerCase().trim() === exerciseName.toLowerCase().trim()
      );
      if (found && found.sets && found.sets.some((s) => Number(s.weightKg) > 0 || Number(s.reps) > 0)) {
        return { date: log.logDate, loggedExercise: found };
      }
    }
    return null;
  }

  // Inicializar estado de series cuando cambia el día seleccionado
  useEffect(() => {
    if (!selectedDay) {
      setExercisesState([]);
      return;
    }

    const mapped: LoggedExercise[] = (selectedDay.exercises || []).map((ex) => {
      const numSets = Math.max(1, Number(ex.targetSets) || 3);
      const prevRecord = findPreviousExerciseLog(ex.name, ex.exerciseId);
      const defaultRirNum = ex.targetRir.replace(/[^0-9]/g, '')[0] || '1';

      const sets: LoggedSet[] = Array.from({ length: numSets }, (_, idx) => {
        const prevSet = prevRecord?.loggedExercise?.sets?.[idx];
        return {
          setNumber: idx + 1,
          weightKg: prevSet?.weightKg ?? '',
          reps: prevSet?.reps ?? '',
          rir: prevSet?.rir || defaultRirNum,
          completed: false,
        };
      });

      return {
        routineExerciseId: ex.id,
        exerciseId: ex.exerciseId,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        targetSummary: `${ex.targetSets} series × ${ex.targetReps} reps @ ${ex.targetRir}`,
        supersetGroup: ex.supersetGroup || null,
        sets,
        patientNotes: '',
      };
    });

    setExercisesState(mapped);
  }, [selectedDayId, activePlan?.id]);

  function handleSelectDay(dayId: string) {
    setSelectedDayId(dayId);
    setSaveSuccess(false);
    setErrorMsg(null);
  }

  function updateSetField(
    exIdx: number,
    setIdx: number,
    field: keyof LoggedSet,
    value: any
  ) {
    setExercisesState((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const sets = [...ex.sets];
      sets[setIdx] = {
        ...sets[setIdx],
        [field]: value,
      };
      ex.sets = sets;
      next[exIdx] = ex;
      return next;
    });
  }

  function toggleSetCompleted(exIdx: number, setIdx: number) {
    setExercisesState((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const sets = [...ex.sets];
      const current = sets[setIdx];
      sets[setIdx] = {
        ...current,
        completed: !current.completed,
      };
      ex.sets = sets;
      next[exIdx] = ex;
      return next;
    });
  }

  function addExtraSet(exIdx: number) {
    setExercisesState((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const lastSet = ex.sets[ex.sets.length - 1];
      ex.sets = [
        ...ex.sets,
        {
          setNumber: ex.sets.length + 1,
          weightKg: lastSet?.weightKg ?? '',
          reps: lastSet?.reps ?? '',
          rir: lastSet?.rir || '1',
          completed: false,
        },
      ];
      next[exIdx] = ex;
      return next;
    });
  }

  function removeLastSet(exIdx: number) {
    setExercisesState((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      if (ex.sets.length <= 1) return prev;
      ex.sets = ex.sets.slice(0, -1);
      next[exIdx] = ex;
      return next;
    });
  }

  function copyFirstSetToAll(exIdx: number) {
    setExercisesState((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const first = ex.sets[0];
      if (!first) return prev;
      ex.sets = ex.sets.map((s) => ({
        ...s,
        weightKg: first.weightKg,
        reps: s.reps === '' ? first.reps : s.reps,
      }));
      next[exIdx] = ex;
      return next;
    });
  }

  function updateExerciseNotes(exIdx: number, notes: string) {
    setExercisesState((prev) => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], patientNotes: notes };
      return next;
    });
  }

  // Calcular progreso de series marcadas hoy
  const totalSetsCount = exercisesState.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSetsCount = exercisesState.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const progressPct =
    totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;

  async function handleSaveWorkoutSession() {
    if (!selectedDay) return;
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      // Si el usuario llenó pesos/reps pero olvidó marcar el check verde en alguna serie con datos, marcarla completada
      const sanitizedExercises: LoggedExercise[] = exercisesState.map((ex) => ({
        ...ex,
        sets: ex.sets.map((s) => ({
          ...s,
          weightKg: s.weightKg === '' ? 0 : Number(s.weightKg),
          reps: s.reps === '' ? 0 : Number(s.reps),
          completed: s.completed || (Number(s.weightKg) > 0 && Number(s.reps) > 0),
        })),
      }));

      const res = await saveWorkoutLogAction({
        patientId,
        workoutPlanId: activePlan?.id || null,
        logDate,
        dayId: selectedDay.id,
        dayName: selectedDay.name,
        exercises: sanitizedExercises,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        notes: sessionNotes,
      });

      if (res?.success && res.log) {
        setLogs((prev) => [res.log!, ...prev]);
        setExpandedLogId(res.log.id);
        setSaveSuccess(true);
        try {
          confetti({ particleCount: 70, spread: 65 });
        } catch {}
        setTimeout(() => setSaveSuccess(false), 4500);
      } else {
        setErrorMsg(res?.error || 'No se pudo guardar la sesión de entrenamiento.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al guardar entrenamiento');
    } finally {
      setIsSaving(false);
    }
  }

  if (!activePlan || !activePlan.days || activePlan.days.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-10 text-center shadow-xl">
        <Dumbbell className="mx-auto mb-3 h-12 w-12 text-[#34d399]" />
        <h3 className="font-heading text-lg font-extrabold text-white">
          {isAdminView
            ? 'Este paciente aún no tiene una rutina de entrenamiento asignada'
            : 'Aún no tienes una rutina de entrenamiento asignada'}
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-[#94a3b8]">
          {isAdminView
            ? 'Ve al Constructor de Rutinas para armarle sus días de entrenamiento con ejercicios, series, repeticiones, RIR y biseries.'
            : 'Tu entrenador/nutricionista pronto te asignará tu plan de entrenamiento personalizado para que registres tus pesos, repeticiones y RIR aquí.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-navegación: Entrenar Hoy vs Historial de Cargas */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111a1f] p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('train')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'train'
                ? 'border border-[#245748] bg-[#14352b] text-white shadow-md'
                : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
            }`}
          >
            <Dumbbell className="h-4 w-4 text-[#34d399]" />
            Registrar Entrenamiento Hoy
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'history'
                ? 'border border-[#245748] bg-[#14352b] text-white shadow-md'
                : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
            }`}
          >
            <History className="h-4 w-4 text-[#38bdf8]" />
            Historial & Progresión ({logs.length})
          </button>
        </div>

        <div className="text-xs text-[#94a3b8] px-2">
          Rutina activa: <strong className="text-white">{activePlan.title}</strong>
        </div>
      </div>

      {activeSubTab === 'train' && (
        <div className="space-y-6">
          {/* 1. Selector de Día/Sesión de la Rutina (Flexible para cambiar el orden en la semana) */}
          <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading text-sm font-extrabold uppercase tracking-wider text-[#34d399]">
                  1. ¿Qué sesión vas a entrenar hoy?
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Selecciona libremente el día que te toca hoy (aunque hayas cambiado el orden de la semana)
                </p>
              </div>

              {/* Fecha y Duración */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-[#34d399]" />
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="bg-transparent font-bold text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5 text-[#38bdf8]" />
                  <input
                    type="number"
                    min="10"
                    max="240"
                    value={durationMinutes}
                    onChange={(e) =>
                      setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-12 bg-transparent text-center font-bold text-white focus:outline-none"
                  />
                  <span className="text-[#94a3b8]">min</span>
                </div>
              </div>
            </div>

            {/* Tarjetas de los Días de Entrenamiento */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {days.map((day, idx) => {
                const isSelected = selectedDay?.id === day.id;
                const lastLogForDay = logs.find(
                  (l) => l.dayId === day.id || l.dayName === day.name
                );

                return (
                  <button
                    key={day.id || idx}
                    type="button"
                    onClick={() => handleSelectDay(day.id)}
                    className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-[#34d399] bg-gradient-to-br from-[#14352b] to-[#0f2720] shadow-lg shadow-[#14352b]/40'
                        : 'border-white/10 bg-[#162229] hover:border-white/25 hover:bg-[#1c2b33]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-lg bg-black/30 px-2 py-0.5 text-[10px] font-extrabold text-[#34d399]">
                          Opción {idx + 1}
                        </span>
                        <span className="text-[10px] font-semibold text-[#94a3b8]">
                          {day.exercises?.length || 0} ejercicios
                        </span>
                      </div>
                      <div className="mt-2 font-heading text-sm font-extrabold text-white">
                        {day.name}
                      </div>
                      {day.focus && (
                        <div className="mt-0.5 text-[11px] text-[#a7f3d0] line-clamp-1">
                          {day.focus}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 border-t border-white/10 pt-2 text-[10px] text-[#94a3b8] flex items-center justify-between">
                      <span>
                        {lastLogForDay
                          ? `Última vez: ${lastLogForDay.logDate}`
                          : 'Sin registrar aún'}
                      </span>
                      {isSelected && (
                        <span className="font-bold text-[#34d399]">Seleccionado ✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de Progreso de la Sesión Actual */}
          <div className="sticky top-16 z-30 rounded-2xl border border-[#245748] bg-[#111a1f]/95 p-4 shadow-xl backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-[#f59e0b]" />
                <span className="font-bold text-white">{selectedDay?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#a7f3d0] font-semibold">
                  {completedSetsCount} de {totalSetsCount} series marcadas ({progressPct}%)
                </span>
              </div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#34d399] to-[#10b981] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* 2. Listado de Ejercicios de la Sesión con Registro de Peso, Reps y RIR */}
          {selectedDay && (
            <div className="space-y-4">
              {selectedDay.exercises.map((routineEx, exIdx) => {
                const loggedEx = exercisesState[exIdx];
                if (!loggedEx) return null;

                const prevData = findPreviousExerciseLog(routineEx.name, routineEx.exerciseId);
                const methodInfo =
                  SET_METHOD_LABELS[routineEx.setMethod || 'normal'] ||
                  SET_METHOD_LABELS.normal;

                return (
                  <div
                    key={routineEx.id || exIdx}
                    className={`rounded-3xl border p-5 shadow-lg transition ${
                      routineEx.supersetGroup
                        ? 'border-purple-500/40 bg-gradient-to-br from-[#111a1f] to-[#191528]'
                        : 'border-white/10 bg-[#111a1f]'
                    }`}
                  >
                    {/* Cabecera del Ejercicio */}
                    <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-3.5 sm:flex-row sm:items-start">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#14352b] text-xs font-extrabold text-[#34d399]">
                            {exIdx + 1}
                          </span>
                          <h4 className="font-heading text-base font-extrabold text-white">
                            {routineEx.name}
                          </h4>
                          {routineEx.supersetGroup && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-purple-400/40 bg-purple-950/70 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-300">
                              <Link2 className="h-3 w-3" />
                              Biserie {routineEx.supersetGroup}
                            </span>
                          )}
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${methodInfo.badgeColor}`}
                          >
                            {methodInfo.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#94a3b8]">
                          <span className="font-semibold text-[#38bdf8]">
                            {routineEx.muscleGroup}
                          </span>
                          <span>•</span>
                          <span>{routineEx.equipment}</span>
                          <span>•</span>
                          <span className="text-[#a7f3d0] font-bold">
                            Pauta: {routineEx.targetSets} series × {routineEx.targetReps} reps @{' '}
                            {routineEx.targetRir}
                          </span>
                          <span>•</span>
                          <span>Descanso: {routineEx.restSeconds}s</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyFirstSetToAll(exIdx)}
                          className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#162229] px-2.5 py-1.5 text-[11px] font-semibold text-[#94a3b8] hover:text-white transition cursor-pointer"
                          title="Copiar el peso de la Serie 1 al resto de series"
                        >
                          <Copy className="h-3 w-3" />
                          Repetir Peso S1
                        </button>
                      </div>
                    </div>

                    {/* Nota Técnica / Indicación del Entrenador */}
                    {routineEx.coachNotes && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                        <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <strong className="font-bold text-amber-300">Indicación del Coach: </strong>
                          {routineEx.coachNotes}
                        </div>
                      </div>
                    )}

                    {/* Referencia de la Sesión Anterior (Sobrecarga Progresiva) */}
                    {prevData ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#245748] bg-[#0f2720]/70 px-3.5 py-2 text-xs">
                        <div className="flex items-center gap-2 text-[#a7f3d0]">
                          <TrendingUp className="h-4 w-4 text-[#34d399] shrink-0" />
                          <span>
                            <strong className="text-white">
                              Marca anterior ({prevData.date}):
                            </strong>{' '}
                            {prevData.loggedExercise.sets
                              .map(
                                (s) =>
                                  `S${s.setNumber}: ${s.weightKg || 0}kg × ${s.reps || 0} (RIR ${
                                    s.rir
                                  })`
                              )
                              .join('  |  ')}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#34d399]">
                          ¡Intenta superar +1 repe o +1.25/2.5 kg hoy!
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-white/5 bg-[#162229]/50 px-3.5 py-2 text-[11px] text-[#64748b]">
                        Primera vez registrando este ejercicio • Ingresa los kilos, repeticiones y RIR de hoy para crear tu línea base.
                      </div>
                    )}

                    {/* Tabla de Series (Peso kg, Reps, RIR, Check) */}
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                            <th className="pb-2 w-14">Serie</th>
                            <th className="pb-2 hidden sm:table-cell">Anterior</th>
                            <th className="pb-2">Peso (kg)</th>
                            <th className="pb-2">Repeticiones</th>
                            <th className="pb-2">RIR (En Reserva)</th>
                            <th className="pb-2 text-center w-16">Listo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {loggedEx.sets.map((setItem, setIdx) => {
                            const prevSet = prevData?.loggedExercise?.sets?.[setIdx];
                            return (
                              <tr
                                key={setItem.setNumber}
                                className={`transition ${
                                  setItem.completed ? 'bg-[#14352b]/30' : ''
                                }`}
                              >
                                <td className="py-2.5 pr-2 font-heading font-extrabold text-white">
                                  <span
                                    className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs ${
                                      setItem.completed
                                        ? 'bg-[#34d399] text-[#0d1518]'
                                        : 'bg-[#162229] text-[#94a3b8]'
                                    }`}
                                  >
                                    {setItem.setNumber}
                                  </span>
                                </td>

                                <td className="py-2.5 pr-3 hidden sm:table-cell text-[11px] text-[#64748b]">
                                  {prevSet
                                    ? `${prevSet.weightKg} kg × ${prevSet.reps} @ RIR ${prevSet.rir}`
                                    : `${routineEx.targetReps} reps`}
                                </td>

                                <td className="py-2 pr-2">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      placeholder={prevSet ? String(prevSet.weightKg) : 'Kg'}
                                      value={setItem.weightKg}
                                      onChange={(e) =>
                                        updateSetField(
                                          exIdx,
                                          setIdx,
                                          'weightKg',
                                          e.target.value === '' ? '' : Number(e.target.value)
                                        )
                                      }
                                      onFocus={(e) => e.target.select()}
                                      className="w-20 sm:w-24 rounded-xl border border-white/10 bg-[#162229] px-2.5 py-1.5 text-center font-heading text-sm font-extrabold text-white focus:border-[#34d399] focus:outline-none"
                                    />
                                    <span className="text-[10px] text-[#64748b] hidden md:inline">
                                      kg
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2 pr-2">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder={routineEx.targetReps}
                                      value={setItem.reps}
                                      onChange={(e) =>
                                        updateSetField(
                                          exIdx,
                                          setIdx,
                                          'reps',
                                          e.target.value === '' ? '' : Number(e.target.value)
                                        )
                                      }
                                      onFocus={(e) => e.target.select()}
                                      className="w-16 sm:w-20 rounded-xl border border-white/10 bg-[#162229] px-2.5 py-1.5 text-center font-heading text-sm font-extrabold text-[#38bdf8] focus:border-[#38bdf8] focus:outline-none"
                                    />
                                    <span className="text-[10px] text-[#64748b] hidden md:inline">
                                      reps
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2 pr-2">
                                  <select
                                    value={setItem.rir}
                                    onChange={(e) =>
                                      updateSetField(exIdx, setIdx, 'rir', e.target.value)
                                    }
                                    className="rounded-xl border border-white/10 bg-[#162229] px-2.5 py-1.5 text-xs font-bold text-[#fbbf24] focus:border-[#fbbf24] focus:outline-none cursor-pointer"
                                  >
                                    <option value="0">RIR 0 (Al Fallo)</option>
                                    <option value="0.5">RIR 0.5</option>
                                    <option value="1">RIR 1 (1 en reserva)</option>
                                    <option value="2">RIR 2 (2 en reserva)</option>
                                    <option value="3">RIR 3 (3 en reserva)</option>
                                    <option value="4+">RIR 4+ (Moderado)</option>
                                  </select>
                                </td>

                                <td className="py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleSetCompleted(exIdx, setIdx)}
                                    className={`inline-flex h-8 w-10 items-center justify-center rounded-xl border transition cursor-pointer ${
                                      setItem.completed
                                        ? 'border-[#34d399] bg-[#34d399] text-[#0d1518] shadow-md shadow-[#34d399]/30'
                                        : 'border-white/15 bg-[#162229] text-[#94a3b8] hover:border-[#34d399]/50 hover:text-white'
                                    }`}
                                    title="Marcar serie completada"
                                  >
                                    <Check className="h-4 w-4 stroke-[3]" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Botones + / - Series y Nota por Ejercicio */}
                    <div className="mt-3 flex flex-col gap-2.5 pt-2 border-t border-white/5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => addExtraSet(exIdx)}
                          className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#162229] px-2.5 py-1 text-[11px] font-bold text-[#34d399] hover:bg-[#1e2e38] transition cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          + Añadir Serie
                        </button>
                        {loggedEx.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLastSet(exIdx)}
                            className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#162229] px-2.5 py-1 text-[11px] font-semibold text-[#94a3b8] hover:text-white transition cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                            Quitar Serie
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Nota en este ejercicio (ej. subir peso la próxima semana, molestia, etc.)"
                        value={loggedEx.patientNotes || ''}
                        onChange={(e) => updateExerciseNotes(exIdx, e.target.value)}
                        className="w-full sm:max-w-xs rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs text-white focus:border-[#34d399] focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}

              {/* Notas Generales de la Sesión y Botón Guardar */}
              <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    Sensaciones Generales del Entrenamiento de Hoy (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Excelente energía, subí cargas en press inclinado y remo..."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2.5 text-xs text-white focus:border-[#34d399] focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                    {errorMsg}
                  </div>
                )}

                {saveSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#34d399]/40 bg-[#14352b] p-3.5 text-xs font-bold text-[#a7f3d0]">
                    <CheckCircle2 className="h-5 w-5 text-[#34d399] shrink-0" />
                    <span>
                      ¡Entrenamiento guardado con éxito! Tus pesos, repeticiones y RIR ya quedaron registrados para tu próxima sesión.
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveWorkoutSession}
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] py-3.5 text-sm font-extrabold text-white shadow-xl shadow-[#1b4337]/50 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="h-5 w-5" />
                  {isSaving
                    ? 'Guardando sesión de entrenamiento...'
                    : `Finalizar y Guardar ${selectedDay.name}`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORIAL DE ENTRENAMIENTOS Y PROGRESIÓN DE CARGAS */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-12 text-center">
              <History className="mx-auto mb-2 h-10 w-10 text-[#64748b]" />
              <h4 className="font-heading text-base font-bold text-white">
                Aún no hay sesiones de entrenamiento registradas
              </h4>
              <p className="mt-1 text-xs text-[#94a3b8]">
                Cuando completes y guardes un entrenamiento en la pestaña &ldquo;Registrar Entrenamiento Hoy&rdquo;, aparecerá aquí con todas sus series, kilos y RIR.
              </p>
            </div>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const totalVolumeKg = (log.exercises || []).reduce(
                (acc, ex) =>
                  acc +
                  (ex.sets || []).reduce(
                    (sAcc, s) => sAcc + (Number(s.weightKg) || 0) * (Number(s.reps) || 0),
                    0
                  ),
                0
              );

              return (
                <div
                  key={log.id}
                  className="rounded-3xl border border-white/10 bg-[#111a1f] overflow-hidden shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left hover:bg-white/[0.02] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#245748] bg-[#14352b] text-[#34d399]">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-heading text-sm font-extrabold text-white">
                            {log.dayName}
                          </span>
                          <span className="rounded-full bg-[#162229] px-2.5 py-0.5 text-[11px] font-bold text-[#38bdf8]">
                            {log.logDate}
                          </span>
                          {log.durationMinutes && (
                            <span className="text-[11px] text-[#94a3b8]">
                              • {log.durationMinutes} min
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-[#94a3b8]">
                          {log.exercises?.length || 0} ejercicios realizados • Tonelaje total:{' '}
                          <strong className="text-[#34d399]">
                            {totalVolumeKg.toLocaleString('es-ES')} kg
                          </strong>
                          {log.notes && ` • "${log.notes}"`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-[#a7f3d0]">
                      <span>{isExpanded ? 'Ocultar detalle' : 'Ver series y cargas'}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/10 bg-[#0d1518]/60 p-5 space-y-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {(log.exercises || []).map((ex, idx) => (
                          <div
                            key={ex.routineExerciseId || idx}
                            className="rounded-2xl border border-white/10 bg-[#162229] p-3.5 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-heading text-xs font-extrabold text-white">
                                {idx + 1}. {ex.exerciseName}
                              </span>
                              {ex.supersetGroup && (
                                <span className="rounded-md bg-purple-950/80 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                                  Biserie {ex.supersetGroup}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {(ex.sets || []).map((s) => (
                                <span
                                  key={s.setNumber}
                                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#111a1f] px-2.5 py-1 text-[11px]"
                                >
                                  <strong className="text-[#94a3b8]">S{s.setNumber}:</strong>
                                  <strong className="text-white">{s.weightKg} kg</strong>
                                  <span className="text-[#64748b]">×</span>
                                  <strong className="text-[#38bdf8]">{s.reps} reps</strong>
                                  <span className="text-[#fbbf24] text-[10px]">
                                    (RIR {s.rir})
                                  </span>
                                </span>
                              ))}
                            </div>

                            {ex.patientNotes && (
                              <div className="text-[11px] italic text-[#a7f3d0]">
                                Nota: &ldquo;{ex.patientNotes}&rdquo;
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

