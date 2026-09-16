// LAYER: Interface
// Página de Inicio / Redirección Inteligente (Landing & Router)

import Link from 'next/link';
import Image from 'next/image';
import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldCheck, Activity, LineChart, FileText, ChevronRight } from 'lucide-react';

import { AuthHashListener } from '@/components/auth/AuthHashListener';

interface HomePageProps {
  searchParams?: Promise<{ code?: string; error?: string }>;
}

export default async function HomePage(props: HomePageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const supabase = await createServerSupabaseClient();

  if (searchParams?.code) {
    await supabase.auth.exchangeCodeForSession(searchParams.code);
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'admin') {
      redirect('/admin/dashboard');
    } else {
      redirect('/portal/plan');
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0f12]">
      <AuthHashListener />
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#111a1f]/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-[#245748] bg-gradient-to-br from-[#1b4337] to-[#0f2720] p-1 shadow-lg shadow-[#1b4337]/30">
            <Image
              src="/logo_contreras_transparent.png"
              alt="Contreras Nutrición Fit"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-extrabold tracking-tight text-white">
                Contreras Nutrición Fit
              </span>
              <span className="rounded-full bg-[#2d6a4f] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Pro
              </span>
            </div>
            <p className="text-xs text-[#94a3b8]">Sistema de Gestión Nutricional y Equivalencias</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-white/10 bg-[#162229] px-4 py-2 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-[#1e2e38]"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#1b4337]/40 transition hover:brightness-110"
          >
            Registrarme como Paciente
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#245748] bg-[#0f2720]/80 px-4 py-1.5 text-xs font-semibold text-[#a7f3d0] shadow-sm">
          <ShieldCheck className="h-4 w-4 text-[#34d399]" />
          Plataforma Clínica & Portal Privado de Pacientes
        </div>

        <h1 className="max-w-3xl font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Control Nutricional Preciso por <span className="text-[#34d399]">Equivalencias</span> y Resultados Reales
        </h1>

        <p className="mt-6 max-w-2xl text-base text-[#94a3b8] sm:text-lg">
          Accede a tu plan de alimentación personalizado, registra tus medidas semanales con fotos de progreso comprimidas y lleva el control diario de tus porciones.
        </p>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#111a1f]/80 p-6 text-left shadow-lg backdrop-blur-sm transition hover:border-[#2d6a4f]/50">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#245748] bg-[#14352b] text-[#34d399]">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-lg font-bold text-white">Planes en Alta Definición</h2>
            <p className="mt-2 text-sm text-[#94a3b8]">
              Planes estructurados en diapositivas 16:9 con distribución de porciones, reglas de oro y descarga en PDF oficial.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111a1f]/80 p-6 text-left shadow-lg backdrop-blur-sm transition hover:border-[#2d6a4f]/50">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#245748] bg-[#14352b] text-[#34d399]">
              <Activity className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-lg font-bold text-white">Check-in Semanal con Fotos</h2>
            <p className="mt-2 text-sm text-[#94a3b8]">
              Carga tus medidas de cintura, cadera, peso y fotos de progreso optimizadas automáticamente en tu navegador.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111a1f]/80 p-6 text-left shadow-lg backdrop-blur-sm transition hover:border-[#2d6a4f]/50">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#245748] bg-[#14352b] text-[#34d399]">
              <LineChart className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-lg font-bold text-white">Registro Diario de Ingestas</h2>
            <p className="mt-2 text-sm text-[#94a3b8]">
              Monitorea tus porciones consumidas de almidones, proteínas y grasas día a día para asegurar tu adherencia.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-8 py-3.5 font-heading text-base font-bold text-white shadow-xl shadow-[#1b4337]/50 transition hover:scale-[1.02] hover:brightness-110"
          >
            Entrar a mi Cuenta
            <ChevronRight className="h-5 w-5" />
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-white/15 bg-[#162229] px-8 py-3.5 font-heading text-base font-bold text-[#e2e8f0] transition hover:border-white/30 hover:bg-[#1e2e38]"
          >
            Nuevo Paciente
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-[#64748b]">
        © {new Date().getFullYear()} Contreras Nutrición Fit • Todos los derechos reservados.
      </footer>
    </div>
  );
}
