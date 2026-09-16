// LAYER: Interface
// Barra de Navegación Inferior (Bottom Bar) para el Portal del Paciente en Móviles
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Activity, Utensils, TrendingUp } from 'lucide-react';

export default function PortalMobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/portal/plan', label: 'Mi Plan', icon: FileText, color: 'text-[#34d399]' },
    { href: '/portal/checkin', label: 'Check-in', icon: Activity, color: 'text-[#38bdf8]' },
    { href: '/portal/log', label: 'Diario', icon: Utensils, color: 'text-[#fbbf24]' },
    { href: '/portal/progress', label: 'Progreso', icon: TrendingUp, color: 'text-[#a855f7]' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10 bg-[#111a1f]/95 px-2 py-2 backdrop-blur-lg sm:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition ${
              isActive
                ? 'text-white'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                isActive ? 'bg-[#14352b] border border-[#245748]' : ''
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? item.color : 'text-[#94a3b8]'}`} />
            </div>
            <span className={`text-[10px] ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
