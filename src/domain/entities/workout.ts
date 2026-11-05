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

/**
 * Biblioteca amplia de +125 ejercicios con variantes de equipo, ángulo y agarre
 */
export const EXERCISE_LIBRARY: ExerciseCatalogItem[] = [
  // ==================== PECHO ====================
  { id: 'pec-press-banca-barra', name: 'Press de Banca Plano con Barra', muscleGroup: 'Pecho', equipment: 'Barra', defaultSets: 4, defaultReps: '6-8', defaultRir: 'RIR 1-2', defaultRestSeconds: 150, tips: 'Retracción escapular firme, arco natural y control en la excéntrica.' },
  { id: 'pec-press-plano-mancuernas', name: 'Press Plano con Mancuernas', muscleGroup: 'Pecho', equipment: 'Mancuernas', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 1-2', defaultRestSeconds: 120, tips: 'Baja profundo con codos a 45-60° del torso.' },
  { id: 'pec-press-inclinado-mancuernas', name: 'Press Inclinado con Mancuernas (30°)', muscleGroup: 'Pecho', equipment: 'Mancuernas', defaultSets: 4, defaultReps: '8-10', defaultRir: 'RIR 1-2', defaultRestSeconds: 120, tips: 'Banco a 30° para enfatizar haz clavicular sin sobrecargar deltoides.' },
  { id: 'pec-press-inclinado-barra', name: 'Press Inclinado con Barra', muscleGroup: 'Pecho', equipment: 'Barra', defaultSets: 3, defaultReps: '6-8', defaultRir: 'RIR 1-2', defaultRestSeconds: 150 },
  { id: 'pec-press-inclinado-smith', name: 'Press Inclinado en Multipower (Smith)', muscleGroup: 'Pecho', equipment: 'Multipower', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 1', defaultRestSeconds: 120, tips: 'Estabilidad máxima para llevar las series cerca del fallo (RIR 0-1).' },
  { id: 'pec-press-plano-smith', name: 'Press Plano en Multipower (Smith)', muscleGroup: 'Pecho', equipment: 'Multipower', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 1', defaultRestSeconds: 120 },
  { id: 'pec-press-maquina-convergente', name: 'Press de Pecho en Máquina Convergente', muscleGroup: 'Pecho', equipment: 'Máquina', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 0-1', defaultRestSeconds: 90 },
  { id: 'pec-press-inclinado-maquina', name: 'Press Inclinado en Máquina / Discos', muscleGroup: 'Pecho', equipment: 'Máquina', defaultSets: 3, defaultReps: '8-12', defaultRir: 'RIR 1', defaultRestSeconds: 120 },
  { id: 'pec-aperturas-pec-deck', name: 'Aperturas en Máquina Contractora (Pec Deck)', muscleGroup: 'Pecho', equipment: 'Máquina', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 75, tips: 'Pausa de 1 segundo en máxima contracción.' },
  { id: 'pec-cruces-polea-alta', name: 'Cruces en Polea Alta a Baja (Énfasis Inferior)', muscleGroup: 'Pecho', equipment: 'Polea', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 1', defaultRestSeconds: 75 },
  { id: 'pec-cruces-polea-media', name: 'Cruces en Polea a Altura Media (Sentado o de Pie)', muscleGroup: 'Pecho', equipment: 'Polea', defaultSets: 3, defaultReps: '10-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 75 },
  { id: 'pec-cruces-polea-baja', name: 'Cruces en Polea Baja a Alta (Énfasis Clavicular)', muscleGroup: 'Pecho', equipment: 'Polea', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 1', defaultRestSeconds: 75 },
  { id: 'pec-aperturas-mancuernas-inclinado', name: 'Aperturas con Mancuernas en Banco Inclinado', muscleGroup: 'Pecho', equipment: 'Mancuernas', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1-2', defaultRestSeconds: 90 },
  { id: 'pec-fondos-paralelas', name: 'Fondos en Paralelas (Inclinado para Pecho)', muscleGroup: 'Pecho', equipment: 'Peso Corporal / Lastre', defaultSets: 3, defaultReps: '8-12', defaultRir: 'RIR 1-2', defaultRestSeconds: 120 },
  { id: 'pec-flexiones-lastradas', name: 'Flexiones de Pecho (Push-Ups / Lastradas)', muscleGroup: 'Pecho', equipment: 'Peso Corporal', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 1', defaultRestSeconds: 75 },

  // ==================== ESPALDA ====================
  { id: 'esp-dominadas-pronas', name: 'Dominadas Agarre Prono (Libres o Lastradas)', muscleGroup: 'Espalda', equipment: 'Peso Corporal / Lastre', defaultSets: 4, defaultReps: '6-10', defaultRir: 'RIR 1-2', defaultRestSeconds: 150 },
  { id: 'esp-dominadas-neutras', name: 'Dominadas Agarre Neutro / Supino', muscleGroup: 'Espalda', equipment: 'Peso Corporal / Lastre', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 1-2', defaultRestSeconds: 120 },
  { id: 'esp-jalon-pecho-prono', name: 'Jalón al Pecho Agarre Prono Ancho', muscleGroup: 'Espalda', equipment: 'Polea', defaultSets: 4, defaultReps: '8-12', defaultRir: 'RIR 1-2', defaultRestSeconds: 120, tips: 'Lleva los codos hacia las caderas sin columpiar el torso.' },
  { id: 'esp-jalon-neutro-cerrado', name: 'Jalón al Pecho Agarre Neutro Estrecho (Triángulo / MAG)', muscleGroup: 'Espalda', equipment: 'Polea', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 90 },
  { id: 'esp-jalon-supino', name: 'Jalón al Pecho Agarre Supino', muscleGroup: 'Espalda', equipment: 'Polea', defaultSets: 3, defaultReps: '8-12', defaultRir: 'RIR 1', defaultRestSeconds: 90 },
  { id: 'esp-jalon-unilateral-polea', name: 'Jalón Unilateral en Polea Alta (Rango Completo)', muscleGroup: 'Espalda', equipment: 'Polea Unilateral', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 90, tips: 'Enfocado en dorsal ancho; tracciona con el codo pegado al costado.' },
  { id: 'esp-remo-barra-prono', name: 'Remo con Barra Inclinado (Prono / Supino)', muscleGroup: 'Espalda', equipment: 'Barra', defaultSets: 4, defaultReps: '6-10', defaultRir: 'RIR 1-2', defaultRestSeconds: 150 },
  { id: 'esp-remo-pendlay', name: 'Remo Pendlay con Barra', muscleGroup: 'Espalda', equipment: 'Barra', defaultSets: 3, defaultReps: '6-8', defaultRir: 'RIR 1-2', defaultRestSeconds: 150 },
  { id: 'esp-remo-punta-t-pecho', name: 'Remo en Punta T con Apoyo al Pecho (Chest-Supported)', muscleGroup: 'Espalda', equipment: 'Máquina', defaultSets: 4, defaultReps: '8-10', defaultRir: 'RIR 1', defaultRestSeconds: 120, tips: 'Excelente estabilidad lumbar; enfoca retracción y densidad.' },
  { id: 'esp-remo-gironda-polea', name: 'Remo Sentado en Polea Baja (Gironda)', muscleGroup: 'Espalda', equipment: 'Polea', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 90 },
  { id: 'esp-remo-mancuerna-unilateral', name: 'Remo Unilateral con Mancuerna (Serrucho)', muscleGroup: 'Espalda', equipment: 'Mancuernas', defaultSets: 3, defaultReps: '8-12', defaultRir: 'RIR 1', defaultRestSeconds: 90, tips: 'Tracciona llevando la mancuerna en curva hacia la cadera.' },
  { id: 'esp-remo-maquina-hammer', name: 'Remo en Máquina Convergente (Bilateral o Unilateral)', muscleGroup: 'Espalda', equipment: 'Máquina', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 0-1', defaultRestSeconds: 90 },
  { id: 'esp-remo-pecho-apoyado-mancuernas', name: 'Remo con Mancuernas Pecho Apoyado en Banco (Seal Row)', muscleGroup: 'Espalda', equipment: 'Mancuernas', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 90 },
  { id: 'esp-pullover-polea-cuerda', name: 'Pull-Over en Polea Alta con Cuerda o Barra Recta', muscleGroup: 'Espalda', equipment: 'Polea', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 75, tips: 'Aislamiento puro de dorsal con brazos semirrígidos.' },
  { id: 'esp-rack-pulls', name: 'Rack Pulls / Peso Muerto Parcial', muscleGroup: 'Espalda', equipment: 'Barra', defaultSets: 3, defaultReps: '5-8', defaultRir: 'RIR 2', defaultRestSeconds: 180 },

  // ==================== HOMBROS ====================
  { id: 'hom-press-militar-mancuernas', name: 'Press de Hombros Sentado con Mancuernas', muscleGroup: 'Hombros', equipment: 'Mancuernas', defaultSets: 4, defaultReps: '8-10', defaultRir: 'RIR 1-2', defaultRestSeconds: 120, tips: 'Respaldo a 75-80° y codos ligeramente adelantados en el plano escapular.' },
  { id: 'hom-press-militar-barra-pie', name: 'Press Militar de Pie con Barra (OHP)', muscleGroup: 'Hombros', equipment: 'Barra', defaultSets: 4, defaultReps: '6-8', defaultRir: 'RIR 1-2', defaultRestSeconds: 150 },
  { id: 'hom-press-militar-smith', name: 'Press de Hombros en Multipower (Smith)', muscleGroup: 'Hombros', equipment: 'Multipower', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 1', defaultRestSeconds: 120 },
  { id: 'hom-press-maquina-hombro', name: 'Press de Hombros en Máquina Convergente', muscleGroup: 'Hombros', equipment: 'Máquina', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 90 },
  { id: 'hom-elevaciones-laterales-mancuernas', name: 'Elevaciones Laterales con Mancuernas', muscleGroup: 'Hombros', equipment: 'Mancuernas', defaultSets: 4, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 60, tips: 'Eleva en el plano escapular guiando con los codos, sin impulso lumbar.' },
  { id: 'hom-elevaciones-laterales-polea', name: 'Elevaciones Laterales Unilaterales en Polea Baja', muscleGroup: 'Hombros', equipment: 'Polea Unilateral', defaultSets: 4, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 60, tips: 'Polea a la altura de la muñeca/rodilla para máxima tensión en estiramiento.' },
  { id: 'hom-elevaciones-laterales-maquina', name: 'Elevaciones Laterales en Máquina', muscleGroup: 'Hombros', equipment: 'Máquina', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 0', defaultRestSeconds: 60 },
  { id: 'hom-pajaros-pecho-apoyado', name: 'Pájaros / Vuelos Posteriores con Mancuernas', muscleGroup: 'Hombros', equipment: 'Mancuernas', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 1', defaultRestSeconds: 60 },
  { id: 'hom-deltoides-posterior-pec-deck', name: 'Deltoides Posterior en Máquina (Reverse Pec Deck)', muscleGroup: 'Hombros', equipment: 'Máquina', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 60 },
  { id: 'hom-face-pull-polea', name: 'Face Pull en Polea Alta con Cuerda', muscleGroup: 'Hombros', equipment: 'Polea', defaultSets: 3, defaultReps: '15-20', defaultRir: 'RIR 1', defaultRestSeconds: 60 },
  { id: 'hom-cruces-posteriores-polea', name: 'Cruces Inversos en Polea para Deltoides Posterior', muscleGroup: 'Hombros', equipment: 'Polea', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 1', defaultRestSeconds: 60 },
  { id: 'hom-encogimientos-trapecio', name: 'Encogimientos para Trapecio (Barra o Mancuernas)', muscleGroup: 'Hombros', equipment: 'Mancuernas / Barra', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 75 },

  // ==================== CUÁDRICEPS ====================
  { id: 'cuad-sentadilla-libre-barra', name: 'Sentadilla Libre con Barra (Back Squat)', muscleGroup: 'Cuádriceps', equipment: 'Barra', defaultSets: 4, defaultReps: '6-8', defaultRir: 'RIR 1-2', defaultRestSeconds: 180, tips: 'Profundidad controlada manteniendo el abdomen firme (bracing).' },
  { id: 'cuad-sentadilla-hack', name: 'Sentadilla Hack en Máquina (Hack Squat)', muscleGroup: 'Cuádriceps', equipment: 'Máquina', defaultSets: 4, defaultReps: '8-10', defaultRir: 'RIR 1', defaultRestSeconds: 150, tips: 'Pies en la parte media-baja de la plataforma para máxima flexión de rodilla.' },
  { id: 'cuad-sentadilla-pendular', name: 'Sentadilla Pendular en Máquina', muscleGroup: 'Cuádriceps', equipment: 'Máquina', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 1', defaultRestSeconds: 150 },
  { id: 'cuad-sentadilla-multipower', name: 'Sentadilla en Multipower (Smith)', muscleGroup: 'Cuádriceps', equipment: 'Multipower', defaultSets: 4, defaultReps: '8-10', defaultRir: 'RIR 1', defaultRestSeconds: 120 },
  { id: 'cuad-prensa-45', name: 'Prensa de Piernas 45° (Leg Press)', muscleGroup: 'Cuádriceps', equipment: 'Máquina', defaultSets: 4, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 120, tips: 'Baja profundo sin despegar el sacro ni la zona lumbar del respaldo.' },
  { id: 'cuad-prensa-unilateral', name: 'Prensa de Piernas Unilateral', muscleGroup: 'Cuádriceps', equipment: 'Máquina Unilateral', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 90 },
  { id: 'cuad-sentadilla-bulgara-cuadriceps', name: 'Sentadilla Búlgara con Mancuernas (Torso Vertical - Cuádriceps)', muscleGroup: 'Cuádriceps', equipment: 'Mancuernas / Smith', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 1', defaultRestSeconds: 120 },
  { id: 'cuad-extension-cuadriceps', name: 'Extensión de Cuádriceps en Máquina (Leg Extension)', muscleGroup: 'Cuádriceps', equipment: 'Máquina', defaultSets: 4, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 75, tips: 'Aguanta 1 segundo arriba en extensión completa y baja en 2-3 segundos.' },
  { id: 'cuad-extension-unilateral', name: 'Extensión de Cuádriceps Unilateral en Máquina', muscleGroup: 'Cuádriceps', equipment: 'Máquina Unilateral', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 60 },
  { id: 'cuad-zancadas-mancuernas', name: 'Zancadas / Lunges con Mancuernas o Barra', muscleGroup: 'Cuádriceps', equipment: 'Mancuernas', defaultSets: 3, defaultReps: '10-12 por pierna', defaultRir: 'RIR 1', defaultRestSeconds: 90 },
  { id: 'cuad-goblet-squat', name: 'Sentadilla Goblet con Mancuerna (Talones Elevados)', muscleGroup: 'Cuádriceps', equipment: 'Mancuernas', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 1', defaultRestSeconds: 90 },
  { id: 'cuad-sissy-squat', name: 'Sentadilla Sissy (Libre o en Banco Sissy)', muscleGroup: 'Cuádriceps', equipment: 'Peso Corporal / Disco', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 1', defaultRestSeconds: 75 },

  // ==================== ISQUIOSURALES ====================
  { id: 'isq-peso-muerto-rumano-barra', name: 'Peso Muerto Rumano con Barra (RDL)', muscleGroup: 'Isquiosurales', equipment: 'Barra', defaultSets: 4, defaultReps: '6-8', defaultRir: 'RIR 1-2', defaultRestSeconds: 150, tips: 'Bisagra de cadera llevando el glúteo atrás con barra pegada a los muslos.' },
  { id: 'isq-peso-muerto-rumano-mancuernas', name: 'Peso Muerto Rumano con Mancuernas', muscleGroup: 'Isquiosurales', equipment: 'Mancuernas', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 1-2', defaultRestSeconds: 120 },
  { id: 'isq-peso-muerto-piernas-semirrigidas', name: 'Peso Muerto Piernas Semirrígidas (SLDL)', muscleGroup: 'Isquiosurales', equipment: 'Barra', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 1-2', defaultRestSeconds: 150 },
  { id: 'isq-curl-femoral-sentado', name: 'Curl Femoral Sentado en Máquina', muscleGroup: 'Isquiosurales', equipment: 'Máquina', defaultSets: 4, defaultReps: '10-12', defaultRir: 'RIR 0-1', defaultRestSeconds: 90, tips: 'Máximo estiramiento de isquios gracias a la flexión de cadera.' },
  { id: 'isq-curl-femoral-tumbado', name: 'Curl Femoral Tumbado / Acostado en Máquina', muscleGroup: 'Isquiosurales', equipment: 'Máquina', defaultSets: 4, defaultReps: '10-12', defaultRir: 'RIR 0-1', defaultRestSeconds: 90, tips: 'Mantén la pelvis pegada al banco durante toda la serie.' },
  { id: 'isq-curl-femoral-unilateral', name: 'Curl Femoral de Pie / Unilateral en Máquina', muscleGroup: 'Isquiosurales', equipment: 'Máquina Unilateral', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 75 },
  { id: 'isq-buenos-dias-barra', name: 'Buenos Días con Barra o en Multipower', muscleGroup: 'Isquiosurales', equipment: 'Barra / Smith', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 2', defaultRestSeconds: 120 },
  { id: 'isq-nordic-curl', name: 'Curl Nórdico (Nordic Hamstring Curl)', muscleGroup: 'Isquiosurales', equipment: 'Peso Corporal', defaultSets: 3, defaultReps: '6-10', defaultRir: 'RIR 1', defaultRestSeconds: 120 },

  // ==================== GLÚTEOS ====================
  { id: 'glu-hip-thrust-barra', name: 'Hip Thrust con Barra', muscleGroup: 'Glúteos', equipment: 'Barra', defaultSets: 4, defaultReps: '8-10', defaultRir: 'RIR 1', defaultRestSeconds: 150, tips: 'Mirada al frente, retroversión pélvica arriba y pausa de 1-2 seg en bloqueo.' },
  { id: 'glu-hip-thrust-maquina', name: 'Hip Thrust en Máquina o Multipower', muscleGroup: 'Glúteos', equipment: 'Máquina / Smith', defaultSets: 4, defaultReps: '8-12', defaultRir: 'RIR 1', defaultRestSeconds: 120 },
  { id: 'glu-kas-glute-bridge', name: 'KAS Glute Bridge (Rango Corto Enfoque Glúteo)', muscleGroup: 'Glúteos', equipment: 'Barra / Smith', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 120 },
  { id: 'glu-sentadilla-bulgara-gluteo', name: 'Sentadilla Búlgara (Torso Inclinado - Énfasis Glúteo)', muscleGroup: 'Glúteos', equipment: 'Mancuernas / Smith', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 1', defaultRestSeconds: 120, tips: 'Inclina el torso unos 30° hacia adelante y lleva la cadera hacia atrás.' },
  { id: 'glu-step-up-cajon', name: 'Step-Up (Subida al Cajón) en Polea o Mancuernas', muscleGroup: 'Glúteos', equipment: 'Polea / Mancuernas', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 90 },
  { id: 'glu-patada-polea-baja', name: 'Patada de Glúteo en Polea Baja (Extensión y Abducción 30°)', muscleGroup: 'Glúteos', equipment: 'Polea Unilateral', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 60 },
  { id: 'glu-abduccion-maquina', name: 'Abducción de Cadera en Máquina (Glúteo Medio)', muscleGroup: 'Glúteos', equipment: 'Máquina', defaultSets: 3, defaultReps: '15-20', defaultRir: 'RIR 0-1', defaultRestSeconds: 60 },
  { id: 'glu-hiperextensiones-45', name: 'Hiperextensiones a 45° con Énfasis en Glúteo', muscleGroup: 'Glúteos', equipment: 'Banco 45° / Disco', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 1', defaultRestSeconds: 75, tips: 'Espalda alta ligeramente redondeada y empuja la pelvis contra el soporte.' },
  { id: 'glu-peso-muerto-sumo', name: 'Peso Muerto Sumo con Barra o Mancuerna', muscleGroup: 'Glúteos', equipment: 'Barra / Mancuerna', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 1-2', defaultRestSeconds: 150 },
  { id: 'glu-pull-through-polea', name: 'Pull-Through en Polea Baja con Cuerda', muscleGroup: 'Glúteos', equipment: 'Polea', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 1', defaultRestSeconds: 75 },

  // ==================== BÍCEPS ====================
  { id: 'bic-curl-barra-z', name: 'Curl de Bíceps con Barra Z o Recta de Pie', muscleGroup: 'Bíceps', equipment: 'Barra', defaultSets: 3, defaultReps: '8-12', defaultRir: 'RIR 1', defaultRestSeconds: 75 },
  { id: 'bic-curl-alterno-mancuernas', name: 'Curl de Bíceps con Mancuernas (De Pie o Sentado)', muscleGroup: 'Bíceps', equipment: 'Mancuernas', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 75 },
  { id: 'bic-curl-inclinado-mancuernas', name: 'Curl de Bíceps en Banco Inclinado 45° (Cabeza Larga)', muscleGroup: 'Bíceps', equipment: 'Mancuernas', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 0-1', defaultRestSeconds: 75, tips: 'Mantén los codos fijos detrás del torso para estirar la cabeza larga.' },
  { id: 'bic-curl-bayesian-polea', name: 'Curl Bayesian en Polea Baja (De Espaldas a la Polea)', muscleGroup: 'Bíceps', equipment: 'Polea Unilateral', defaultSets: 3, defaultReps: '10-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 60 },
  { id: 'bic-curl-predicador-scott', name: 'Curl Predicador en Banco Scott (Barra Z o Máquina)', muscleGroup: 'Bíceps', equipment: 'Barra / Máquina', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 75 },
  { id: 'bic-curl-martillo-mancuernas', name: 'Curl Martillo con Mancuernas o Cuerda en Polea', muscleGroup: 'Bíceps', equipment: 'Mancuernas / Polea', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 0-1', defaultRestSeconds: 75, tips: 'Énfasis en braquial y braquiorradial.' },
  { id: 'bic-curl-arana', name: 'Curl Araña (Spider Curl) Pecho Apoyado en Banco', muscleGroup: 'Bíceps', equipment: 'Mancuernas / Barra Z', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 60 },
  { id: 'bic-curl-polea-baja-barra', name: 'Curl de Bíceps en Polea Baja con Barra', muscleGroup: 'Bíceps', equipment: 'Polea', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 60 },

  // ==================== TRÍCEPS ====================
  { id: 'tri-extension-polea-cuerda', name: 'Extensión de Tríceps en Polea Alta con Cuerda', muscleGroup: 'Tríceps', equipment: 'Polea', defaultSets: 3, defaultReps: '10-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 75, tips: 'Abre la cuerda al final de la extensión manteniendo los codos fijos.' },
  { id: 'tri-extension-polea-barra', name: 'Extensión de Tríceps en Polea Alta con Barra V / Recta', muscleGroup: 'Tríceps', equipment: 'Polea', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 0-1', defaultRestSeconds: 75 },
  { id: 'tri-extension-tras-nuca-polea', name: 'Extensión de Tríceps Tras Nuca en Polea (Overhead / Katana)', muscleGroup: 'Tríceps', equipment: 'Polea', defaultSets: 3, defaultReps: '10-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 75, tips: 'Estiramiento máximo de la cabeza larga del tríceps.' },
  { id: 'tri-press-frances-barra-z', name: 'Press Francés / Rompecráneos con Barra Z o Mancuernas', muscleGroup: 'Tríceps', equipment: 'Barra Z / Mancuernas', defaultSets: 3, defaultReps: '8-12', defaultRir: 'RIR 1', defaultRestSeconds: 90 },
  { id: 'tri-press-cerrado-barra', name: 'Press de Banca Agarre Cerrado para Tríceps', muscleGroup: 'Tríceps', equipment: 'Barra / Smith', defaultSets: 3, defaultReps: '8-10', defaultRir: 'RIR 1-2', defaultRestSeconds: 120 },
  { id: 'tri-fondos-maquina-triceps', name: 'Fondos en Máquina o Paralelas (Vertical para Tríceps)', muscleGroup: 'Tríceps', equipment: 'Máquina / Paralelas', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 90 },
  { id: 'tri-extension-unilateral-polea', name: 'Extensión Unilateral de Tríceps en Polea (Cruzada)', muscleGroup: 'Tríceps', equipment: 'Polea Unilateral', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 60 },

  // ==================== PANTORRILLAS ====================
  { id: 'pan-elevacion-talones-pie', name: 'Elevación de Talones de Pie en Máquina (Gemelos)', muscleGroup: 'Pantorrillas', equipment: 'Máquina / Smith', defaultSets: 4, defaultReps: '10-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 60, tips: 'Pausa de 2 segundos abajo en máximo estiramiento y 1 segundo arriba.' },
  { id: 'pan-elevacion-talones-sentado', name: 'Elevación de Talones Sentado en Máquina (Sóleo)', muscleGroup: 'Pantorrillas', equipment: 'Máquina', defaultSets: 4, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 60 },
  { id: 'pan-gemelos-prensa', name: 'Empuje de Gemelos en Prensa de Piernas', muscleGroup: 'Pantorrillas', equipment: 'Máquina', defaultSets: 4, defaultReps: '12-15', defaultRir: 'RIR 0-1', defaultRestSeconds: 60 },

  // ==================== ABDOMEN / CORE ====================
  { id: 'abd-crunch-polea-alta', name: 'Crunch Abdominal en Polea Alta de Rodillas', muscleGroup: 'Abdomen / Core', equipment: 'Polea', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 1', defaultRestSeconds: 60, tips: 'Flexiona la columna vertebral llevando las costillas hacia la pelvis.' },
  { id: 'abd-elevacion-piernas-colgado', name: 'Elevación de Piernas o Rodillas Colgado / Silla Romana', muscleGroup: 'Abdomen / Core', equipment: 'Peso Corporal', defaultSets: 3, defaultReps: '12-15', defaultRir: 'RIR 1', defaultRestSeconds: 60 },
  { id: 'abd-rueda-abdominal', name: 'Rueda Abdominal (Ab Wheel Rollout)', muscleGroup: 'Abdomen / Core', equipment: 'Rueda Abdominal', defaultSets: 3, defaultReps: '10-12', defaultRir: 'RIR 1', defaultRestSeconds: 60 },
  { id: 'abd-plancha-isometrica', name: 'Plancha Abdominal Isométrica (RKC Plank)', muscleGroup: 'Abdomen / Core', equipment: 'Peso Corporal', defaultSets: 3, defaultReps: '45-60 seg', defaultRir: 'RIR 1', defaultRestSeconds: 60 },
  { id: 'abd-pallof-press', name: 'Press Pallof Antirrotación en Polea', muscleGroup: 'Abdomen / Core', equipment: 'Polea', defaultSets: 3, defaultReps: '12-15 por lado', defaultRir: 'RIR 1', defaultRestSeconds: 60 },
];

export interface WorkoutTemplate {
  id: string;
  title: string;
  goal: string;
  description: string;
  days: WorkoutDay[];
  isCustom?: boolean;
  createdAt?: string;
}

/**
 * Plantillas listas para cargar con 1 clic en el constructor del administrador
 */
export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'torso-pierna-4d',
    title: 'Torso / Pierna • 4 Días (Frecuencia 2)',
    goal: 'Hipertrofia & Recomposición Corporal',
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

