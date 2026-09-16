// LAYER: Interface
// Layout Raíz de Next.js con tipografías y metadatos

import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NutriEquiv Pro • Contreras Nutrición Fit',
  description: 'Plataforma clínica de gestión nutricional por equivalencias, cálculo de macros y seguimiento de pacientes.',
  icons: {
    icon: '/logo_contreras_transparent.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${outfit.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen bg-[#0a0f12] text-[#f8fafc] antialiased">
        {children}
      </body>
    </html>
  );
}
