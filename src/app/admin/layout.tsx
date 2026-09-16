// LAYER: Interface
// Layout del Panel de Administrador (Nutricionista)

import Link from 'next/link';
import Image from 'next/image';
import { createServerSupabaseClient } from '@/infrastructure/db/supabase/server';
import { redirect } from 'next/navigation';
import { signOutAction } from '../(auth)/actions';
import { LayoutDashboard, Users, Calculator, LogOut } from 'lucide-react';

import AdminMobileNav from './AdminMobileNav';

export default async function AdminLayout({
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
    .select('full_name, email, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    redirect('/portal/plan');
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#0a0f12]">
      {/* Mobile Top Navigation */}
      <AdminMobileNav
        userName={profile.full_name || 'Nutricionista'}
        userEmail={profile.email}
        signOutAction={signOutAction}
      />

      {/* Sidebar Fijo Desktop */}
      <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col justify-between border-r border-white/10 bg-[#111a1f] p-5">
        <div>
          {/* Logo & Marca */}
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#245748] bg-gradient-to-br from-[#1b4337] to-[#0f2720] p-1 shadow-md shadow-[#1b4337]/30">
              <Image
                src="/logo_contreras_transparent.png"
                alt="Contreras Nutrición Fit"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <div className="font-heading text-sm font-extrabold text-white">Contreras Fit</div>
              <div className="text-[11px] font-semibold text-[#a7f3d0]">Panel Administrador</div>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="mt-6 space-y-1.5">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#94a3b8] transition hover:bg-[#162229] hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4 text-[#34d399]" />
              Dashboard
            </Link>

            <Link
              href="/admin/patients"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#94a3b8] transition hover:bg-[#162229] hover:text-white"
            >
              <Users className="h-4 w-4 text-[#38bdf8]" />
              Pacientes
            </Link>

            <Link
              href="/admin/calculator"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#94a3b8] transition hover:bg-[#162229] hover:text-white"
            >
              <Calculator className="h-4 w-4 text-[#fbbf24]" />
              Calculadora & Planes
            </Link>
          </nav>
        </div>

        {/* Perfil & Logout */}
        <div className="border-t border-white/10 pt-4">
          <div className="mb-3 px-2">
            <div className="truncate text-xs font-bold text-white">{profile.full_name || 'Nutricionista'}</div>
            <div className="truncate text-[10px] text-[#64748b]">{profile.email}</div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs font-semibold text-[#f87171] transition hover:border-red-500/30 hover:bg-red-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
