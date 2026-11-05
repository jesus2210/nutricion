// LAYER: Interface
// Constructor Avanzado de Rutinas de Entrenamiento, Analítica de Volumen/Fatiga y Gestor de Cargas (Admin)
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  MUSCLE_GROUPS,
  WORKOUT_TEMPLATES,
  SET_METHOD_LABELS,
  SUPERSET_OPTIONS,
  REST_TIME_OPTIONS,
  TRAINING_LEVEL_LABELS,
  formatRestMinutes,
  getDefaultYoutubeSearchUrl,
  autoAdjustRoutineByLevel,
  calculateWorkoutAnalytics,
  MuscleGroup,
  SetMethod,
  TrainingLevel,
  WorkoutDay,
  RoutineExercise,
  WorkoutPlan,
  WorkoutLogEntry,
  ExerciseCatalogItem,
  WorkoutTemplate,
} from '@/domain/entities/workout';
import {
  saveWorkoutPlanAction,
  createExerciseInCatalogAction,
  deleteExerciseFromCatalogAction,
  updateExerciseVideoUrlInCatalogAction,
  saveWorkoutTemplateAction,
  deleteWorkoutTemplateAction,
} from './actions';
import { generateWorkoutRoutinePdf } from './workoutPdfGenerator';
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
  BookmarkPlus,
  BookmarkCheck,
  FileDown,
  PlayCircle,
  BarChart3,
  Activity,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Layers,
  Wand2,
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
  initialCatalog?: ExerciseCatalogItem[];
  initialTemplates?: WorkoutTemplate[];
}

export default function WorkoutsAdminClient({
  patients,
  initialPatientId,
  initialCatalog,
  initialTemplates,
}: WorkoutsAdminClientProps) {
  const router = useRouter();
  const [patientsList, setPatientsList] = useState<PatientWorkoutSummary[]>(patients);
  const [catalogList, setCatalogList] = useState<ExerciseCatalogItem[]>(initialCatalog || []);
  const [templatesList, setTemplatesList] = useState<WorkoutTemplate[]>(
    initialTemplates && initialTemplates.length > 0 ? initialTemplates : WORKOUT_TEMPLATES
  );
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || patients[0]?.id || ''
  );

  const selectedPatient =
    patientsList.find((p) => p.id === selectedPatientId) || patientsList[0] || null;

  const [activeTab, setActiveTab] = useState<'builder' | 'tracker'>('builder');

  // Estado del constructor de rutina
  const defaultTemplate = WORKOUT_TEMPLATES[1] || WORKOUT_TEMPLATES[0];
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
  const [routineLevel, setRoutineLevel] = useState<TrainingLevel>(
    initialPlan?.level || 'intermediate'
  );
  const [routineDays, setRoutineDays] = useState<WorkoutDay[]>(
    initialPlan?.days && initialPlan.days.length > 0
      ? initialPlan.days
      : structuredClone(defaultTemplate.days)
  );
  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);

  // Panel de Analítica Científica (Volumen por Grupo Muscular & Fatiga SNC)
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState<boolean>(true);

  // Selector para Importar / Clonar un Día Específico de otro Paciente o Plantilla
  const [showImportDayBox, setShowImportDayBox] = useState<boolean>(false);
  const [importSourceKey, setImportSourceKey] = useState<string>('');
  const [importDayId, setImportDayId] = useState<string>('');

  // Filtros de la Biblioteca de Ejercicios (Base de Datos)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'Todos'>('Todos');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('Todos');

  // Ejercicio nuevo para guardar en la Base de Datos (exercise_catalog)
  const [customExName, setCustomExName] = useState('');
  const [customExMuscle, setCustomExMuscle] = useState<MuscleGroup>('Pecho');
  const [customExEquipment, setCustomExEquipment] = useState('Máquina');
  const [customExSets, setCustomExSets] = useState<number>(3);
  const [customExReps, setCustomExReps] = useState<string>('8-12');
  const [customExRestSec, setCustomExRestSec] = useState<number>(90);
  const [customExVideoUrl, setCustomExVideoUrl] = useState<string>('');
  const [isCreatingCatalogEx, setIsCreatingCatalogEx] = useState(false);
  const [catalogExMessage, setCatalogExMessage] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Estado para guardar rutina como Plantilla Reutilizable en BD
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateSuccessMsg, setTemplateSuccessMsg] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const currentDay: WorkoutDay | undefined = routineDays[activeDayIdx] || routineDays[0];

  // Analítica científica en tiempo real
  const analytics = useMemo(() => calculateWorkoutAnalytics(routineDays), [routineDays]);

  // Fuentes disponibles para clonar días individuales (Otros Pacientes + Plantillas)
  const availableDaySources = useMemo(() => {
    const list: { key: string; label: string; days: WorkoutDay[] }[] = [];
    for (const p of patientsList) {
      if (p.activePlan && p.activePlan.days?.length > 0) {
        list.push({
          key: `pat:${p.id}`,
          label: `👤 Paciente: ${p.fullName} (${p.activePlan.title})`,
          days: p.activePlan.days,
        });
      }
    }
    for (const tpl of templatesList) {
      if (tpl.days?.length > 0) {
        list.push({
          key: `tpl:${tpl.id}`,
          label: `📋 Plantilla: ${tpl.title.split('•')[0].trim()}`,
          days: tpl.days,
        });
      }
    }
    return list;
  }, [patientsList, templatesList]);

  const selectedImportSource = availableDaySources.find((s) => s.key === importSourceKey);

  // Sincronizar al cambiar de paciente en el selector
  function handleSelectPatient(newPatientId: string) {
    setSelectedPatientId(newPatientId);
    const pat = patientsList.find((p) => p.id === newPatientId);
    if (!pat) return;

    if (pat.activePlan && pat.activePlan.days?.length > 0) {
      setRoutineTitle(pat.activePlan.title);
      setRoutineGoal(pat.activePlan.goal);
      setRoutineLevel(pat.activePlan.level || 'intermediate');
      setRoutineDays(structuredClone(pat.activePlan.days));
      setActiveDayIdx(0);
    } else {
      setRoutineTitle(`Rutina de Entrenamiento • ${pat.fullName}`);
      setRoutineGoal(pat.targetGoal || 'Hipertrofia & Recomposición');
      setRoutineLevel('intermediate');
      setRoutineDays(structuredClone(defaultTemplate.days));
      setActiveDayIdx(0);
    }
    setSaveSuccess(false);
    setSaveError(null);
  }

  // Cargar una plantilla completa (base o guardada por el nutricionista en BD)
  function handleLoadTemplate(templateId: string) {
    const tpl = templatesList.find((t) => t.id === templateId);
    if (!tpl) return;
    const cleanBaseTitle = tpl.title.split('•')[0].trim();
    setRoutineTitle(
      selectedPatient ? `${cleanBaseTitle} • ${selectedPatient.fullName}` : tpl.title
    );
    setRoutineGoal(tpl.goal);
    if (tpl.level) setRoutineLevel(tpl.level);
    setRoutineDays(structuredClone(tpl.days));
    setActiveDayIdx(0);
    setTemplateSuccessMsg(
      `✓ Plantilla "${cleanBaseTitle}" cargada en el constructor. Pulsa "Guardar y Asignar" para asignársela a ${selectedPatient?.fullName || 'este paciente'}.`
    );
    setTimeout(() => setTemplateSuccessMsg(null), 5000);
  }

  // Copiar la rutina completa de otro paciente con 1 clic
  function handleCopyFromAnotherPatient(sourcePatientId: string) {
    if (!sourcePatientId) return;
    const sourcePat = patientsList.find((p) => p.id === sourcePatientId);
    if (!sourcePat || !sourcePat.activePlan) return;

    const cleanTitle = sourcePat.activePlan.title.split('•')[0].trim();
    setRoutineTitle(
      selectedPatient
        ? `${cleanTitle} • ${selectedPatient.fullName}`
        : sourcePat.activePlan.title
    );
    setRoutineGoal(sourcePat.activePlan.goal);
    if (sourcePat.activePlan.level) setRoutineLevel(sourcePat.activePlan.level);
    setRoutineDays(structuredClone(sourcePat.activePlan.days));
    setActiveDayIdx(0);
    setTemplateSuccessMsg(
      `✓ Se copió la rutina completa de ${sourcePat.fullName} (${sourcePat.activePlan.days.length} días).`
    );
    setTimeout(() => setTemplateSuccessMsg(null), 5000);
  }

  // Importar un Día Específico de otro cliente o plantilla
  function handleImportSpecificDay(mode: 'append' | 'replace_current') {
    if (!selectedImportSource) return;
    const sourceDay =
      selectedImportSource.days.find((d) => d.id === importDayId) ||
      selectedImportSource.days[0];
    if (!sourceDay) return;

    const clonedDay: WorkoutDay = {
      ...structuredClone(sourceDay),
      id: `day-${Date.now()}`,
      name:
        mode === 'append'
          ? `Día ${routineDays.length + 1} • ${sourceDay.name.replace(/^Día\s*\d+\s*•?\s*/i, '')}`
          : sourceDay.name,
      exercises: sourceDay.exercises.map((ex) => ({
        ...ex,
        id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    };

    if (mode === 'append') {
      setRoutineDays((prev) => [...prev, clonedDay]);
      setActiveDayIdx(routineDays.length);
      setTemplateSuccessMsg(
        `✓ Día "${sourceDay.name}" importado como nuevo día en la rutina actual.`
      );
    } else {
      setRoutineDays((prev) => {
        const copy = [...prev];
        copy[activeDayIdx] = clonedDay;
        return copy;
      });
      setTemplateSuccessMsg(
        `✓ Día actual reemplazado con "${sourceDay.name}".`
      );
    }

    setShowImportDayBox(false);
    setTimeout(() => setTemplateSuccessMsg(null), 5000);
  }

  // Auto-Ajustar series, RIR, descansos y métodos según el Nivel seleccionado (Principiante / Intermedio / Avanzado)
  function handleAutoAdjustByLevel() {
    setRoutineDays((prev) => autoAdjustRoutineByLevel(prev, routineLevel));
    const levelName = TRAINING_LEVEL_LABELS[routineLevel].shortLabel;
    setTemplateSuccessMsg(
      `✓ Volumen, descansos y RIR optimizados automáticamente para nivel ${levelName}.`
    );
    setTimeout(() => setTemplateSuccessMsg(null), 4500);
  }

  // Descargar PDF Vertical estilo Contreras Nutrición Fit con enlaces clicables a YouTube
  async function handleExportPdf() {
    setIsGeneratingPdf(true);
    try {
      await generateWorkoutRoutinePdf({
        patientName: selectedPatient?.fullName || 'Paciente',
        weightKg: selectedPatient?.weightKg,
        routineTitle,
        routineGoal,
        level: routineLevel,
        days: routineDays,
        clinicName: 'Contreras Nutrición Fit',
        autoYoutubeFallback: true,
      });
    } catch (err: any) {
      setSaveError(err?.message || 'Error al generar el PDF de la rutina');
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  // Guardar la rutina actual en la Base de Datos como Plantilla Reutilizable
  async function handleSaveAsTemplate() {
    setIsSavingTemplate(true);
    setSaveError(null);
    setTemplateSuccessMsg(null);

    try {
      const cleanTemplateTitle = routineTitle.includes('•')
        ? routineTitle.split('•')[0].trim()
        : routineTitle.trim();

      const res = await saveWorkoutTemplateAction({
        title: cleanTemplateTitle || 'Rutina Personalizada',
        goal: routineGoal,
        days: routineDays,
      });

      if (res?.success && res.template) {
        setTemplatesList((prev) => [res.template!, ...prev]);
        setTemplateSuccessMsg(
          `✓ Rutina "${res.template.title}" guardada en Mis Plantillas (BD). Ahora puedes cargarla o clonar cualquiera de sus días.`
        );
        setTimeout(() => setTemplateSuccessMsg(null), 6000);
      } else {
        setSaveError(res?.error || 'Error al guardar la plantilla');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Error inesperado al guardar plantilla');
    } finally {
      setIsSavingTemplate(false);
    }
  }

  async function handleDeleteTemplate(templateId: string, title: string) {
    const res = await deleteWorkoutTemplateAction(templateId);
    if (res?.success) {
      setTemplatesList((prev) => prev.filter((t) => t.id !== templateId));
      setTemplateSuccessMsg(`Plantilla "${title}" eliminada.`);
      setTimeout(() => setTemplateSuccessMsg(null), 3500);
    } else if (res?.error) {
      setSaveError(res.error);
    }
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

  // Agregar ejercicio desde la biblioteca BD al día actual
  function handleAddExerciseFromCatalog(item: ExerciseCatalogItem) {
    // Sugerir una variante automática del mismo grupo muscular que esté en la BD
    const sameMuscleAlternative = catalogList.find(
      (c) => c.muscleGroup === item.muscleGroup && c.id !== item.id
    );

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
      videoUrl: item.videoUrl || '',
      alternativeExercise: item.alternativeExercise || sameMuscleAlternative?.name || '',
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

  // Crear ejercicio en la Base de Datos (tabla exercise_catalog) y añadirlo al día actual
  async function handleAddCustomExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!customExName.trim()) return;
    setIsCreatingCatalogEx(true);
    setCatalogExMessage(null);

    try {
      const res = await createExerciseInCatalogAction({
        name: customExName.trim(),
        muscleGroup: customExMuscle,
        equipment: customExEquipment.trim() || 'Máquina',
        defaultSets: customExSets,
        defaultReps: customExReps,
        defaultRir: 'RIR 1-2',
        defaultRestSeconds: customExRestSec,
        videoUrl: customExVideoUrl.trim() || undefined,
      });

      if (res?.success && res.exercise) {
        setCatalogList((prev) => [res.exercise!, ...prev]);
        handleAddExerciseFromCatalog(res.exercise);
        setCustomExName('');
        setCustomExVideoUrl('');
        setCatalogExMessage(`✓ "${res.exercise.name}" guardado en BD y añadido al día.`);
        setTimeout(() => setCatalogExMessage(null), 4000);
      } else {
        setCatalogExMessage(res?.error || 'Error al guardar en base de datos');
      }
    } finally {
      setIsCreatingCatalogEx(false);
    }
  }

  async function handleDeleteFromCatalog(exerciseId: string, exerciseName: string) {
    const res = await deleteExerciseFromCatalogAction(exerciseId);
    if (res?.success) {
      setCatalogList((prev) => prev.filter((item) => item.id !== exerciseId));
    } else if (res?.error) {
      alert(`Error al eliminar "${exerciseName}": ${res.error}`);
    }
  }

  // Guardar el link de YouTube de un ejercicio directamente en el catálogo de la BD para futuras rutinas
  async function handleSaveExerciseVideoToCatalog(exerciseId: string, videoUrl: string, exName: string) {
    if (!exerciseId) return;
    const res = await updateExerciseVideoUrlInCatalogAction(exerciseId, videoUrl);
    if (res?.success) {
      setCatalogList((prev) =>
        prev.map((item) =>
          item.id === exerciseId ? { ...item, videoUrl: videoUrl.trim() } : item
        )
      );
      setTemplateSuccessMsg(
        `✓ Link de YouTube guardado en la Base de Datos para "${exName}".`
      );
      setTimeout(() => setTemplateSuccessMsg(null), 4000);
    }
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

  // Filtrar catálogo de ejercicios desde la base de datos
  const filteredCatalog = useMemo(() => {
    return catalogList.filter((item) => {
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
  }, [catalogList, searchQuery, selectedMuscle, selectedEquipment]);

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
        level: routineLevel,
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
            Constructor de Rutinas, Analítica & Cargas
          </h1>
          <p className="text-sm text-[#94a3b8]">
            Planifica por niveles, clona días o rutinas, vincula videos de YouTube, analiza el volumen efectivo (MEV/MAV/MRV) y exporta en PDF vertical
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

        {/* Botones Rápidos Superiores: Exportar PDF Vertical & Copiar Rutina Completa */}
        {activeTab === 'builder' && (
          <div className="flex flex-wrap items-center gap-2">
            {patientsList.some((p) => p.activePlan && p.id !== selectedPatientId) && (
              <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#162229] px-2.5 py-1.5">
                <Copy className="h-3.5 w-3.5 text-[#38bdf8]" />
                <select
                  value=""
                  onChange={(e) => handleCopyFromAnotherPatient(e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-[#38bdf8] focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#111a1f] text-[#94a3b8]">
                    Copiar rutina entera de otro cliente...
                  </option>
                  {patientsList
                    .filter((p) => p.activePlan && p.id !== selectedPatientId)
                    .map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        className="bg-[#111a1f] text-white"
                      >
                        {p.fullName} — {p.activePlan?.title} ({p.activePlan?.days.length}d)
                      </option>
                    ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] border border-[#34d399]/40 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-md hover:brightness-110 transition cursor-pointer disabled:opacity-50"
              title="Descargar rutina en PDF Vertical estilo Contreras Nutrición Fit con links clicables a YouTube"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <FileDown className="h-3.5 w-3.5 text-[#34d399]" />
                  ⚡ Descargar PDF Vertical (Links YouTube)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ==================== TAB 1: CONSTRUCTOR DE RUTINAS ==================== */}
      {activeTab === 'builder' && (
        <div className="space-y-5">
          {/* Barra de Mis Rutinas Guardadas & Plantillas por Nivel (Principiante / Intermedio / Avanzado) */}
          <div className="rounded-2xl border border-white/10 bg-[#111a1f]/90 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="h-4 w-4 text-[#34d399]" />
                <span className="text-xs font-extrabold text-white">
                  Mis Rutinas Guardadas & Plantillas por Nivel ({templatesList.length})
                </span>
                <span className="text-[11px] text-[#94a3b8]">
                  — Carga una rutina entera con 1 clic para {selectedPatient?.fullName.split(' ')[0] || 'tu paciente'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {templatesList.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition ${
                    tpl.isCustom
                      ? 'border-[#245748] bg-[#14352b]/70 text-[#a7f3d0]'
                      : 'border-white/10 bg-[#162229] text-[#cbd5e1]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleLoadTemplate(tpl.id)}
                    className="flex items-center gap-1.5 font-bold hover:text-white cursor-pointer"
                    title={`Cargar "${tpl.title}" (${tpl.days.length} días)`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#34d399] shrink-0" />
                    <span>{tpl.title.split('•')[0].trim()}</span>
                    <span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] text-[#34d399]">
                      {tpl.days.length}d
                    </span>
                    {tpl.level && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-[#cbd5e1]">
                        {TRAINING_LEVEL_LABELS[tpl.level]?.shortLabel}
                      </span>
                    )}
                    {tpl.isCustom && (
                      <span className="rounded bg-[#34d399]/20 px-1.5 py-0.5 text-[9px] font-extrabold text-[#34d399]">
                        Guardada
                      </span>
                    )}
                  </button>

                  {tpl.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(tpl.id, tpl.title)}
                      className="ml-1 rounded p-0.5 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                      title="Eliminar plantilla guardada"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Configuración General: Nombre, Objetivo, Nivel del Cliente y Botones de Guardado */}
          <div className="grid grid-cols-1 gap-3.5 rounded-3xl border border-white/10 bg-[#111a1f] p-5 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-[#94a3b8]">
                Nombre de la Rutina / Mesociclo
              </label>
              <input
                type="text"
                value={routineTitle}
                onChange={(e) => setRoutineTitle(e.target.value)}
                placeholder="Ej. Mesociclo 1 • Torso / Pierna"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs font-bold text-white focus:border-[#34d399] focus:outline-none"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-[#94a3b8]">
                Enfoque / Objetivo
              </label>
              <input
                type="text"
                value={routineGoal}
                onChange={(e) => setRoutineGoal(e.target.value)}
                placeholder="Ej. Hipertrofia"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:border-[#34d399] focus:outline-none"
              />
            </div>

            {/* Nivel del Cliente + Auto-Ajuste */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-[#94a3b8]">
                Nivel del Paciente (Dosificación)
              </label>
              <div className="mt-1 flex items-center gap-1.5">
                <select
                  value={routineLevel}
                  onChange={(e) => setRoutineLevel(e.target.value as TrainingLevel)}
                  className="flex-1 rounded-xl border border-white/10 bg-[#162229] px-2.5 py-2 text-xs font-bold text-[#34d399] focus:outline-none cursor-pointer"
                >
                  <option value="beginner">Principiante (RIR 2-3 • 2-3 series)</option>
                  <option value="intermediate">Intermedio (RIR 1-2 • 3-4 series)</option>
                  <option value="advanced">Avanzado (RIR 0-1 • Top Set / Drop)</option>
                </select>
                <button
                  type="button"
                  onClick={handleAutoAdjustByLevel}
                  className="flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-950/50 px-2.5 py-2 text-[11px] font-bold text-amber-300 hover:bg-amber-900/60 transition cursor-pointer shrink-0"
                  title="Ajusta automáticamente las series, RIR, descansos y métodos de toda la rutina a este nivel"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Adaptar
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:col-span-4">
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={isSavingTemplate}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#34d399]/40 bg-[#14352b]/60 px-3 py-2.5 text-xs font-extrabold text-[#a7f3d0] transition hover:bg-[#14352b] hover:text-white disabled:opacity-50 cursor-pointer"
                title="Guarda esta rutina en Mis Plantillas para reutilizarla con otros pacientes"
              >
                {isSavingTemplate ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4 text-[#34d399]" />
                    Guardar Plantilla
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveRoutine}
                disabled={isSaving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-3.5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-[#1b4337]/40 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Asignar a {selectedPatient?.fullName.split(' ')[0] || 'Paciente'}
                  </>
                )}
              </button>
            </div>
          </div>

          {templateSuccessMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#38bdf8]/40 bg-[#0f2231] p-3.5 text-xs font-bold text-[#bae6fd]">
              <BookmarkCheck className="h-4 w-4 text-[#38bdf8] shrink-0" />
              <span>{templateSuccessMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#34d399]/40 bg-[#14352b] p-4 text-xs font-bold text-[#a7f3d0]">
              <CheckCircle2 className="h-5 w-5 text-[#34d399]" />
              <span>
                ¡Rutina guardada y asignada exitosamente a {selectedPatient?.fullName}! Ya está disponible en su portal y lista para descargar en PDF.
              </span>
            </div>
          )}

          {saveError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
              {saveError}
            </div>
          )}

          {/* ==================== PANEL DIDÁCTICO DE MÉTRICAS: VOLUMEN POR MÚSCULO, ESTÍMULO Y FATIGA ==================== */}
          <div className="rounded-3xl border border-white/10 bg-[#111a1f] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAnalyticsPanel((prev) => !prev)}
              className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-[#162229]/60 transition cursor-pointer"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#14352b] text-[#34d399]">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-heading text-sm font-extrabold text-white">
                    Analítica Científica de Dosificación: Volumen Semanal (MEV/MAV/MRV) & Fatiga
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#94a3b8]">
                    <span>
                      Total Semanal: <strong className="text-white">{analytics.totalWeeklySets} series</strong> ({analytics.totalWeeklyExercises} ejercicios)
                    </span>
                    <span>•</span>
                    <span>
                      Promedio por Sesión: <strong className="text-[#34d399]">{analytics.avgSetsPerDay} series (~{analytics.avgDurationMinutes} min)</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Estado SNC: <strong className="text-[#38bdf8]">{analytics.globalStatusLabel}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                <span>{showAnalyticsPanel ? 'Ocultar métricas' : 'Ver desglose muscular'}</span>
                {showAnalyticsPanel ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>

            {showAnalyticsPanel && (
              <div className="border-t border-white/10 p-5 space-y-4 bg-[#0d1518]/60">
                {/* Tarjetas Resumen de Balance y Fatiga por Día */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                      Balance Tren Superior
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="font-heading text-sm font-extrabold text-white">
                        Empuje: {analytics.pushSets}s vs Tracción: {analytics.pullSets}s
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#64748b]">
                      Pecho/Hombro/Tríceps vs Espalda/Bíceps
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                      Balance Tren Inferior
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="font-heading text-sm font-extrabold text-white">
                        Rodilla: {analytics.quadDominantSets}s vs Cadera: {analytics.hipPosteriorSets}s
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#64748b]">
                      Cuádriceps vs Glúteos + Isquiosurales
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-3.5 sm:col-span-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                      Carga y Duración Estimada por Sesión (Meta ideal: 14–20 series/día)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analytics.dayMetrics.map((dm, i) => (
                        <span
                          key={dm.dayId || i}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold ${dm.fatigueColor}`}
                        >
                          <Activity className="h-3 w-3" />
                          D{i + 1}: {dm.totalSets} series (~{dm.estimatedMinutes} min)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Semáforo de Series Efectivas Semanales por Grupo Muscular */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-extrabold text-white">
                      Estímulo Semanal por Grupo Muscular (Series Directas + Sinergistas)
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#94a3b8]">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-sky-400"></span> 1-5 Mantenimiento
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-teal-400"></span> 6-9 Efectivo (MEV)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-[#34d399]"></span> 10-18 Óptimo Hipertrofia (MAV)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-400"></span> 19-22 Límite Alto (MRV)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-500"></span> &gt;22 Exceso Fatiga
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                    {analytics.muscleVolumes.map((mv) => (
                      <div
                        key={mv.muscle}
                        className="rounded-2xl border border-white/5 bg-[#111a1f] p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold text-white">{mv.muscle}</span>
                          <span className="text-xs font-extrabold text-[#34d399]">
                            {mv.directSets} series
                          </span>
                        </div>

                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full transition-all duration-300 ${mv.barColor}`}
                            style={{ width: `${mv.progressPct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`rounded px-1.5 py-0.5 font-bold border ${mv.badgeColor}`}>
                            {mv.zoneLabel}
                          </span>
                          <span className="text-[#64748b]">
                            Frec: {mv.frequencyDays}x/sem
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alertas Didácticas si algún día o músculo excede el volumen recuperable */}
                {analytics.coachAlerts.length > 0 && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-3 space-y-1">
                    {analytics.coachAlerts.map((alertStr, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>{alertStr}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Barra de Días de Entrenamiento + Botón de Clonar Día Específico */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {routineDays.map((day, idx) => {
                const isSelected = idx === activeDayIdx;
                const totalSetsInDay = day.exercises.reduce(
                  (acc, e) => acc + (Number(e.targetSets) || 0),
                  0
                );
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
                      {day.exercises.length} ej. • {totalSetsInDay}s
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
                + Añadir Día Vacío
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowImportDayBox((prev) => !prev);
                  if (!importSourceKey && availableDaySources[0]) {
                    setImportSourceKey(availableDaySources[0].key);
                    setImportDayId(availableDaySources[0].days[0]?.id || '');
                  }
                }}
                className="flex items-center gap-1.5 rounded-2xl border border-[#38bdf8]/40 bg-[#0f2231] px-3.5 py-2.5 text-xs font-bold text-[#38bdf8] hover:bg-[#163247] hover:text-white transition cursor-pointer"
                title="Copia un día específico (ej. Día de Tren Superior o Pierna) de otro paciente o plantilla"
              >
                <Layers className="h-3.5 w-3.5" />
                + Importar Día de otro Cliente / Plantilla
              </button>
            </div>

            {/* Selector Desplegable para Clonar un Día Específico de otro Paciente o Plantilla */}
            {showImportDayBox && (
              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#38bdf8]/40 bg-[#0f2231]/90 p-4">
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-[11px] font-bold text-[#bae6fd]">
                    1. Selecciona de qué Cliente o Plantilla quieres traer el día:
                  </label>
                  <select
                    value={importSourceKey}
                    onChange={(e) => {
                      const nextKey = e.target.value;
                      setImportSourceKey(nextKey);
                      const src = availableDaySources.find((s) => s.key === nextKey);
                      setImportDayId(src?.days[0]?.id || '');
                    }}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#111a1f] px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  >
                    {availableDaySources.map((src) => (
                      <option key={src.key} value={src.key}>
                        {src.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[220px]">
                  <label className="block text-[11px] font-bold text-[#bae6fd]">
                    2. Elige el Día Específico (ej. Tren Superior, Pierna, Push...):
                  </label>
                  <select
                    value={importDayId}
                    onChange={(e) => setImportDayId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#111a1f] px-3 py-2 text-xs font-bold text-[#34d399] focus:outline-none"
                  >
                    {(selectedImportSource?.days || []).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.exercises.length} ejercicios — {d.focus})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleImportSpecificDay('append')}
                    className="rounded-xl bg-[#34d399] px-3.5 py-2 text-xs font-extrabold text-[#0d1518] hover:bg-[#34d399]/90 transition cursor-pointer"
                  >
                    + Añadir como Día Nuevo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImportSpecificDay('replace_current')}
                    className="rounded-xl border border-[#38bdf8]/50 bg-[#162229] px-3.5 py-2 text-xs font-bold text-[#38bdf8] hover:text-white transition cursor-pointer"
                  >
                    Reemplazar {currentDay?.name.split('•')[0] || 'Día Actual'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Grid Principal: Izquierda (Ejercicios del Día) | Derecha (Biblioteca en BD) */}
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
                        Duplicar Día
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
                      No hay ejercicios en este día todavía. Haz clic en cualquier ejercicio de tu Base de Datos a la derecha para agregarlo.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentDay.exercises.map((ex, exIdx) => {
                        const lastMark = getLastLoggedMarkForExercise(ex.name, ex.exerciseId);
                        const sameMuscleOptions = catalogList.filter(
                          (c) => c.muscleGroup === ex.muscleGroup && c.name !== ex.name
                        );

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
                                    • {ex.equipment} • Descanso:{' '}
                                    <strong className="text-[#34d399]">
                                      {formatRestMinutes(ex.restSeconds)}
                                    </strong>
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

                            {/* Controles de Series, Reps, RIR, Descanso en Minutos, Método y Biserie */}
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
                                  Descanso (Min)
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
                                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-[#111a1f] px-2 py-1.5 text-xs font-bold text-[#34d399] focus:outline-none"
                                >
                                  {REST_TIME_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#94a3b8]">
                                  Método / Intensidad
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

                            {/* Link de Video en YouTube y Variante Alternativa */}
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {/* Campo de Video de YouTube */}
                              <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#111a1f] px-2.5 py-1.5">
                                <PlayCircle className="h-4 w-4 text-rose-400 shrink-0" />
                                <input
                                  type="url"
                                  value={ex.videoUrl || ''}
                                  onChange={(e) =>
                                    updateRoutineExercise(exIdx, 'videoUrl', e.target.value)
                                  }
                                  placeholder="Link YouTube (o usa guía automática en PDF)"
                                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                                />
                                {ex.videoUrl && ex.exerciseId && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSaveExerciseVideoToCatalog(
                                        ex.exerciseId,
                                        ex.videoUrl || '',
                                        ex.name
                                      )
                                    }
                                    className="shrink-0 rounded bg-[#14352b] px-1.5 py-0.5 text-[10px] font-bold text-[#34d399] hover:bg-[#1b4337] cursor-pointer"
                                    title="Guardar este link de YouTube como predeterminado para este ejercicio en tu Base de Datos"
                                  >
                                    Fijar en BD
                                  </button>
                                )}
                                <a
                                  href={
                                    ex.videoUrl && ex.videoUrl.trim()
                                      ? ex.videoUrl.trim()
                                      : getDefaultYoutubeSearchUrl(ex.name)
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 rounded bg-rose-950/80 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 hover:text-white"
                                  title="Probar o buscar video en YouTube"
                                >
                                  Ver ▶
                                </a>
                              </div>

                              {/* Campo de Variante / Ejercicio Alternativo */}
                              <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#111a1f] px-2.5 py-1.5">
                                <RefreshCw className="h-3.5 w-3.5 text-[#38bdf8] shrink-0" />
                                <input
                                  type="text"
                                  list={`alt-list-${ex.id}`}
                                  value={ex.alternativeExercise || ''}
                                  onChange={(e) =>
                                    updateRoutineExercise(
                                      exIdx,
                                      'alternativeExercise',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Variante / Sustituto (ej. Prensa 45°)"
                                  className="w-full bg-transparent text-xs text-[#bae6fd] focus:outline-none"
                                />
                                <datalist id={`alt-list-${ex.id}`}>
                                  {sameMuscleOptions.slice(0, 12).map((alt) => (
                                    <option key={alt.id} value={alt.name} />
                                  ))}
                                </datalist>
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

            {/* COLUMNA DERECHA (5 cols): Biblioteca de Ejercicios desde la Base de Datos & Creación */}
            <div className="space-y-4 lg:col-span-5">
              <div className="sticky top-6 rounded-3xl border border-white/10 bg-[#111a1f] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-heading text-base font-extrabold text-white">
                      Catálogo de Ejercicios en BD ({catalogList.length})
                    </h3>
                    <p className="text-[11px] text-[#94a3b8]">
                      100% conectado a tu tabla <code className="text-[#34d399]">exercise_catalog</code> en Supabase
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
                    placeholder="Buscar en tu BD: Press inclinado, Sentadilla Hack, Jalón..."
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

                {/* Lista Scrolleable de Ejercicios en BD */}
                <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
                  {filteredCatalog.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-[#64748b]">
                      {catalogList.length === 0
                        ? 'Tu tabla exercise_catalog está vacía. Corre la query de seed en Supabase o agrega ejercicios abajo.'
                        : 'No se encontraron ejercicios con ese filtro.'}
                    </div>
                  ) : (
                    filteredCatalog.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-[#162229] p-2.5 hover:border-[#34d399]/50 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-bold text-white">
                              {item.name}
                            </span>
                            {item.videoUrl && (
                              <span
                                className="shrink-0 rounded bg-rose-950 px-1.5 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-500/30"
                                title={item.videoUrl}
                              >
                                ▶ Video
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#94a3b8]">
                            <span className="text-[#38bdf8] font-semibold">
                              {item.muscleGroup}
                            </span>{' '}
                            • {item.equipment} • {item.defaultSets}×{item.defaultReps} • Descanso:{' '}
                            {formatRestMinutes(item.defaultRestSeconds)}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteFromCatalog(item.id, item.name)}
                            className="rounded-lg p-1.5 text-rose-400/70 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer"
                            title="Eliminar ejercicio de la base de datos"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddExerciseFromCatalog(item)}
                            className="flex items-center gap-1 rounded-xl bg-[#14352b] border border-[#245748] px-2.5 py-1.5 text-[11px] font-bold text-[#34d399] hover:bg-[#1b4337] hover:text-white transition cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Añadir
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Crear Ejercicio Nuevo Permanentemente en la Base de Datos */}
                <form
                  onSubmit={handleAddCustomExercise}
                  className="border-t border-white/10 pt-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#a7f3d0]">
                      + Agregar Nuevo Ejercicio a tu Base de Datos:
                    </span>
                    <span className="text-[10px] text-[#64748b]">Con link de YouTube opcional</span>
                  </div>

                  {catalogExMessage && (
                    <div className="rounded-xl border border-[#34d399]/30 bg-[#14352b]/70 px-3 py-1.5 text-[11px] font-semibold text-[#a7f3d0]">
                      {catalogExMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      required
                      placeholder="Nombre (ej. Prensa Péndulo Unilateral)"
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

                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Equipo (Máquina)"
                      value={customExEquipment}
                      onChange={(e) => setCustomExEquipment(e.target.value)}
                      className="rounded-xl border border-white/10 bg-[#162229] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#162229] px-2 py-1.5">
                      <span className="text-[10px] text-[#94a3b8]">Series:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={customExSets}
                        onChange={(e) => setCustomExSets(Math.max(1, Number(e.target.value) || 3))}
                        className="w-full bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#162229] px-2 py-1.5">
                      <span className="text-[10px] text-[#94a3b8]">Reps:</span>
                      <input
                        type="text"
                        value={customExReps}
                        onChange={(e) => setCustomExReps(e.target.value)}
                        className="w-full bg-transparent text-center text-xs font-bold text-[#38bdf8] focus:outline-none"
                      />
                    </div>
                    <select
                      value={customExRestSec}
                      onChange={(e) => setCustomExRestSec(Number(e.target.value))}
                      className="rounded-xl border border-white/10 bg-[#162229] px-2 py-1.5 text-xs font-bold text-[#34d399] focus:outline-none"
                    >
                      {REST_TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5">
                    <PlayCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    <input
                      type="url"
                      placeholder="Link de YouTube del ejercicio (opcional, ej. https://youtu.be/...)"
                      value={customExVideoUrl}
                      onChange={(e) => setCustomExVideoUrl(e.target.value)}
                      className="w-full bg-transparent text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingCatalogEx}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#34d399] px-3 py-2 text-xs font-extrabold text-[#0d1518] hover:bg-[#34d399]/90 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatingCatalogEx ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Guardando en Base de Datos...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        Guardar en Base de Datos y Añadir al Día
                      </>
                    )}
                  </button>
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
              level: routineLevel,
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
