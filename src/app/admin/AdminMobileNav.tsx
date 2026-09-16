// LAYER: Interface
// Barra de Navegación Móvil para el Panel de Administrador
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calculator, LogOut, Menu, X } from 'lucide-react';

export default function AdminMobileNav({
  userName,
  userEmail,
  signOutAction,
}: {
  userName: string;
  userEmail: string;
  signOutAction: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-[#34d399]' },
    { href: '/admin/patients', label: 'Pacientes', icon: Users, color: 'text-[#38bdf8]' },
    { href: '/admin/calculator', label: 'Calculadora & Planes', icon: Calculator, color: 'text-[#fbbf24]' },
  ];

  return (
    <div className="md:hidden border-b border-white/10 bg-[#111a1f] px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Logo & Marca */}
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-[#245748] bg-gradient-to-br from-[#1b4337] to-[#0f2720] p-1 shadow-md">
            <Image
              src="/logo_contreras_transparent.png"
              alt="Contreras Nutrición Fit"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <div className="font-heading text-sm font-extrabold text-white">Contreras Fit</div>
            <div className="text-[10px] font-semibold text-[#a7f3d0]">Panel Admin</div>
          </div>
        </Link>

        {/* Botón Hamburguesa */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#162229] text-white hover:bg-white/10"
          aria-label="Abrir menú"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3 pb-2 animate-in fade-in slide-in-from-top duration-200">
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? 'border border-[#245748] bg-[#14352b] text-white shadow-sm'
                      : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${link.color}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 pt-3 mt-2">
            <div className="mb-2 px-2">
              <div className="text-xs font-bold text-white truncate">{userName}</div>
              <div className="text-[10px] text-[#64748b] truncate">{userEmail}</div>
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
        </div>
      )}
    </div>
  );
}
