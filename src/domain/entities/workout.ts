// LAYER: Domain
// Entidades, Biblioteca Amplia de Ejercicios con Variantes y Plantillas de Rutinas de Entrenamiento

export type MuscleGroup =
  | 'Pecho'
  | 'Espalda'
  | 'Hombros'
  | 'Cuádriceps'
  | 'Isquiosurales'
  | 'Glúteos'
  | 'Bíceps'
  | 'Tríceps'
  | 'Pantorrillas'
  | 'Abdomen / Core';

export type SetMethod =
  | 'normal'
  | 'top_backoff'
  | 'dropset'
  | 'rest_pause'
  | 'myo_reps'
  | 'warmup';

export const SET_METHOD_LABELS: Record<SetMethod, { label: string; badgeColor: string }> = {
  normal: { label: 'Serie Efectiva', badgeColor: 'bg-[#14352b] text-[#34d399] border-[#245748]' },
  top_backoff: { label: 'Top Set + Back-off', badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-500/40' },
  dropset: { label: 'Drop Set (Descendente)', badgeColor: 'bg-rose-950/60 text-rose-300 border-rose-500/40' },
  rest_pause: { label: 'Rest-Pause', badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-500/40' },
  myo_reps: { label: 'Myo-Reps', badgeColor: 'bg-sky-950/60 text-sky-300 border-sky-500/40' },
  warmup: { label: 'Aproximación + Efectivas', badgeColor: 'bg-slate-800 text-slate-300 border-slate-600' },
};

export const SUPERSET_OPTIONS = [
  { value: '', label: 'Individual (Sin Biserie)' },
  { value: 'A', label: 'Biserie A (A1 + A2)' },
  { value: 'B', label: 'Biserie B (B1 + B2)' },
  { value: 'C', label: 'Biserie C (C1 + C2)' },
  { value: 'D', label: 'Biserie D (D1 + D2)' },
];

export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced';

export const TRAINING_LEVEL_LABELS: Record<
  TrainingLevel,
  { label: string; shortLabel: string; description: string; badgeColor: string }
> = {
  beginner: {
    label: 'Principiante (Adaptación & Técnica)',
    shortLabel: 'Principiante',
    description: '2-3 series por ejercicio • RIR 2-3 • Enfoque en aprendizaje motor y adherencia',
    badgeColor: 'bg-sky-950/70 text-sky-300 border-sky-500/40',
  },
  intermediate: {
    label: 'Intermedio (Hipertrofia & Progresión)',
    shortLabel: 'Intermedio',
    description: '3-4 series por ejercicio • RIR 1-2 • Sobrecarga progresiva estructurada',
    badgeColor: 'bg-[#14352b] text-[#34d399] border-[#245748]',
  },
  advanced: {
    label: 'Avanzado (Alta Intensidad & Especialización)',
    shortLabel: 'Avanzado',
    description: 'Top Sets + Back-off, Drop Sets y RIR 0-1 con control fino de fatiga',
    badgeColor: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
  },
};

export const REST_TIME_OPTIONS = [
  { value: 45, label: '0.75 min (45 seg)' },
  { value: 60, label: '1 min' },
  { value: 75, label: '1.25 min (1m 15s)' },
  { value: 90, label: '1.5 min' },
  { value: 120, label: '2 min' },
  { value: 150, label: '2.5 min' },
  { value: 180, label: '3 min' },
  { value: 240, label: '4 min' },
];

/**
 * Formatea los segundos de descanso a minutos amigables para el usuario y el PDF
 */
export function formatRestMinutes(seconds: number | undefined | null): string {
  const sec = Number(seconds) || 90;
  if (sec < 60) return `${sec} seg`;
  const mins = sec / 60;
  if (Number.isInteger(mins)) return `${mins} min`;
  if (sec === 75) return '1.25 min';
  if (sec === 90) return '1.5 min';
  if (sec === 150) return '2.5 min';
  if (sec === 210) return '3.5 min';
  return `${mins.toFixed(1)} min`;
}

/**
 * Devuelve un enlace de búsqueda técnica en YouTube si el ejercicio aún no tiene URL personalizada
 */
export function getDefaultYoutubeSearchUrl(exerciseName: string): string {
  const query = encodeURIComponent(`${exerciseName} tecnica correcta gimnasio`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

export interface ExerciseCatalogItem {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  defaultSets: number;
  defaultReps: string;
  defaultRir: string;
  defaultRestSeconds: number;
  tips?: string;
  videoUrl?: string;
  alternativeExercise?: string;
  isCustom?: boolean;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  targetSets: number;
  targetReps: string;
  targetRir: string;
  restSeconds: number;
  setMethod: SetMethod;
  supersetGroup?: string | null; // 'A', 'B', 'C', 'D' or null
  coachNotes?: string;
  videoUrl?: string;
  alternativeExercise?: string;
}

export interface WorkoutDay {
  id: string;
  name: string;
  focus: string;
  exercises: RoutineExercise[];
}

export interface WorkoutPlan {
  id: string;
  patientId: string;
  title: string;
  goal: string;
  level?: TrainingLevel;
  daysPerWeek: number;
  days: WorkoutDay[];
  notes?: string | null;
  isCurrent: boolean;
  createdAt: string;
}

export interface LoggedSet {
  setNumber: number;
  weightKg: number | '';
  reps: number | '';
  rir: string;
  completed: boolean;
}

export interface LoggedExercise {
  routineExerciseId: string;
  exerciseId?: string;
  exerciseName: string;
  muscleGroup: string;
  targetSummary: string;
  supersetGroup?: string | null;
  sets: LoggedSet[];
  patientNotes?: string;
}

export interface WorkoutLogEntry {
  id: string;
  patientId: string;
  workoutPlanId?: string | null;
  logDate: string;
  dayId: string;
  dayName: string;
  exercises: LoggedExercise[];
  durationMinutes?: number | null;
  notes?: string | null;
  createdAt: string;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Cuádriceps',
  'Isquiosurales',
  'Glúteos',
  'Bíceps',
  'Tríceps',
  'Pantorrillas',
  'Abdomen / Core',
];

export interface WorkoutTemplate {
  id: string;
  title: string;
  goal: string;
  description: string;
  level?: TrainingLevel;
  days: WorkoutDay[];
  isCustom?: boolean;
  createdAt?: string;
}

/**
 * Plantillas listas para cargar con 1 clic en el constructor del administrador (Principiante, Intermedio y Avanzado)
 */
export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'fullbody-3d-principiante',
    title: 'Full Body • 3 Días (Nivel Principiante)',
    goal: 'Adaptación Técnica & Recomposición Inicial',
    level: 'beginner',
    description: '3 sesiones de cuerpo completo con foco en máquinas estables, control motor y RIR 2-3.',
    days: [
      {
        id: 'fb-1',
        name: 'Día 1 • Cuerpo Completo A (Base & Control)',
        focus: 'Cuádriceps, Pecho, Espalda y Core',
        exercises: [
          {
            id: 'fb-1-1',
            exerciseId: 'cuad-prensa-45',
            name: 'Prensa de Piernas 45° (Leg Press)',
            muscleGroup: 'Cuádriceps',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 2',
            restSeconds: 120,
            setMethod: 'normal',
            supersetGroup: null,
            alternativeExercise: 'Sentadilla Goblet con Mancuerna (Talones Elevados)',
            coachNotes: 'Baja controlado 2-3 segundos sin despegar la cadera del respaldo.',
          },
          {
            id: 'fb-1-2',
            exerciseId: 'pec-press-maquina-convergente',
            name: 'Press de Pecho en Máquina Convergente',
            muscleGroup: 'Pecho',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 2',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
            alternativeExercise: 'Press Plano con Mancuernas',
            coachNotes: 'Mantén los hombros atrás pegados al respaldo.',
          },
          {
            id: 'fb-1-3',
            exerciseId: 'esp-jalon-pecho-prono',
            name: 'Jalón al Pecho Agarre Prono Ancho',
            muscleGroup: 'Espalda',
            equipment: 'Polea',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 2',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
            alternativeExercise: 'Jalón al Pecho Agarre Neutro Estrecho (Triángulo / MAG)',
            coachNotes: 'Lleva la barra hacia la parte superior del pecho sin columpiarte.',
          },
          {
            id: 'fb-1-4',
            exerciseId: 'isq-curl-femoral-sentado',
            name: 'Curl Femoral Sentado en Máquina',
            muscleGroup: 'Isquiosurales',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '12-15',
            targetRir: 'RIR 1-2',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
            alternativeExercise: 'Curl Femoral Tumbado / Acostado en Máquina',
          },
          {
            id: 'fb-1-5',
            exerciseId: 'hom-elevaciones-laterales-mancuernas',
            name: 'Elevaciones Laterales con Mancuernas',
            muscleGroup: 'Hombros',
            equipment: 'Mancuernas',
            targetSets: 3,
            targetReps: '12-15',
            targetRir: 'RIR 1-2',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: null,
            alternativeExercise: 'Elevaciones Laterales en Máquina',
          },
          {
            id: 'fb-1-6',
            exerciseId: 'abd-plancha-isometrica',
            name: 'Plancha Abdominal Isométrica (RKC Plank)',
            muscleGroup: 'Abdomen / Core',
            equipment: 'Peso Corporal',
            targetSets: 3,
            targetReps: '40-45 seg',
            targetRir: 'RIR 1',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: null,
          },
        ],
      },
      {
        id: 'fb-2',
        name: 'Día 2 • Cuerpo Completo B (Cadena Posterior & Hombros)',
        focus: 'Glúteos, Espalda, Hombro y Brazos',
        exercises: [
          {
            id: 'fb-2-1',
            exerciseId: 'glu-hip-thrust-maquina',
            name: 'Hip Thrust en Máquina o Multipower',
            muscleGroup: 'Glúteos',
            equipment: 'Máquina / Smith',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 2',
            restSeconds: 120,
            setMethod: 'normal',
            supersetGroup: null,
            alternativeExercise: 'Hip Thrust con Barra',
            coachNotes: 'Pausa de 1 segundo arriba apretando glúteos.',
          },
          {
            id: 'fb-2-2',
            exerciseId: 'esp-remo-gironda-polea',
            name: 'Remo Sentado en Polea Baja (Gironda)',
            muscleGroup: 'Espalda',
            equipment: 'Polea',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 2',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
            alternativeExercise: 'Remo en Máquina Convergente (Bilateral o Unilateral)',
          },
          {
            id: 'fb-2-3',
            exerciseId: 'hom-press-militar-mancuernas',
            name: 'Press de Hombros Sentado con Mancuernas',
            muscleGroup: 'Hombros',
            equipment: 'Mancuernas',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 2',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
            alternativeExercise: 'Press de Hombros en Máquina Convergente',
          },
          {
            id: 'fb-2-4',
            exerciseId: 'cuad-extension-cuadriceps',
            name: 'Extensión de Cuádriceps en Máquina (Leg Extension)',
            muscleGroup: 'Cuádriceps',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '12-15',
            targetRir: 'RIR 1-2',
            restSeconds: 75,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'fb-2-5',
            exerciseId: 'bic-curl-alterno-mancuernas',
            name: 'Curl de Bíceps con Mancuernas (De Pie o Sentado)',
            muscleGroup: 'Bíceps',
            equipment: 'Mancuernas',
            targetSets: 2,
            targetReps: '12-15',
            targetRir: 'RIR 1-2',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: 'A',
          },
          {
            id: 'fb-2-6',
            exerciseId: 'tri-extension-polea-cuerda',
            name: 'Extensión de Tríceps en Polea Alta con Cuerda',
            muscleGroup: 'Tríceps',
            equipment: 'Polea',
            targetSets: 2,
            targetReps: '12-15',
            targetRir: 'RIR 1-2',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: 'A',
          },
        ],
      },
      {
        id: 'fb-3',
        name: 'Día 3 • Cuerpo Completo C (Estímulo Global)',
        focus: 'Piernas, Pecho Superior, Dorsal y Glúteo',
        exercises: [
          {
            id: 'fb-3-1',
            exerciseId: 'cuad-goblet-squat',
            name: 'Sentadilla Goblet con Mancuerna (Talones Elevados)',
            muscleGroup: 'Cuádriceps',
            equipment: 'Mancuernas',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 2',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
            alternativeExercise: 'Sentadilla en Multipower (Smith)',
          },
          {
            id: 'fb-3-2',
            exerciseId: 'isq-peso-muerto-rumano-mancuernas',
            name: 'Peso Muerto Rumano con Mancuernas',
            muscleGroup: 'Isquiosurales',
            equipment: 'Mancuernas',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 2',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
            alternativeExercise: 'Peso Muerto Rumano con Barra (RDL)',
          },
          {
            id: 'fb-3-3',
            exerciseId: 'pec-press-inclinado-mancuernas',
            name: 'Press Inclinado con Mancuernas (30°)',
            muscleGroup: 'Pecho',
            equipment: 'Mancuernas',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 1-2',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
            alternativeExercise: 'Press Inclinado en Multipower (Smith)',
          },
          {
            id: 'fb-3-4',
            exerciseId: 'esp-jalon-neutro-cerrado',
            name: 'Jalón al Pecho Agarre Neutro Estrecho (Triángulo / MAG)',
            muscleGroup: 'Espalda',
            equipment: 'Polea',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 1-2',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'fb-3-5',
            exerciseId: 'glu-abduccion-maquina',
            name: 'Abducción de Cadera en Máquina (Glúteo Medio)',
            muscleGroup: 'Glúteos',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '15-20',
            targetRir: 'RIR 1',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: null,
          },
        ],
      },
    ],
  },
  {
    id: 'torso-pierna-4d',
    title: 'Torso / Pierna • 4 Días (Nivel Intermedio)',
    goal: 'Hipertrofia & Recomposición Corporal',
    level: 'intermediate',
    description: '2 días de Tren Superior + 2 días de Tren Inferior con selección óptima de ejercicios.',
    days: [
      {
        id: 'day-1',
        name: 'Día 1 • Tren Superior A (Fuerza & Densidad)',
        focus: 'Pecho, Espalda, Hombro Lateral y Brazos',
        exercises: [
          {
            id: 'tp-1-1',
            exerciseId: 'pec-press-inclinado-mancuernas',
            name: 'Press Inclinado con Mancuernas (30°)',
            muscleGroup: 'Pecho',
            equipment: 'Mancuernas',
            targetSets: 4,
            targetReps: '8-10',
            targetRir: 'RIR 1-2',
            restSeconds: 120,
            setMethod: 'top_backoff',
            supersetGroup: null,
            coachNotes: 'Serie 1 pesada (Top Set 6-8 reps @ RIR 1), luego baja un 10% el peso para 3 series de 8-10 reps.',
          },
          {
            id: 'tp-1-2',
            exerciseId: 'esp-remo-punta-t-pecho',
            name: 'Remo en Punta T con Apoyo al Pecho (Chest-Supported)',
            muscleGroup: 'Espalda',
            equipment: 'Máquina',
            targetSets: 4,
            targetReps: '8-10',
            targetRir: 'RIR 1',
            restSeconds: 120,
            setMethod: 'normal',
            supersetGroup: null,
            coachNotes: 'Pausa de 1 seg arriba apretando escápulas.',
          },
          {
            id: 'tp-1-3',
            exerciseId: 'pec-aperturas-pec-deck',
            name: 'Aperturas en Máquina Contractora (Pec Deck)',
            muscleGroup: 'Pecho',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '12-15',
            targetRir: 'RIR 0-1',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
            coachNotes: 'Controla el estiramiento sin perder tensión.',
          },
          {
            id: 'tp-1-4',
            exerciseId: 'esp-jalon-neutro-cerrado',
            name: 'Jalón al Pecho Agarre Neutro Estrecho (Triángulo / MAG)',
            muscleGroup: 'Espalda',
            equipment: 'Polea',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 1',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
            coachNotes: 'Lleva los codos pegados al torso.',
          },
          {
            id: 'tp-1-5',
            exerciseId: 'hom-elevaciones-laterales-polea',
            name: 'Elevaciones Laterales Unilaterales en Polea Baja',
            muscleGroup: 'Hombros',
            equipment: 'Polea Unilateral',
            targetSets: 4,
            targetReps: '12-15',
            targetRir: 'RIR 0-1',
            restSeconds: 60,
            setMethod: 'dropset',
            supersetGroup: null,
            coachNotes: 'En la última serie aplica un Drop Set bajando 30% de peso al fallo.',
          },
          {
            id: 'tp-1-6',
            exerciseId: 'bic-curl-inclinado-mancuernas',
            name: 'Curl de Bíceps en Banco Inclinado 45° (Cabeza Larga)',
            muscleGroup: 'Bíceps',
            equipment: 'Mancuernas',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 0-1',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: 'A',
            coachNotes: 'Biserie A1 con Extensión de Tríceps.',
          },
          {
            id: 'tp-1-7',
            exerciseId: 'tri-extension-polea-cuerda',
            name: 'Extensión de Tríceps en Polea Alta con Cuerda',
            muscleGroup: 'Tríceps',
            equipment: 'Polea',
            targetSets: 3,
            targetReps: '12-15',
            targetRir: 'RIR 0-1',
            restSeconds: 75,
            setMethod: 'normal',
            supersetGroup: 'A',
            coachNotes: 'Biserie A2: abre la cuerda al final de cada repetición.',
          },
        ],
      },
      {
        id: 'day-2',
        name: 'Día 2 • Tren Inferior A (Énfasis Cuádriceps & Glúteo)',
        focus: 'Cuádriceps, Glúteos, Isquios y Gemelos',
        exercises: [
          {
            id: 'tp-2-1',
            exerciseId: 'cuad-sentadilla-hack',
            name: 'Sentadilla Hack en Máquina (Hack Squat)',
            muscleGroup: 'Cuádriceps',
            equipment: 'Máquina',
            targetSets: 4,
            targetReps: '8-10',
            targetRir: 'RIR 1-2',
            restSeconds: 150,
            setMethod: 'top_backoff',
            supersetGroup: null,
            coachNotes: 'Baja profundo controlando 3 segundos la bajada.',
          },
          {
            id: 'tp-2-2',
            exerciseId: 'isq-peso-muerto-rumano-barra',
            name: 'Peso Muerto Rumano con Barra (RDL)',
            muscleGroup: 'Isquiosurales',
            equipment: 'Barra',
            targetSets: 4,
            targetReps: '8-10',
            targetRir: 'RIR 1-2',
            restSeconds: 150,
            setMethod: 'normal',
            supersetGroup: null,
            coachNotes: 'Mantén la barra rozando las piernas y detente a mitad de espinilla.',
          },
          {
            id: 'tp-2-3',
            exerciseId: 'cuad-prensa-45',
            name: 'Prensa de Piernas 45° (Leg Press)',
            muscleGroup: 'Cuádriceps',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 1',
            restSeconds: 120,
            setMethod: 'normal',
            supersetGroup: null,
            coachNotes: 'Ritmo continuo sin bloquear las rodillas arriba.',
          },
          {
            id: 'tp-2-4',
            exerciseId: 'cuad-extension-cuadriceps',
            name: 'Extensión de Cuádriceps en Máquina (Leg Extension)',
            muscleGroup: 'Cuádriceps',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '12-15',
            targetRir: 'RIR 0-1',
            restSeconds: 75,
            setMethod: 'dropset',
            supersetGroup: 'A',
            coachNotes: 'Biserie A1 con Curl Femoral Sentado.',
          },
          {
            id: 'tp-2-5',
            exerciseId: 'isq-curl-femoral-sentado',
            name: 'Curl Femoral Sentado en Máquina',
            muscleGroup: 'Isquiosurales',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 0-1',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: 'A',
            coachNotes: 'Biserie A2: controla el retorno completo.',
          },
          {
            id: 'tp-2-6',
            exerciseId: 'pan-elevacion-talones-pie',
            name: 'Elevación de Talones de Pie en Máquina (Gemelos)',
            muscleGroup: 'Pantorrillas',
            equipment: 'Máquina / Smith',
            targetSets: 4,
            targetReps: '12-15',
            targetRir: 'RIR 0-1',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: null,
            coachNotes: 'Pausa 2 seg abajo en estiramiento.',
          },
        ],
      },
      {
        id: 'day-3',
        name: 'Día 3 • Tren Superior B (Amplitud & Hombros)',
        focus: 'Espalda, Hombros, Pecho y Brazos',
        exercises: [
          {
            id: 'tp-3-1',
            exerciseId: 'esp-jalon-pecho-prono',
            name: 'Jalón al Pecho Agarre Prono Ancho',
            muscleGroup: 'Espalda',
            equipment: 'Polea',
            targetSets: 4,
            targetReps: '8-12',
            targetRir: 'RIR 1',
            restSeconds: 120,
            setMethod: 'normal',
            supersetGroup: null,
            coachNotes: 'Enfócate en traccionar desde los codos.',
          },
          {
            id: 'tp-3-2',
            exerciseId: 'hom-press-militar-mancuernas',
            name: 'Press de Hombros Sentado con Mancuernas',
            muscleGroup: 'Hombros',
            equipment: 'Mancuernas',
            targetSets: 4,
            targetReps: '8-10',
            targetRir: 'RIR 1-2',
            restSeconds: 120,
            setMethod: 'normal',
            supersetGroup: null,
            coachNotes: 'Baja hasta la altura de las orejas/mentón.',
          },
          {
            id: 'tp-3-3',
            exerciseId: 'pec-press-maquina-convergente',
            name: 'Press de Pecho en Máquina Convergente',
            muscleGroup: 'Pecho',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 1',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'tp-3-4',
            exerciseId: 'esp-remo-gironda-polea',
            name: 'Remo Sentado en Polea Baja (Gironda)',
            muscleGroup: 'Espalda',
            equipment: 'Polea',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 1',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'tp-3-5',
            exerciseId: 'hom-elevaciones-laterales-mancuernas',
            name: 'Elevaciones Laterales con Mancuernas',
            muscleGroup: 'Hombros',
            equipment: 'Mancuernas',
            targetSets: 4,
            targetReps: '12-15',
            targetRir: 'RIR 0-1',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: 'A',
            coachNotes: 'Biserie A1 con Deltoides Posterior.',
          },
          {
            id: 'tp-3-6',
            exerciseId: 'hom-deltoides-posterior-pec-deck',
            name: 'Deltoides Posterior en Máquina (Reverse Pec Deck)',
            muscleGroup: 'Hombros',
            equipment: 'Máquina',
            targetSets: 4,
            targetReps: '12-15',
            targetRir: 'RIR 0-1',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: 'A',
          },
          {
            id: 'tp-3-7',
            exerciseId: 'bic-curl-predicador-scott',
            name: 'Curl Predicador en Banco Scott (Barra Z o Máquina)',
            muscleGroup: 'Bíceps',
            equipment: 'Barra / Máquina',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 0-1',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: 'B',
          },
          {
            id: 'tp-3-8',
            exerciseId: 'tri-extension-tras-nuca-polea',
            name: 'Extensión de Tríceps Tras Nuca en Polea (Overhead / Katana)',
            muscleGroup: 'Tríceps',
            equipment: 'Polea',
            targetSets: 3,
            targetReps: '10-15',
            targetRir: 'RIR 0-1',
            restSeconds: 75,
            setMethod: 'normal',
            supersetGroup: 'B',
          },
        ],
      },
      {
        id: 'day-4',
        name: 'Día 4 • Tren Inferior B (Cadena Posterior & Glúteos)',
        focus: 'Glúteos, Isquiosurales, Cuádriceps y Core',
        exercises: [
          {
            id: 'tp-4-1',
            exerciseId: 'glu-hip-thrust-barra',
            name: 'Hip Thrust con Barra',
            muscleGroup: 'Glúteos',
            equipment: 'Barra',
            targetSets: 4,
            targetReps: '8-10',
            targetRir: 'RIR 1',
            restSeconds: 150,
            setMethod: 'top_backoff',
            supersetGroup: null,
            coachNotes: 'Pausa isométrica de 1-2 segundos arriba en cada repetición.',
          },
          {
            id: 'tp-4-2',
            exerciseId: 'glu-sentadilla-bulgara-gluteo',
            name: 'Sentadilla Búlgara (Torso Inclinado - Énfasis Glúteo)',
            muscleGroup: 'Glúteos',
            equipment: 'Mancuernas / Smith',
            targetSets: 3,
            targetReps: '8-10',
            targetRir: 'RIR 1',
            restSeconds: 120,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'tp-4-3',
            exerciseId: 'isq-curl-femoral-tumbado',
            name: 'Curl Femoral Tumbado / Acostado en Máquina',
            muscleGroup: 'Isquiosurales',
            equipment: 'Máquina',
            targetSets: 4,
            targetReps: '10-12',
            targetRir: 'RIR 0-1',
            restSeconds: 90,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'tp-4-4',
            exerciseId: 'glu-abduccion-maquina',
            name: 'Abducción de Cadera en Máquina (Glúteo Medio)',
            muscleGroup: 'Glúteos',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '15-20',
            targetRir: 'RIR 0-1',
            restSeconds: 60,
            setMethod: 'dropset',
            supersetGroup: null,
          },
          {
            id: 'tp-4-5',
            exerciseId: 'abd-crunch-polea-alta',
            name: 'Crunch Abdominal en Polea Alta de Rodillas',
            muscleGroup: 'Abdomen / Core',
            equipment: 'Polea',
            targetSets: 3,
            targetReps: '12-15',
            targetRir: 'RIR 1',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: null,
          },
        ],
      },
    ],
  },
  {
    id: 'ppl-3d',
    title: 'Push / Pull / Legs • 3 a 6 Días (Empuje / Tirón / Pierna)',
    goal: 'Hipertrofia & Fuerza',
    description: 'División clásica por patrones de movimiento: Empuje (Pecho/Hombro/Tríceps), Tirón (Espalda/Bíceps) y Pierna.',
    days: [
      {
        id: 'ppl-push',
        name: 'Día 1 • PUSH (Pecho, Hombro y Tríceps)',
        focus: 'Cadena de Empuje',
        exercises: [
          {
            id: 'ppl-1-1',
            exerciseId: 'pec-press-banca-barra',
            name: 'Press de Banca Plano con Barra',
            muscleGroup: 'Pecho',
            equipment: 'Barra',
            targetSets: 4,
            targetReps: '6-8',
            targetRir: 'RIR 1-2',
            restSeconds: 150,
            setMethod: 'top_backoff',
            supersetGroup: null,
          },
          {
            id: 'ppl-1-2',
            exerciseId: 'pec-press-inclinado-mancuernas',
            name: 'Press Inclinado con Mancuernas (30°)',
            muscleGroup: 'Pecho',
            equipment: 'Mancuernas',
            targetSets: 3,
            targetReps: '8-10',
            targetRir: 'RIR 1',
            restSeconds: 120,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'ppl-1-3',
            exerciseId: 'hom-press-militar-smith',
            name: 'Press de Hombros en Multipower (Smith)',
            muscleGroup: 'Hombros',
            equipment: 'Multipower',
            targetSets: 3,
            targetReps: '8-10',
            targetRir: 'RIR 1',
            restSeconds: 120,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'ppl-1-4',
            exerciseId: 'hom-elevaciones-laterales-mancuernas',
            name: 'Elevaciones Laterales con Mancuernas',
            muscleGroup: 'Hombros',
            equipment: 'Mancuernas',
            targetSets: 4,
            targetReps: '12-15',
            targetRir: 'RIR 0-1',
            restSeconds: 60,
            setMethod: 'dropset',
            supersetGroup: null,
          },
          {
            id: 'ppl-1-5',
            exerciseId: 'tri-extension-polea-cuerda',
            name: 'Extensión de Tríceps en Polea Alta con Cuerda',
            muscleGroup: 'Tríceps',
            equipment: 'Polea',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 0-1',
            restSeconds: 75,
            setMethod: 'normal',
            supersetGroup: 'A',
          },
          {
            id: 'ppl-1-6',
            exerciseId: 'tri-extension-tras-nuca-polea',
            name: 'Extensión de Tríceps Tras Nuca en Polea (Overhead / Katana)',
            muscleGroup: 'Tríceps',
            equipment: 'Polea',
            targetSets: 3,
            targetReps: '12-15',
            targetRir: 'RIR 0-1',
            restSeconds: 75,
            setMethod: 'normal',
            supersetGroup: 'A',
          },
        ],
      },
      {
        id: 'ppl-pull',
        name: 'Día 2 • PULL (Espalda, Deltoides Posterior y Bíceps)',
        focus: 'Cadena de Tracción',
        exercises: [
          {
            id: 'ppl-2-1',
            exerciseId: 'esp-jalon-pecho-prono',
            name: 'Jalón al Pecho Agarre Prono Ancho',
            muscleGroup: 'Espalda',
            equipment: 'Polea',
            targetSets: 4,
            targetReps: '8-10',
            targetRir: 'RIR 1',
            restSeconds: 120,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'ppl-2-2',
            exerciseId: 'esp-remo-barra-prono',
            name: 'Remo con Barra Inclinado (Prono / Supino)',
            muscleGroup: 'Espalda',
            equipment: 'Barra',
            targetSets: 4,
            targetReps: '8-10',
            targetRir: 'RIR 1-2',
            restSeconds: 150,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'ppl-2-3',
            exerciseId: 'esp-pullover-polea-cuerda',
            name: 'Pull-Over en Polea Alta con Cuerda o Barra Recta',
            muscleGroup: 'Espalda',
            equipment: 'Polea',
            targetSets: 3,
            targetReps: '12-15',
            targetRir: 'RIR 0-1',
            restSeconds: 75,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'ppl-2-4',
            exerciseId: 'hom-face-pull-polea',
            name: 'Face Pull en Polea Alta con Cuerda',
            muscleGroup: 'Hombros',
            equipment: 'Polea',
            targetSets: 3,
            targetReps: '15-20',
            targetRir: 'RIR 1',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'ppl-2-5',
            exerciseId: 'bic-curl-barra-z',
            name: 'Curl de Bíceps con Barra Z o Recta de Pie',
            muscleGroup: 'Bíceps',
            equipment: 'Barra',
            targetSets: 3,
            targetReps: '8-12',
            targetRir: 'RIR 1',
            restSeconds: 75,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'ppl-2-6',
            exerciseId: 'bic-curl-martillo-mancuernas',
            name: 'Curl Martillo con Mancuernas o Cuerda en Polea',
            muscleGroup: 'Bíceps',
            equipment: 'Mancuernas / Polea',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 0-1',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: null,
          },
        ],
      },
      {
        id: 'ppl-legs',
        name: 'Día 3 • LEGS (Pierna Completa & Glúteos)',
        focus: 'Tren Inferior Completo',
        exercises: [
          {
            id: 'ppl-3-1',
            exerciseId: 'cuad-sentadilla-libre-barra',
            name: 'Sentadilla Libre con Barra (Back Squat)',
            muscleGroup: 'Cuádriceps',
            equipment: 'Barra',
            targetSets: 4,
            targetReps: '6-8',
            targetRir: 'RIR 1-2',
            restSeconds: 180,
            setMethod: 'top_backoff',
            supersetGroup: null,
          },
          {
            id: 'ppl-3-2',
            exerciseId: 'isq-peso-muerto-rumano-barra',
            name: 'Peso Muerto Rumano con Barra (RDL)',
            muscleGroup: 'Isquiosurales',
            equipment: 'Barra',
            targetSets: 4,
            targetReps: '8-10',
            targetRir: 'RIR 1-2',
            restSeconds: 150,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'ppl-3-3',
            exerciseId: 'glu-hip-thrust-barra',
            name: 'Hip Thrust con Barra',
            muscleGroup: 'Glúteos',
            equipment: 'Barra',
            targetSets: 3,
            targetReps: '8-12',
            targetRir: 'RIR 1',
            restSeconds: 120,
            setMethod: 'normal',
            supersetGroup: null,
          },
          {
            id: 'ppl-3-4',
            exerciseId: 'cuad-extension-cuadriceps',
            name: 'Extensión de Cuádriceps en Máquina (Leg Extension)',
            muscleGroup: 'Cuádriceps',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '12-15',
            targetRir: 'RIR 0-1',
            restSeconds: 75,
            setMethod: 'normal',
            supersetGroup: 'A',
          },
          {
            id: 'ppl-3-5',
            exerciseId: 'isq-curl-femoral-tumbado',
            name: 'Curl Femoral Tumbado / Acostado en Máquina',
            muscleGroup: 'Isquiosurales',
            equipment: 'Máquina',
            targetSets: 3,
            targetReps: '10-12',
            targetRir: 'RIR 0-1',
            restSeconds: 75,
            setMethod: 'normal',
            supersetGroup: 'A',
          },
          {
            id: 'ppl-3-6',
            exerciseId: 'pan-elevacion-talones-pie',
            name: 'Elevación de Talones de Pie en Máquina (Gemelos)',
            muscleGroup: 'Pantorrillas',
            equipment: 'Máquina / Smith',
            targetSets: 4,
            targetReps: '12-15',
            targetRir: 'RIR 0-1',
            restSeconds: 60,
            setMethod: 'normal',
            supersetGroup: null,
          },
        ],
      },
    ],
  },
];

/**
 * Ajusta automáticamente series, RIR, descansos y métodos de una rutina según el nivel del paciente
 * (Principiante / Intermedio / Avanzado)
 */
export function autoAdjustRoutineByLevel(
  days: WorkoutDay[],
  level: TrainingLevel
): WorkoutDay[] {
  return days.map((day) => ({
    ...day,
    exercises: day.exercises.map((ex, idx) => {
      const isCompoundFirst = idx < 2;
      if (level === 'beginner') {
        return {
          ...ex,
          targetSets: isCompoundFirst ? 3 : 2,
          targetRir: 'RIR 2',
          setMethod: 'normal',
          restSeconds: isCompoundFirst ? 120 : 90,
        };
      }
      if (level === 'intermediate') {
        return {
          ...ex,
          targetSets: isCompoundFirst ? 4 : 3,
          targetRir: isCompoundFirst ? 'RIR 1-2' : 'RIR 1',
          setMethod: idx === 0 ? 'top_backoff' : 'normal',
          restSeconds: isCompoundFirst ? 120 : 90,
        };
      }
      // advanced
      return {
        ...ex,
        targetSets: isCompoundFirst ? 4 : 3,
        targetRir: isCompoundFirst ? 'RIR 1' : 'RIR 0-1',
        setMethod: idx === 0 ? 'top_backoff' : idx === day.exercises.length - 1 ? 'dropset' : ex.setMethod,
        restSeconds: isCompoundFirst ? 150 : 90,
      };
    }),
  }));
}

export interface MuscleVolumeMetric {
  muscle: MuscleGroup;
  directSets: number;
  synergistSets: number;
  effectiveSets: number; // direct + 0.5 * synergist
  exercisesCount: number;
  frequencyDays: number;
  zone: 'none' | 'maintenance' | 'mev' | 'mav_optimal' | 'mrv_high' | 'excess';
  zoneLabel: string;
  barColor: string;
  badgeColor: string;
  progressPct: number;
}

export interface DayFatigueMetric {
  dayId: string;
  dayName: string;
  totalSets: number;
  totalExercises: number;
  estimatedMinutes: number;
  fatigueScore: number; // 0 to 100
  fatigueLabel: 'Baja / Recuperable' | 'Óptima (Alto Estímulo)' | 'Alta Exigencia' | 'Exceso en Sesión (>22 series)';
  fatigueColor: string;
  alert?: string;
}

export interface WorkoutAnalyticsResult {
  totalWeeklySets: number;
  totalWeeklyExercises: number;
  avgSetsPerDay: number;
  avgDurationMinutes: number;
  pushSets: number;
  pullSets: number;
  quadDominantSets: number;
  hipPosteriorSets: number;
  globalFatigueIndex: number; // 0 to 100
  globalStatusLabel: string;
  muscleVolumes: MuscleVolumeMetric[];
  dayMetrics: DayFatigueMetric[];
  coachAlerts: string[];
}

/**
 * Calcula métricas científicas didácticas de Volumen Semanal Efectivo (MEV / MAV / MRV),
 * Ratio Estímulo-Fatiga (SNC) y Balance Muscular para el Administrador
 */
export function calculateWorkoutAnalytics(days: WorkoutDay[]): WorkoutAnalyticsResult {
  const directMap = new Map<MuscleGroup, number>();
  const synergistMap = new Map<MuscleGroup, number>();
  const exCountMap = new Map<MuscleGroup, number>();
  const freqDaysMap = new Map<MuscleGroup, Set<string>>();

  for (const m of MUSCLE_GROUPS) {
    directMap.set(m, 0);
    synergistMap.set(m, 0);
    exCountMap.set(m, 0);
    freqDaysMap.set(m, new Set());
  }

  let totalWeeklySets = 0;
  let totalWeeklyExercises = 0;
  let totalDurationMinutes = 0;
  let totalFatiguePoints = 0;

  const dayMetrics: DayFatigueMetric[] = days.map((day) => {
    let daySets = 0;
    let dayFatigue = 0;
    let daySeconds = 0;

    for (const ex of day.exercises) {
      const sets = Number(ex.targetSets) || 3;
      daySets += sets;
      totalWeeklySets += sets;
      totalWeeklyExercises += 1;

      directMap.set(ex.muscleGroup, (directMap.get(ex.muscleGroup) || 0) + sets);
      exCountMap.set(ex.muscleGroup, (exCountMap.get(ex.muscleGroup) || 0) + 1);
      freqDaysMap.get(ex.muscleGroup)?.add(day.id);

      // Sinergistas (0.5x series indirectas para presses, remos/jalones y básicos de pierna)
      const lowerName = ex.name.toLowerCase();
      if (ex.muscleGroup === 'Pecho' && lowerName.includes('press')) {
        synergistMap.set('Tríceps', (synergistMap.get('Tríceps') || 0) + sets * 0.5);
        synergistMap.set('Hombros', (synergistMap.get('Hombros') || 0) + sets * 0.5);
      } else if (ex.muscleGroup === 'Espalda' && (lowerName.includes('remo') || lowerName.includes('jalón') || lowerName.includes('dominada'))) {
        synergistMap.set('Bíceps', (synergistMap.get('Bíceps') || 0) + sets * 0.5);
      } else if (ex.muscleGroup === 'Hombros' && lowerName.includes('press')) {
        synergistMap.set('Tríceps', (synergistMap.get('Tríceps') || 0) + sets * 0.5);
      } else if (ex.muscleGroup === 'Cuádriceps' && (lowerName.includes('sentadilla') || lowerName.includes('prensa') || lowerName.includes('zancada') || lowerName.includes('búlgara'))) {
        synergistMap.set('Glúteos', (synergistMap.get('Glúteos') || 0) + sets * 0.5);
      } else if (ex.muscleGroup === 'Isquiosurales' && lowerName.includes('peso muerto')) {
        synergistMap.set('Glúteos', (synergistMap.get('Glúteos') || 0) + sets * 0.5);
      }

      // Costo de fatiga SNC por serie según equipamiento, método e intensidad RIR
      let seriesFatigueFactor = 1.0;
      const eq = ex.equipment.toLowerCase();
      if (eq.includes('barra')) seriesFatigueFactor += 0.45;
      else if (eq.includes('mancuerna') || eq.includes('multipower') || eq.includes('smith')) seriesFatigueFactor += 0.25;
      else if (eq.includes('polea')) seriesFatigueFactor -= 0.1;

      if (ex.targetRir.includes('0')) seriesFatigueFactor += 0.35;
      if (ex.setMethod === 'dropset' || ex.setMethod === 'rest_pause') seriesFatigueFactor += 0.3;
      if (ex.setMethod === 'top_backoff') seriesFatigueFactor += 0.2;

      dayFatigue += sets * seriesFatigueFactor * 3.2;

      // Tiempo estimado: 40s de ejecución + descanso (si es biserie se reduce a la mitad el descanso)
      const rest = Number(ex.restSeconds) || 90;
      const effectiveRest = ex.supersetGroup ? rest * 0.55 : rest;
      daySeconds += sets * (40 + effectiveRest);
    }

    const estMins = Math.max(15, Math.round(daySeconds / 60) + 8); // +8 min calentamiento
    totalDurationMinutes += estMins;

    const normalizedFatigue = Math.min(100, Math.round(dayFatigue));
    totalFatiguePoints += normalizedFatigue;

    let fatigueLabel: DayFatigueMetric['fatigueLabel'] = 'Óptima (Alto Estímulo)';
    let fatigueColor = 'text-[#34d399] bg-[#14352b] border-[#245748]';
    let alert: string | undefined;

    if (daySets > 22) {
      fatigueLabel = 'Exceso en Sesión (>22 series)';
      fatigueColor = 'text-rose-300 bg-rose-950/70 border-rose-500/40';
      alert = `${day.name} tiene ${daySets} series. A partir de ~20-22 series por sesión cae el rendimiento y sube la fatiga central.`;
    } else if (normalizedFatigue >= 78 || daySets >= 19) {
      fatigueLabel = 'Alta Exigencia';
      fatigueColor = 'text-amber-300 bg-amber-950/70 border-amber-500/40';
    } else if (daySets < 10) {
      fatigueLabel = 'Baja / Recuperable';
      fatigueColor = 'text-sky-300 bg-sky-950/70 border-sky-500/40';
    }

    return {
      dayId: day.id,
      dayName: day.name,
      totalSets: daySets,
      totalExercises: day.exercises.length,
      estimatedMinutes: estMins,
      fatigueScore: normalizedFatigue,
      fatigueLabel,
      fatigueColor,
      alert,
    };
  });

  const muscleVolumes: MuscleVolumeMetric[] = MUSCLE_GROUPS.map((muscle) => {
    const directSets = directMap.get(muscle) || 0;
    const synergistSets = Math.round((synergistMap.get(muscle) || 0) * 10) / 10;
    const effectiveSets = Math.round((directSets + synergistSets) * 10) / 10;
    const exercisesCount = exCountMap.get(muscle) || 0;
    const frequencyDays = freqDaysMap.get(muscle)?.size || 0;

    let zone: MuscleVolumeMetric['zone'] = 'none';
    let zoneLabel = 'Sin series directas';
    let barColor = 'bg-slate-600';
    let badgeColor = 'text-slate-400 bg-slate-800/70 border-slate-700';

    if (directSets === 0 && synergistSets > 0) {
      zone = 'maintenance';
      zoneLabel = `Indirecto (${synergistSets} efectivas)`;
      barColor = 'bg-sky-500/60';
      badgeColor = 'text-sky-300 bg-sky-950/60 border-sky-500/30';
    } else if (directSets >= 1 && directSets <= 5) {
      zone = 'maintenance';
      zoneLabel = 'Mantenimiento (1-5 series)';
      barColor = 'bg-sky-400';
      badgeColor = 'text-sky-300 bg-sky-950/70 border-sky-500/40';
    } else if (directSets >= 6 && directSets <= 9) {
      zone = 'mev';
      zoneLabel = 'Volumen Efectivo (MEV • 6-9)';
      barColor = 'bg-teal-400';
      badgeColor = 'text-teal-300 bg-teal-950/70 border-teal-500/40';
    } else if (directSets >= 10 && directSets <= 18) {
      zone = 'mav_optimal';
      zoneLabel = 'Zona Óptima Hipertrofia (MAV • 10-18)';
      barColor = 'bg-[#34d399]';
      badgeColor = 'text-[#34d399] bg-[#14352b] border-[#245748]';
    } else if (directSets >= 19 && directSets <= 22) {
      zone = 'mrv_high';
      zoneLabel = 'Alto / Límite MRV (19-22)';
      barColor = 'bg-amber-400';
      badgeColor = 'text-amber-300 bg-amber-950/70 border-amber-500/40';
    } else if (directSets > 22) {
      zone = 'excess';
      zoneLabel = 'Exceso / Riesgo Fatiga (>22)';
      barColor = 'bg-rose-500';
      badgeColor = 'text-rose-300 bg-rose-950/70 border-rose-500/40';
    }

    const progressPct = Math.min(100, Math.round((directSets / 22) * 100));

    return {
      muscle,
      directSets,
      synergistSets,
      effectiveSets,
      exercisesCount,
      frequencyDays,
      zone,
      zoneLabel,
      barColor,
      badgeColor,
      progressPct,
    };
  });

  const pushSets =
    (directMap.get('Pecho') || 0) +
    (directMap.get('Hombros') || 0) +
    (directMap.get('Tríceps') || 0);
  const pullSets =
    (directMap.get('Espalda') || 0) + (directMap.get('Bíceps') || 0);
  const quadDominantSets = directMap.get('Cuádriceps') || 0;
  const hipPosteriorSets =
    (directMap.get('Isquiosurales') || 0) + (directMap.get('Glúteos') || 0);

  const avgSetsPerDay = days.length > 0 ? Math.round(totalWeeklySets / days.length) : 0;
  const avgDurationMinutes = days.length > 0 ? Math.round(totalDurationMinutes / days.length) : 0;
  const globalFatigueIndex =
    days.length > 0 ? Math.min(100, Math.round(totalFatiguePoints / days.length)) : 0;

  let globalStatusLabel = 'Balance Estímulo / Fatiga Óptimo';
  if (globalFatigueIndex > 80) {
    globalStatusLabel = 'Fatiga SNC Elevada • Vigilar Recuperación';
  } else if (globalFatigueIndex < 40) {
    globalStatusLabel = 'Carga Conservadora • Alta Recuperabilidad';
  }

  const coachAlerts: string[] = [];
  for (const dm of dayMetrics) {
    if (dm.alert) coachAlerts.push(dm.alert);
  }
  for (const mv of muscleVolumes) {
    if (mv.zone === 'excess') {
      coachAlerts.push(
        `⚠️ ${mv.muscle}: ${mv.directSets} series directas semanales superan el máximo recuperable promedio (20-22 series).`
      );
    }
  }
  if (pushSets > 0 && pullSets === 0) {
    coachAlerts.push('⚠️ Hay series de Empuje pero 0 series de Tracción (Espalda/Bíceps).');
  }

  return {
    totalWeeklySets,
    totalWeeklyExercises,
    avgSetsPerDay,
    avgDurationMinutes,
    pushSets,
    pullSets,
    quadDominantSets,
    hipPosteriorSets,
    globalFatigueIndex,
    globalStatusLabel,
    muscleVolumes,
    dayMetrics,
    coachAlerts,
  };
}


