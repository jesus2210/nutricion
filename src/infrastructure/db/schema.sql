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

-- 3. TABLA DE PERFILES DE USUARIO (Vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'patient',
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 4. TABLA DE EXPEDIENTE DEL PACIENTE
CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

CREATE POLICY "Allow authenticated read profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin());

-- Patient Profiles:
DROP POLICY IF EXISTS "Admins full access to patient_profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can view own patient_profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can insert own patient_profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can update own patient_profile" ON public.patient_profiles;

CREATE POLICY "Admins full access to patient_profiles" ON public.patient_profiles
    FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Patients can view own patient_profile" ON public.patient_profiles
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Patients can insert own patient_profile" ON public.patient_profiles
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Patients can update own patient_profile" ON public.patient_profiles
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

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
      (NEW.raw_user_meta_data->>'gender')::gender_type,
      (NEW.raw_user_meta_data->>'birth_date')::date,
      (NEW.raw_user_meta_data->>'height_cm')::numeric,
      (NEW.raw_user_meta_data->>'initial_weight_kg')::numeric,
      (NEW.raw_user_meta_data->>'initial_weight_kg')::numeric,
      (NEW.raw_user_meta_data->>'target_goal')::goal_type,
      (NEW.raw_user_meta_data->>'activity_level')::activity_level_type,
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
CREATE POLICY "Admins full access to diet_plans" ON public.diet_plans
    FOR ALL USING (public.is_admin());
CREATE POLICY "Patients can view own diet_plans" ON public.diet_plans
    FOR SELECT USING (
        patient_id IN (SELECT id FROM public.patient_profiles WHERE user_id = auth.uid())
    );

-- Weekly Checkins:
CREATE POLICY "Admins full access to weekly_checkins" ON public.weekly_checkins
    FOR ALL USING (public.is_admin());
CREATE POLICY "Patients can manage own weekly_checkins" ON public.weekly_checkins
    FOR ALL USING (
        patient_id IN (SELECT id FROM public.patient_profiles WHERE user_id = auth.uid())
    );

-- Checkin Photos:
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
