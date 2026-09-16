// LAYER: Interface
// Página de Inicio de Sesión
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signInAction } from '../actions';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await signInAction(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.redirect) {
        window.location.href = result.redirect;
      }
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f12] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111a1f] p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo & Header */}
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-16 w-16 overflow-hidden rounded-2xl border border-[#245748] bg-gradient-to-br from-[#1b4337] to-[#0f2720] p-1 shadow-lg shadow-[#1b4337]/40">
            <Image
              src="/logo_contreras_transparent.png"
              alt="Contreras Nutrición Fit"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-white">Iniciar Sesión</h1>
          <p className="mt-1.5 text-xs text-[#94a3b8]">
            Ingresa a tu panel de control de Contreras Nutrición Fit
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Correo Electrónico</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#64748b]">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                name="email"
                required
                placeholder="tu@correo.com"
                className="w-full rounded-xl border border-white/10 bg-[#162229] py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#64748b] transition focus:border-[#2d6a4f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Contraseña</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#64748b]">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-[#162229] py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#64748b] transition focus:border-[#2d6a4f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] py-3 text-sm font-bold text-white shadow-lg shadow-[#1b4337]/50 transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? (
              <span>Verificando...</span>
            ) : (
              <>
                <span>Ingresar</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#94a3b8]">
          ¿Eres un paciente nuevo?{' '}
          <Link href="/register" className="font-bold text-[#34d399] hover:underline">
            Crear expediente
          </Link>
        </div>
      </div>
    </div>
  );
}
