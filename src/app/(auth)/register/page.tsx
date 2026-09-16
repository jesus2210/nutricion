// LAYER: Interface
// Página de Registro de Nuevos Pacientes
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signUpPatientAction } from '../actions';
import { UserPlus, ArrowRight, AlertCircle, MailCheck } from 'lucide-react';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await signUpPatientAction(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.needsEmailConfirmation) {
        setConfirmationEmail(result.email || 'tu correo');
        setLoading(false);
      } else if (result?.redirect) {
        window.location.href = result.redirect;
      }
    } catch (err: any) {
      setError(err?.message || 'Error al registrar la cuenta');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f12] px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#111a1f] p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center">
          <div className="relative mx-auto mb-3 h-14 w-14 overflow-hidden rounded-2xl border border-[#245748] bg-gradient-to-br from-[#1b4337] to-[#0f2720] p-1 shadow-lg shadow-[#1b4337]/40">
            <Image
              src="/logo_contreras_transparent.png"
              alt="Contreras Nutrición Fit"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-white">Registro de Paciente</h1>
          <p className="mt-1 text-xs text-[#94a3b8]">
            Completa tus datos iniciales para generar tu expediente personalizado
          </p>
        </div>

        {confirmationEmail ? (
          <div className="mt-6 rounded-2xl border border-[#2d6a4f]/50 bg-[#162922] p-6 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#2d6a4f]/30 text-[#4ade80]">
              <MailCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-heading text-lg font-bold text-white">¡Revisa tu correo electrónico!</h2>
            <p className="mt-2 text-xs leading-relaxed text-[#cbd5e1]">
              Hemos enviado un enlace de confirmación a <strong className="text-white">{confirmationEmail}</strong>.
            </p>
            <p className="mt-2 text-xs text-[#94a3b8]">
              Haz clic en el enlace del correo para verificar tu cuenta e ingresar a tu plan. (Revisa también tu carpeta de spam si no lo ves).
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2d6a4f] to-[#1b4337] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:brightness-110"
              >
                Ir a Iniciar Sesión
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Cuenta básica */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8]">Nombre Completo</label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="Ej. Génesis Ortiz"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-sm text-white placeholder-[#64748b] transition focus:border-[#2d6a4f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8]">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                required
                placeholder="tu@correo.com"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-sm text-white placeholder-[#64748b] transition focus:border-[#2d6a4f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Contraseña (mínimo 6 caracteres)</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-sm text-white placeholder-[#64748b] transition focus:border-[#2d6a4f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40"
            />
          </div>

          {/* Datos antropométricos */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8]">Sexo Biológico</label>
              <select
                name="gender"
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-sm text-white transition focus:border-[#2d6a4f] focus:outline-none"
              >
                <option value="female">Mujer</option>
                <option value="male">Hombre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8]">F. Nacimiento</label>
              <input
                type="date"
                name="birthDate"
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-2 py-2 text-sm text-white transition focus:border-[#2d6a4f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8]">Altura (cm)</label>
              <input
                type="number"
                name="heightCm"
                step="0.5"
                required
                placeholder="165"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-sm text-white placeholder-[#64748b] transition focus:border-[#2d6a4f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8]">Peso Actual (kg)</label>
              <input
                type="number"
                name="initialWeightKg"
                step="0.1"
                required
                placeholder="55.0"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-sm text-white placeholder-[#64748b] transition focus:border-[#2d6a4f] focus:outline-none"
              />
            </div>
          </div>

          {/* Objetivo y Actividad */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8]">Objetivo Principal</label>
              <select
                name="targetGoal"
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-sm text-white transition focus:border-[#2d6a4f] focus:outline-none"
              >
                <option value="Recomposicion">Recomposición Corporal</option>
                <option value="Deficit">Déficit Calórico / Pérdida de Grasa</option>
                <option value="Superavit">Superávit Limpio / Ganancia Muscular</option>
                <option value="Mantenimiento">Mantenimiento y Salud</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8]">Nivel de Actividad</label>
              <select
                name="activityLevel"
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-sm text-white transition focus:border-[#2d6a4f] focus:outline-none"
              >
                <option value="sedentary">Sedentario (Poco movimiento)</option>
                <option value="light">Ligero (1-3 días ejercicio)</option>
                <option value="moderate">Moderado (3-5 días pesas/cardio)</option>
                <option value="intense">Intenso (6-7 días ejercicio)</option>
                <option value="very_intense">Muy Intenso (Atleta / Doble sesión)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Alergias o Notas Médicas (Opcional)</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Ej. Intolerante a la lactosa, alergia a mariscos..."
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] p-3 text-sm text-white placeholder-[#64748b] transition focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] py-3 text-sm font-bold text-white shadow-lg shadow-[#1b4337]/50 transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? (
              <span>Creando cuenta y expediente...</span>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Registrarme y Comenzar</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-[#94a3b8]">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-bold text-[#34d399] hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </>
    )}
  </div>
</div>
  );
}
