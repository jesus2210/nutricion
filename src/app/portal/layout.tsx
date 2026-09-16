// LAYER: Interface
// Layout del Portal del Paciente (Aislamiento Total de Datos)

import Link from 'next/link';
import Image from 'next/image';
import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { redirect } from 'next/navigation';
import { signOutAction } from '../(auth)/actions';
import { FileText, Activity, Utensils, TrendingUp, LogOut } from 'lucide-react';

import PortalMobileBottomNav from './PortalMobileBottomNav';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0f12]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#111a1f]/90 px-4 sm:px-6 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#245748] bg-gradient-to-br from-[#1b4337] to-[#0f2720] p-1 shadow-md">
            <Image
              src="/logo_contreras_transparent.png"
              alt="Contreras Nutrición Fit"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <div className="font-heading text-sm font-extrabold text-white">Contreras Fit</div>
            <div className="text-[10px] font-semibold text-[#a7f3d0]">Portal del Paciente</div>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden items-center gap-1.5 sm:flex">
          <Link
            href="/portal/plan"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-[#94a3b8] transition hover:bg-[#162229] hover:text-white"
          >
            <FileText className="h-4 w-4 text-[#34d399]" />
            Mi Plan
          </Link>
          <Link
            href="/portal/checkin"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-[#94a3b8] transition hover:bg-[#162229] hover:text-white"
          >
            <Activity className="h-4 w-4 text-[#38bdf8]" />
            Check-in Semanal
          </Link>
          <Link
            href="/portal/log"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-[#94a3b8] transition hover:bg-[#162229] hover:text-white"
          >
            <Utensils className="h-4 w-4 text-[#fbbf24]" />
            Registro Diario
          </Link>
          <Link
            href="/portal/progress"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-[#94a3b8] transition hover:bg-[#162229] hover:text-white"
          >
            <TrendingUp className="h-4 w-4 text-[#a855f7]" />
            Mi Progreso
          </Link>
        </nav>

        {/* Profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-xs font-bold text-white">{profile?.full_name || 'Paciente'}</div>
            <div className="text-[10px] text-[#64748b]">{profile?.email}</div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs font-semibold text-[#f87171] transition hover:border-red-500/30 hover:bg-red-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content con espacio inferior para el Mobile Bottom Nav */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">{children}</main>

      {/* Barra de Navegación Inferior en Móviles */}
      <PortalMobileBottomNav />
    </div>
  );
}
