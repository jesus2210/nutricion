-- LAYER: Infrastructure
-- ESQUEMA COMPLETO DE BASE DE DATOS POSTGRESQL PARA SUPABASE
-- Plataforma Nutricional NutriEquiv Pro / Contreras Nutrición Fit

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPOS PERSONALIZADOS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'patient');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLA DE PERFILES DE USUARIO (Soporta tanto usuarios con cuenta en auth.users como pacientes registrados sin cuenta por el admin)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    role user_role NOT NULL DEFAULT 'patient',
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Migración en caliente por si la tabla ya existía con restricción estricta a auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- 4. TABLA DE EXPEDIENTE DEL PACIENTE
CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    birth_date DATE NOT NULL,
    height_cm NUMERIC(5,2) NOT NULL,
    initial_weight_kg NUMERIC(5,2) NOT NULL,
    current_weight_kg NUMERIC(5,2),
    target_goal TEXT NOT NULL DEFAULT 'Recomposicion',
    activity_level TEXT NOT NULL DEFAULT 'moderate',
    body_fat_percentage NUMERIC(4,2),
    allergies_or_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user ON public.patient_profiles(user_id);

-- Permitir que un expediente de paciente exista incluso sin user_id vinculado
ALTER TABLE public.patient_profiles ALTER COLUMN user_id DROP NOT NULL;

-- 5. TABLA DE PLANES NUTRICIONALES
CREATE TABLE IF NOT EXISTS public.diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    goal TEXT NOT NULL,
    target_calories NUMERIC(6,1) NOT NULL,
    target_protein_g NUMERIC(5,1) NOT NULL,
    target_fat_g NUMERIC(5,1) NOT NULL,
    target_carbs_g NUMERIC(5,1) NOT NULL,
    portions_json JSONB NOT NULL,     -- { starch: 9, protein: 9, fat: 11, fruit: 2, dairy: 1 }
    meals_config_json JSONB NOT NULL, -- Configuración de comidas
    notes TEXT,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diet_plans_patient ON public.diet_plans(patient_id, is_current);

-- 6. TABLA DE CHECK-INS SEMANALES
CREATE TABLE IF NOT EXISTS public.weekly_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg NUMERIC(5,2) NOT NULL,
    waist_cm NUMERIC(5,2),
    hip_cm NUMERIC(5,2),
    thigh_cm NUMERIC(5,2),
    arm_cm NUMERIC(5,2),
    neck_cm NUMERIC(5,2),
    chest_cm NUMERIC(5,2),
    body_fat_percentage NUMERIC(4,2),
    adherence_score INT CHECK (adherence_score BETWEEN 1 AND 10),
    hunger_level TEXT,
    energy_level TEXT,
    sleep_quality TEXT,
    notes TEXT,
    admin_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_patient_checkin_date UNIQUE (patient_id, checkin_date)
);
CREATE INDEX IF NOT EXISTS idx_checkins_patient_date ON public.weekly_checkins(patient_id, checkin_date DESC);

-- 7. TABLA DE FOTOS DE PROGRESO
CREATE TABLE IF NOT EXISTS public.checkin_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkin_id UUID NOT NULL REFERENCES public.weekly_checkins(id) ON DELETE CASCADE,
    photo_type TEXT NOT NULL CHECK (photo_type IN ('front', 'side', 'back')),
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_photos_checkin ON public.checkin_photos(checkin_id);

-- 8. TABLA DE REGISTRO DIARIO DE INGESTAS (DAILY LOG)
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    portions_consumed JSONB NOT NULL,
    water_liters NUMERIC(3,1),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_patient_log_day UNIQUE (patient_id, log_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_logs_patient ON public.daily_logs(patient_id, log_date DESC);

-- 9. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- 10. POLÍTICAS RLS DE AISLAMIENTO
-- Función auxiliar para verificar si el usuario autenticado es admin (sin recursión)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Profiles:
DROP POLICY IF EXISTS "Admins full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;

CREATE POLICY "Admins full access to profiles" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Allow authenticated read profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin());

-- Patient Profiles:
DROP POLICY IF EXISTS "Admins full access to patient_profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can view own patient_profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can insert own patient_profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can update own patient_profile" ON public.patient_profiles;

CREATE POLICY "Admins full access to patient_profiles" ON public.patient_profiles
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Patients can view own patient_profile" ON public.patient_profiles
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Patients can insert own patient_profile" ON public.patient_profiles
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Patients can update own patient_profile" ON public.patient_profiles
    FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- Trigger automático para crear perfil cuando un usuario se registra en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Crear perfil base
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Paciente'),
    'patient'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email;

  -- 2. Crear expediente de paciente si se enviaron los datos clínicos
  IF (NEW.raw_user_meta_data->>'birth_date') IS NOT NULL THEN
    INSERT INTO public.patient_profiles (
      user_id,
      gender,
      birth_date,
      height_cm,
      initial_weight_kg,
      current_weight_kg,
      target_goal,
      activity_level,
      allergies_or_notes
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'gender', 'female'),
      (NEW.raw_user_meta_data->>'birth_date')::date,
      (NEW.raw_user_meta_data->>'height_cm')::numeric,
      (NEW.raw_user_meta_data->>'initial_weight_kg')::numeric,
      (NEW.raw_user_meta_data->>'initial_weight_kg')::numeric,
      COALESCE(NEW.raw_user_meta_data->>'target_goal', 'Recomposición'),
      COALESCE(NEW.raw_user_meta_data->>'activity_level', 'moderate'),
      NEW.raw_user_meta_data->>'allergies_or_notes'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Diet Plans:
DROP POLICY IF EXISTS "Admins full access to diet_plans" ON public.diet_plans;
DROP POLICY IF EXISTS "Patients can view own diet_plans" ON public.diet_plans;
CREATE POLICY "Admins full access to diet_plans" ON public.diet_plans
    FOR ALL USING (public.is_admin());
CREATE POLICY "Patients can view own diet_plans" ON public.diet_plans
    FOR SELECT USING (
        patient_id IN (SELECT id FROM public.patient_profiles WHERE user_id = auth.uid())
    );

-- Weekly Checkins:
DROP POLICY IF EXISTS "Admins full access to weekly_checkins" ON public.weekly_checkins;
DROP POLICY IF EXISTS "Patients can manage own weekly_checkins" ON public.weekly_checkins;
CREATE POLICY "Admins full access to weekly_checkins" ON public.weekly_checkins
    FOR ALL USING (public.is_admin());
CREATE POLICY "Patients can manage own weekly_checkins" ON public.weekly_checkins
    FOR ALL USING (
        patient_id IN (SELECT id FROM public.patient_profiles WHERE user_id = auth.uid())
    );

-- Checkin Photos:
DROP POLICY IF EXISTS "Admins full access to checkin_photos" ON public.checkin_photos;
DROP POLICY IF EXISTS "Patients can manage own checkin_photos" ON public.checkin_photos;
CREATE POLICY "Admins full access to checkin_photos" ON public.checkin_photos
    FOR ALL USING (public.is_admin());
CREATE POLICY "Patients can manage own checkin_photos" ON public.checkin_photos
    FOR ALL USING (
        checkin_id IN (
            SELECT w.id FROM public.weekly_checkins w
            JOIN public.patient_profiles p ON w.patient_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

-- Daily Logs:
DROP POLICY IF EXISTS "Admins full access to daily_logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Patients can manage own daily_logs" ON public.daily_logs;
CREATE POLICY "Admins full access to daily_logs" ON public.daily_logs
    FOR ALL USING (public.is_admin());
CREATE POLICY "Patients can manage own daily_logs" ON public.daily_logs
    FOR ALL USING (
        patient_id IN (SELECT id FROM public.patient_profiles WHERE user_id = auth.uid())
    );

-- 11. BUCKET DE SUPABASE STORAGE PARA FOTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-photos', 'patient-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
DROP POLICY IF EXISTS "Admins full access to storage" ON storage.objects;
DROP POLICY IF EXISTS "Patients can upload to own storage folder" ON storage.objects;
DROP POLICY IF EXISTS "Patients can read own storage folder" ON storage.objects;

CREATE POLICY "Admins full access to storage" ON storage.objects
    FOR ALL USING (bucket_id = 'patient-photos' AND public.is_admin());

CREATE POLICY "Patients can upload to own storage folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'patient-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Patients can read own storage folder" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'patient-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 12. TABLA DE RUTINAS DE ENTRENAMIENTO ASIGNADAS (WORKOUT PLANS)
CREATE TABLE IF NOT EXISTS public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    goal TEXT NOT NULL DEFAULT 'Hipertrofia & Fuerza',
    days_per_week INT NOT NULL DEFAULT 4,
    days_config_json JSONB NOT NULL, -- Array de WorkoutDay con ejercicios, series, reps, RIR, biseries y notas
    notes TEXT,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workout_plans_patient ON public.workout_plans(patient_id, is_current);

-- 13. TABLA DE REGISTRO DE SESIONES Y CARGAS DE ENTRENAMIENTO (WORKOUT LOGS)
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    day_id TEXT NOT NULL,
    day_name TEXT NOT NULL,
    exercises_logged_json JSONB NOT NULL, -- Array de ejercicios con cada serie (weightKg, reps, rir, completed)
    duration_minutes INT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workout_logs_patient ON public.workout_logs(patient_id, log_date DESC);

-- 14. TABLA DE CATÁLOGO / BIBLIOTECA DE EJERCICIOS EN BASE DE DATOS (EXERCISE CATALOG)
CREATE TABLE IF NOT EXISTS public.exercise_catalog (
    id TEXT PRIMARY KEY DEFAULT ('ex-' || gen_random_uuid()::text),
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    equipment TEXT NOT NULL DEFAULT 'Máquina',
    default_sets INT NOT NULL DEFAULT 3,
    default_reps TEXT NOT NULL DEFAULT '8-12',
    default_rir TEXT NOT NULL DEFAULT 'RIR 1-2',
    default_rest_seconds INT NOT NULL DEFAULT 90,
    tips TEXT,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_muscle ON public.exercise_catalog(muscle_group);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_catalog ENABLE ROW LEVEL SECURITY;

-- Exercise Catalog Policies:
DROP POLICY IF EXISTS "Allow authenticated read exercise_catalog" ON public.exercise_catalog;
DROP POLICY IF EXISTS "Admins full access to exercise_catalog" ON public.exercise_catalog;
CREATE POLICY "Allow authenticated read exercise_catalog" ON public.exercise_catalog
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins full access to exercise_catalog" ON public.exercise_catalog
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Workout Plans Policies:
DROP POLICY IF EXISTS "Admins full access to workout_plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Patients can view own workout_plans" ON public.workout_plans;
CREATE POLICY "Admins full access to workout_plans" ON public.workout_plans
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Patients can view own workout_plans" ON public.workout_plans
    FOR SELECT USING (
        patient_id IN (SELECT id FROM public.patient_profiles WHERE user_id = auth.uid())
    );

-- Workout Logs Policies:
DROP POLICY IF EXISTS "Admins full access to workout_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Patients can manage own workout_logs" ON public.workout_logs;
CREATE POLICY "Admins full access to workout_logs" ON public.workout_logs
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Patients can manage own workout_logs" ON public.workout_logs
    FOR ALL USING (
        patient_id IN (SELECT id FROM public.patient_profiles WHERE user_id = auth.uid())
    ) WITH CHECK (
        patient_id IN (SELECT id FROM public.patient_profiles WHERE user_id = auth.uid())
    );

-- 15. SEED INICIAL DE EJERCICIOS EN PUBLIC.EXERCISE_CATALOG
INSERT INTO public.exercise_catalog (id, name, muscle_group, equipment, default_sets, default_reps, default_rir, default_rest_seconds, tips, is_custom)
VALUES
  -- PECHO
  ('pec-press-banca-barra', 'Press de Banca Plano con Barra', 'Pecho', 'Barra', 4, '6-8', 'RIR 1-2', 150, 'Retracción escapular firme, arco natural y control en la excéntrica.', false),
  ('pec-press-plano-mancuernas', 'Press Plano con Mancuernas', 'Pecho', 'Mancuernas', 3, '8-10', 'RIR 1-2', 120, 'Baja profundo con codos a 45-60° del torso.', false),
  ('pec-press-inclinado-mancuernas', 'Press Inclinado con Mancuernas (30°)', 'Pecho', 'Mancuernas', 4, '8-10', 'RIR 1-2', 120, 'Banco a 30° para enfatizar haz clavicular sin sobrecargar deltoides.', false),
  ('pec-press-inclinado-barra', 'Press Inclinado con Barra', 'Pecho', 'Barra', 3, '6-8', 'RIR 1-2', 150, null, false),
  ('pec-press-inclinado-smith', 'Press Inclinado en Multipower (Smith)', 'Pecho', 'Multipower', 3, '8-10', 'RIR 1', 120, 'Estabilidad máxima para llevar las series cerca del fallo (RIR 0-1).', false),
  ('pec-press-plano-smith', 'Press Plano en Multipower (Smith)', 'Pecho', 'Multipower', 3, '8-10', 'RIR 1', 120, null, false),
  ('pec-press-maquina-convergente', 'Press de Pecho en Máquina Convergente', 'Pecho', 'Máquina', 3, '10-12', 'RIR 0-1', 90, null, false),
  ('pec-press-inclinado-maquina', 'Press Inclinado en Máquina / Discos', 'Pecho', 'Máquina', 3, '8-12', 'RIR 1', 120, null, false),
  ('pec-aperturas-pec-deck', 'Aperturas en Máquina Contractora (Pec Deck)', 'Pecho', 'Máquina', 3, '12-15', 'RIR 0-1', 75, 'Pausa de 1 segundo en máxima contracción.', false),
  ('pec-cruces-polea-alta', 'Cruces en Polea Alta a Baja (Énfasis Inferior)', 'Pecho', 'Polea', 3, '12-15', 'RIR 1', 75, null, false),
  ('pec-cruces-polea-media', 'Cruces en Polea a Altura Media (Sentado o de Pie)', 'Pecho', 'Polea', 3, '10-15', 'RIR 0-1', 75, null, false),
  ('pec-cruces-polea-baja', 'Cruces en Polea Baja a Alta (Énfasis Clavicular)', 'Pecho', 'Polea', 3, '12-15', 'RIR 1', 75, null, false),
  ('pec-aperturas-mancuernas-inclinado', 'Aperturas con Mancuernas en Banco Inclinado', 'Pecho', 'Mancuernas', 3, '10-12', 'RIR 1-2', 90, null, false),
  ('pec-fondos-paralelas', 'Fondos en Paralelas (Inclinado para Pecho)', 'Pecho', 'Peso Corporal / Lastre', 3, '8-12', 'RIR 1-2', 120, null, false),
  ('pec-flexiones-lastradas', 'Flexiones de Pecho (Push-Ups / Lastradas)', 'Pecho', 'Peso Corporal', 3, '12-15', 'RIR 1', 75, null, false),

  -- ESPALDA
  ('esp-dominadas-pronas', 'Dominadas Agarre Prono (Libres o Lastradas)', 'Espalda', 'Peso Corporal / Lastre', 4, '6-10', 'RIR 1-2', 150, null, false),
  ('esp-dominadas-neutras', 'Dominadas Agarre Neutro / Supino', 'Espalda', 'Peso Corporal / Lastre', 3, '8-10', 'RIR 1-2', 120, null, false),
  ('esp-jalon-pecho-prono', 'Jalón al Pecho Agarre Prono Ancho', 'Espalda', 'Polea', 4, '8-12', 'RIR 1-2', 120, 'Lleva los codos hacia las caderas sin columpiar el torso.', false),
  ('esp-jalon-neutro-cerrado', 'Jalón al Pecho Agarre Neutro Estrecho (Triángulo / MAG)', 'Espalda', 'Polea', 3, '10-12', 'RIR 1', 90, null, false),
  ('esp-jalon-supino', 'Jalón al Pecho Agarre Supino', 'Espalda', 'Polea', 3, '8-12', 'RIR 1', 90, null, false),
  ('esp-jalon-unilateral-polea', 'Jalón Unilateral en Polea Alta (Rango Completo)', 'Espalda', 'Polea Unilateral', 3, '10-12', 'RIR 1', 90, 'Enfocado en dorsal ancho; tracciona con el codo pegado al costado.', false),
  ('esp-remo-barra-prono', 'Remo con Barra Inclinado (Prono / Supino)', 'Espalda', 'Barra', 4, '6-10', 'RIR 1-2', 150, null, false),
  ('esp-remo-pendlay', 'Remo Pendlay con Barra', 'Espalda', 'Barra', 3, '6-8', 'RIR 1-2', 150, null, false),
  ('esp-remo-punta-t-pecho', 'Remo en Punta T con Apoyo al Pecho (Chest-Supported)', 'Espalda', 'Máquina', 4, '8-10', 'RIR 1', 120, 'Excelente estabilidad lumbar; enfoca retracción y densidad.', false),
  ('esp-remo-gironda-polea', 'Remo Sentado en Polea Baja (Gironda)', 'Espalda', 'Polea', 3, '10-12', 'RIR 1', 90, null, false),
  ('esp-remo-mancuerna-unilateral', 'Remo Unilateral con Mancuerna (Serrucho)', 'Espalda', 'Mancuernas', 3, '8-12', 'RIR 1', 90, 'Tracciona llevando la mancuerna en curva hacia la cadera.', false),
  ('esp-remo-maquina-hammer', 'Remo en Máquina Convergente (Bilateral o Unilateral)', 'Espalda', 'Máquina', 3, '10-12', 'RIR 0-1', 90, null, false),
  ('esp-remo-pecho-apoyado-mancuernas', 'Remo con Mancuernas Pecho Apoyado en Banco (Seal Row)', 'Espalda', 'Mancuernas', 3, '10-12', 'RIR 1', 90, null, false),
  ('esp-pullover-polea-cuerda', 'Pull-Over en Polea Alta con Cuerda o Barra Recta', 'Espalda', 'Polea', 3, '12-15', 'RIR 0-1', 75, 'Aislamiento puro de dorsal con brazos semirrígidos.', false),
  ('esp-rack-pulls', 'Rack Pulls / Peso Muerto Parcial', 'Espalda', 'Barra', 3, '5-8', 'RIR 2', 180, null, false),

  -- HOMBROS
  ('hom-press-militar-mancuernas', 'Press de Hombros Sentado con Mancuernas', 'Hombros', 'Mancuernas', 4, '8-10', 'RIR 1-2', 120, 'Respaldo a 75-80° y codos ligeramente adelantados en el plano escapular.', false),
  ('hom-press-militar-barra-pie', 'Press Militar de Pie con Barra (OHP)', 'Hombros', 'Barra', 4, '6-8', 'RIR 1-2', 150, null, false),
  ('hom-press-militar-smith', 'Press de Hombros en Multipower (Smith)', 'Hombros', 'Multipower', 3, '8-10', 'RIR 1', 120, null, false),
  ('hom-press-maquina-hombro', 'Press de Hombros en Máquina Convergente', 'Hombros', 'Máquina', 3, '10-12', 'RIR 1', 90, null, false),
  ('hom-elevaciones-laterales-mancuernas', 'Elevaciones Laterales con Mancuernas', 'Hombros', 'Mancuernas', 4, '12-15', 'RIR 0-1', 60, 'Eleva en el plano escapular guiando con los codos, sin impulso lumbar.', false),
  ('hom-elevaciones-laterales-polea', 'Elevaciones Laterales Unilaterales en Polea Baja', 'Hombros', 'Polea Unilateral', 4, '12-15', 'RIR 0-1', 60, 'Polea a la altura de la muñeca/rodilla para máxima tensión en estiramiento.', false),
  ('hom-elevaciones-laterales-maquina', 'Elevaciones Laterales en Máquina', 'Hombros', 'Máquina', 3, '12-15', 'RIR 0', 60, null, false),
  ('hom-pajaros-pecho-apoyado', 'Pájaros / Vuelos Posteriores con Mancuernas', 'Hombros', 'Mancuernas', 3, '12-15', 'RIR 1', 60, null, false),
  ('hom-deltoides-posterior-pec-deck', 'Deltoides Posterior en Máquina (Reverse Pec Deck)', 'Hombros', 'Máquina', 3, '12-15', 'RIR 0-1', 60, null, false),
  ('hom-face-pull-polea', 'Face Pull en Polea Alta con Cuerda', 'Hombros', 'Polea', 3, '15-20', 'RIR 1', 60, null, false),
  ('hom-cruces-posteriores-polea', 'Cruces Inversos en Polea para Deltoides Posterior', 'Hombros', 'Polea', 3, '12-15', 'RIR 1', 60, null, false),
  ('hom-encogimientos-trapecio', 'Encogimientos para Trapecio (Barra o Mancuernas)', 'Hombros', 'Mancuernas / Barra', 3, '10-12', 'RIR 1', 75, null, false),

  -- CUÁDRICEPS
  ('cuad-sentadilla-libre-barra', 'Sentadilla Libre con Barra (Back Squat)', 'Cuádriceps', 'Barra', 4, '6-8', 'RIR 1-2', 180, 'Profundidad controlada manteniendo el abdomen firme (bracing).', false),
  ('cuad-sentadilla-hack', 'Sentadilla Hack en Máquina (Hack Squat)', 'Cuádriceps', 'Máquina', 4, '8-10', 'RIR 1', 150, 'Pies en la parte media-baja de la plataforma para máxima flexión de rodilla.', false),
  ('cuad-sentadilla-pendular', 'Sentadilla Pendular en Máquina', 'Cuádriceps', 'Máquina', 3, '8-10', 'RIR 1', 150, null, false),
  ('cuad-sentadilla-multipower', 'Sentadilla en Multipower (Smith)', 'Cuádriceps', 'Multipower', 4, '8-10', 'RIR 1', 120, null, false),
  ('cuad-prensa-45', 'Prensa de Piernas 45° (Leg Press)', 'Cuádriceps', 'Máquina', 4, '10-12', 'RIR 1', 120, 'Baja profundo sin despegar el sacro ni la zona lumbar del respaldo.', false),
  ('cuad-prensa-unilateral', 'Prensa de Piernas Unilateral', 'Cuádriceps', 'Máquina Unilateral', 3, '10-12', 'RIR 1', 90, null, false),
  ('cuad-sentadilla-bulgara-cuadriceps', 'Sentadilla Búlgara con Mancuernas (Torso Vertical - Cuádriceps)', 'Cuádriceps', 'Mancuernas / Smith', 3, '8-10', 'RIR 1', 120, null, false),
  ('cuad-extension-cuadriceps', 'Extensión de Cuádriceps en Máquina (Leg Extension)', 'Cuádriceps', 'Máquina', 4, '12-15', 'RIR 0-1', 75, 'Aguanta 1 segundo arriba en extensión completa y baja en 2-3 segundos.', false),
  ('cuad-extension-unilateral', 'Extensión de Cuádriceps Unilateral en Máquina', 'Cuádriceps', 'Máquina Unilateral', 3, '12-15', 'RIR 0-1', 60, null, false),
  ('cuad-zancadas-mancuernas', 'Zancadas / Lunges con Mancuernas o Barra', 'Cuádriceps', 'Mancuernas', 3, '10-12 por pierna', 'RIR 1', 90, null, false),
  ('cuad-goblet-squat', 'Sentadilla Goblet con Mancuerna (Talones Elevados)', 'Cuádriceps', 'Mancuernas', 3, '12-15', 'RIR 1', 90, null, false),
  ('cuad-sissy-squat', 'Sentadilla Sissy (Libre o en Banco Sissy)', 'Cuádriceps', 'Peso Corporal / Disco', 3, '12-15', 'RIR 1', 75, null, false),

  -- ISQUIOSURALES
  ('isq-peso-muerto-rumano-barra', 'Peso Muerto Rumano con Barra (RDL)', 'Isquiosurales', 'Barra', 4, '6-8', 'RIR 1-2', 150, 'Bisagra de cadera llevando el glúteo atrás con barra pegada a los muslos.', false),
  ('isq-peso-muerto-rumano-mancuernas', 'Peso Muerto Rumano con Mancuernas', 'Isquiosurales', 'Mancuernas', 3, '8-10', 'RIR 1-2', 120, null, false),
  ('isq-peso-muerto-piernas-semirrigidas', 'Peso Muerto Piernas Semirrígidas (SLDL)', 'Isquiosurales', 'Barra', 3, '8-10', 'RIR 1-2', 150, null, false),
  ('isq-curl-femoral-sentado', 'Curl Femoral Sentado en Máquina', 'Isquiosurales', 'Máquina', 4, '10-12', 'RIR 0-1', 90, 'Máximo estiramiento de isquios gracias a la flexión de cadera.', false),
  ('isq-curl-femoral-tumbado', 'Curl Femoral Tumbado / Acostado en Máquina', 'Isquiosurales', 'Máquina', 4, '10-12', 'RIR 0-1', 90, 'Mantén la pelvis pegada al banco durante toda la serie.', false),
  ('isq-curl-femoral-unilateral', 'Curl Femoral de Pie / Unilateral en Máquina', 'Isquiosurales', 'Máquina Unilateral', 3, '10-12', 'RIR 1', 75, null, false),
  ('isq-buenos-dias-barra', 'Buenos Días con Barra o en Multipower', 'Isquiosurales', 'Barra / Smith', 3, '8-10', 'RIR 2', 120, null, false),
  ('isq-nordic-curl', 'Curl Nórdico (Nordic Hamstring Curl)', 'Isquiosurales', 'Peso Corporal', 3, '6-10', 'RIR 1', 120, null, false),

  -- GLÚTEOS
  ('glu-hip-thrust-barra', 'Hip Thrust con Barra', 'Glúteos', 'Barra', 4, '8-10', 'RIR 1', 150, 'Mirada al frente, retroversión pélvica arriba y pausa de 1-2 seg en bloqueo.', false),
  ('glu-hip-thrust-maquina', 'Hip Thrust en Máquina o Multipower', 'Glúteos', 'Máquina / Smith', 4, '8-12', 'RIR 1', 120, null, false),
  ('glu-kas-glute-bridge', 'KAS Glute Bridge (Rango Corto Enfoque Glúteo)', 'Glúteos', 'Barra / Smith', 3, '10-12', 'RIR 1', 120, null, false),
  ('glu-sentadilla-bulgara-gluteo', 'Sentadilla Búlgara (Torso Inclinado - Énfasis Glúteo)', 'Glúteos', 'Mancuernas / Smith', 3, '8-10', 'RIR 1', 120, 'Inclina el torso unos 30° hacia adelante y lleva la cadera hacia atrás.', false),
  ('glu-step-up-cajon', 'Step-Up (Subida al Cajón) en Polea o Mancuernas', 'Glúteos', 'Polea / Mancuernas', 3, '10-12', 'RIR 1', 90, null, false),
  ('glu-patada-polea-baja', 'Patada de Glúteo en Polea Baja (Extensión y Abducción 30°)', 'Glúteos', 'Polea Unilateral', 3, '12-15', 'RIR 0-1', 60, null, false),
  ('glu-abduccion-maquina', 'Abducción de Cadera en Máquina (Glúteo Medio)', 'Glúteos', 'Máquina', 3, '15-20', 'RIR 0-1', 60, null, false),
  ('glu-hiperextensiones-45', 'Hiperextensiones a 45° con Énfasis en Glúteo', 'Glúteos', 'Banco 45° / Disco', 3, '12-15', 'RIR 1', 75, 'Espalda alta ligeramente redondeada y empuja la pelvis contra el soporte.', false),
  ('glu-peso-muerto-sumo', 'Peso Muerto Sumo con Barra o Mancuerna', 'Glúteos', 'Barra / Mancuerna', 3, '8-10', 'RIR 1-2', 150, null, false),
  ('glu-pull-through-polea', 'Pull-Through en Polea Baja con Cuerda', 'Glúteos', 'Polea', 3, '12-15', 'RIR 1', 75, null, false),

  -- BÍCEPS
  ('bic-curl-barra-z', 'Curl de Bíceps con Barra Z o Recta de Pie', 'Bíceps', 'Barra', 3, '8-12', 'RIR 1', 75, null, false),
  ('bic-curl-alterno-mancuernas', 'Curl de Bíceps con Mancuernas (De Pie o Sentado)', 'Bíceps', 'Mancuernas', 3, '10-12', 'RIR 1', 75, null, false),
  ('bic-curl-inclinado-mancuernas', 'Curl de Bíceps en Banco Inclinado 45° (Cabeza Larga)', 'Bíceps', 'Mancuernas', 3, '10-12', 'RIR 0-1', 75, 'Mantén los codos fijos detrás del torso para estirar la cabeza larga.', false),
  ('bic-curl-bayesian-polea', 'Curl Bayesian en Polea Baja (De Espaldas a la Polea)', 'Bíceps', 'Polea Unilateral', 3, '10-15', 'RIR 0-1', 60, null, false),
  ('bic-curl-predicador-scott', 'Curl Predicador en Banco Scott (Barra Z o Máquina)', 'Bíceps', 'Barra / Máquina', 3, '10-12', 'RIR 1', 75, null, false),
  ('bic-curl-martillo-mancuernas', 'Curl Martillo con Mancuernas o Cuerda en Polea', 'Bíceps', 'Mancuernas / Polea', 3, '10-12', 'RIR 0-1', 75, 'Énfasis en braquial y braquiorradial.', false),
  ('bic-curl-arana', 'Curl Araña (Spider Curl) Pecho Apoyado en Banco', 'Bíceps', 'Mancuernas / Barra Z', 3, '12-15', 'RIR 0-1', 60, null, false),
  ('bic-curl-polea-baja-barra', 'Curl de Bíceps en Polea Baja con Barra', 'Bíceps', 'Polea', 3, '12-15', 'RIR 0-1', 60, null, false),

  -- TRÍCEPS
  ('tri-extension-polea-cuerda', 'Extensión de Tríceps en Polea Alta con Cuerda', 'Tríceps', 'Polea', 3, '10-15', 'RIR 0-1', 75, 'Abre la cuerda al final de la extensión manteniendo los codos fijos.', false),
  ('tri-extension-polea-barra', 'Extensión de Tríceps en Polea Alta con Barra V / Recta', 'Tríceps', 'Polea', 3, '10-12', 'RIR 0-1', 75, null, false),
  ('tri-extension-tras-nuca-polea', 'Extensión de Tríceps Tras Nuca en Polea (Overhead / Katana)', 'Tríceps', 'Polea', 3, '10-15', 'RIR 0-1', 75, 'Estiramiento máximo de la cabeza larga del tríceps.', false),
  ('tri-press-frances-barra-z', 'Press Francés / Rompecráneos con Barra Z o Mancuernas', 'Tríceps', 'Barra Z / Mancuernas', 3, '8-12', 'RIR 1', 90, null, false),
  ('tri-press-cerrado-barra', 'Press de Banca Agarre Cerrado para Tríceps', 'Tríceps', 'Barra / Smith', 3, '8-10', 'RIR 1-2', 120, null, false),
  ('tri-fondos-maquina-triceps', 'Fondos en Máquina o Paralelas (Vertical para Tríceps)', 'Tríceps', 'Máquina / Paralelas', 3, '10-12', 'RIR 1', 90, null, false),
  ('tri-extension-unilateral-polea', 'Extensión Unilateral de Tríceps en Polea (Cruzada)', 'Tríceps', 'Polea Unilateral', 3, '12-15', 'RIR 0-1', 60, null, false),

  -- PANTORRILLAS
  ('pan-elevacion-talones-pie', 'Elevación de Talones de Pie en Máquina (Gemelos)', 'Pantorrillas', 'Máquina / Smith', 4, '10-15', 'RIR 0-1', 60, 'Pausa de 2 segundos abajo en máximo estiramiento y 1 segundo arriba.', false),
  ('pan-elevacion-talones-sentado', 'Elevación de Talones Sentado en Máquina (Sóleo)', 'Pantorrillas', 'Máquina', 4, '12-15', 'RIR 0-1', 60, null, false),
  ('pan-gemelos-prensa', 'Empuje de Gemelos en Prensa de Piernas', 'Pantorrillas', 'Máquina', 4, '12-15', 'RIR 0-1', 60, null, false),

  -- ABDOMEN / CORE
  ('abd-crunch-polea-alta', 'Crunch Abdominal en Polea Alta de Rodillas', 'Abdomen / Core', 'Polea', 3, '12-15', 'RIR 1', 60, 'Flexiona la columna vertebral llevando las costillas hacia la pelvis.', false),
  ('abd-elevacion-piernas-colgado', 'Elevación de Piernas o Rodillas Colgado / Silla Romana', 'Abdomen / Core', 'Peso Corporal', 3, '12-15', 'RIR 1', 60, null, false),
  ('abd-rueda-abdominal', 'Rueda Abdominal (Ab Wheel Rollout)', 'Abdomen / Core', 'Rueda Abdominal', 3, '10-12', 'RIR 1', 60, null, false),
  ('abd-plancha-isometrica', 'Plancha Abdominal Isométrica (RKC Plank)', 'Abdomen / Core', 'Peso Corporal', 3, '45-60 seg', 'RIR 1', 60, null, false),
  ('abd-pallof-press', 'Press Pallof Antirrotación en Polea', 'Abdomen / Core', 'Polea', 3, '12-15 por lado', 'RIR 1', 60, null, false)
ON CONFLICT (id) DO NOTHING;

