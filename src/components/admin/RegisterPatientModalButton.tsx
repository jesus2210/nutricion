// LAYER: Interface
// Botón y Modal Reutilizable para que el Nutricionista (Admin) registre pacientes directamente sin necesidad de correo ni login
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPatientByAdminAction } from '@/app/admin/calculator/actions';
import { UserPlus, X, Check, Loader2, Ruler, Phone, Mail, ShieldAlert, Sparkles } from 'lucide-react';

interface RegisterPatientModalButtonProps {
  buttonLabel?: string;
  variant?: 'primary' | 'secondary' | 'emerald';
  redirectOnCreate?: boolean;
  onPatientCreated?: (patient: any) => void;
}

export default function RegisterPatientModalButton({
  buttonLabel = 'Registrar Paciente',
  variant = 'emerald',
  redirectOnCreate = false,
  onPatientCreated,
}: RegisterPatientModalButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos básicos
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [age, setAge] = useState<number | ''>(28);
  const [birthDate, setBirthDate] = useState('1998-05-15');
  const [weightKg, setWeightKg] = useState<number | ''>(60);
  const [heightCm, setHeightCm] = useState<number | ''>(165);
  const [targetGoal, setTargetGoal] = useState('Recomposición');
  const [activityLevel, setActivityLevel] = useState('moderate');

  // Campos opcionales (Contacto sin cuenta y medidas iniciales)
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [waistCm, setWaistCm] = useState<number | ''>('');
  const [hipCm, setHipCm] = useState<number | ''>('');
  const [neckCm, setNeckCm] = useState<number | ''>('');
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');

  // Sincronizar Edad -> Fecha de nacimiento aproximada para rapidez en consulta
  function handleAgeChange(val: string) {
    if (val === '') {
      setAge('');
      return;
    }
    const numAge = Number(val);
    setAge(numAge);
    if (numAge > 0 && numAge < 120) {
      const year = new Date().getFullYear() - numAge;
      const monthDay = birthDate.slice(5) || '06-15';
      setBirthDate(`${year}-${monthDay}`);
    }
  }

  function handleBirthDateChange(val: string) {
    setBirthDate(val);
    if (val) {
      const birthYear = new Date(val).getFullYear();
      const diff = new Date().getFullYear() - birthYear;
      if (!isNaN(diff) && diff > 0) setAge(diff);
    }
  }

  function resetForm() {
    setFullName('');
    setPhone('');
    setEmail('');
    setWaistCm('');
    setHipCm('');
    setNeckCm('');
    setAllergies('');
    setNotes('');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Por favor ingresa el nombre del paciente');
      return;
    }
    if (!weightKg || !heightCm) {
      setError('Peso y altura son requeridos para los cálculos antropométricos');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createPatientByAdminAction({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        gender,
        birthDate: birthDate || '1998-06-15',
        heightCm: Number(heightCm),
        initialWeightKg: Number(weightKg),
        targetGoal,
        activityLevel,
        waistCm: waistCm ? Number(waistCm) : undefined,
        hipCm: hipCm ? Number(hipCm) : undefined,
        neckCm: neckCm ? Number(neckCm) : undefined,
        allergies: allergies.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res?.success && res.patient) {
        setIsOpen(false);
        resetForm();
        if (onPatientCreated) {
          onPatientCreated(res.patient);
        }
        router.refresh();
        if (redirectOnCreate) {
          router.push(`/admin/patients/${res.patient.id}`);
        }
      } else {
        setError(res?.error || 'Error al registrar el paciente');
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al registrar paciente');
    } finally {
      setIsSubmitting(false);
    }
  }

  const buttonStyles =
    variant === 'primary'
      ? 'bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] text-white shadow-lg shadow-[#1b4337]/40 hover:brightness-110'
      : variant === 'secondary'
      ? 'border border-white/10 bg-[#162229] text-[#34d399] hover:bg-[#1e2e38]'
      : 'bg-[#34d399] text-[#0d1518] shadow-md shadow-[#34d399]/20 hover:bg-[#34d399]/90';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${buttonStyles}`}
      >
        <UserPlus className="h-4 w-4" />
        {buttonLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#111a1f] p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-[#34d399]" />
                  <h3 className="font-heading text-lg font-extrabold text-white">
                    Registrar Paciente (Sin Cuenta / Directo)
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-[#94a3b8]">
                  Crea el expediente clínico directamente. El paciente <strong>no necesita correo ni iniciar sesión</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-[#94a3b8] hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              {/* 1. Datos Personales & Antropométricos Obligatorios */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#94a3b8]">
                    Nombre Completo del Paciente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Mendoza"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-xs text-white focus:border-[#34d399] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">Sexo *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'female' | 'male')}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="female">Femenino</option>
                    <option value="male">Masculino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">Edad (años) *</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    required
                    placeholder="Ej. 28"
                    value={age}
                    onChange={(e) => handleAgeChange(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:border-[#34d399] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">Peso Actual (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Ej. 68.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:border-[#34d399] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">Altura (cm) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ej. 170"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:border-[#34d399] focus:outline-none"
                  />
                </div>
              </div>

              {/* Objetivo, Nivel de Actividad y Fecha de Nacimiento */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">Objetivo Principal</label>
                  <select
                    value={targetGoal}
                    onChange={(e) => setTargetGoal(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Recomposición">Recomposición Corporal</option>
                    <option value="Déficit">Déficit (Pérdida de Grasa)</option>
                    <option value="Superávit">Superávit (Masa Muscular)</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">Nivel de Actividad</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="sedentary">Sedentario (x1.20)</option>
                    <option value="light">Ligero 1-3 días (x1.375)</option>
                    <option value="moderate">Moderado 3-5 días (x1.55)</option>
                    <option value="intense">Intenso 6-7 días (x1.725)</option>
                    <option value="very_intense">Muy Intenso / Atleta (x1.90)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8]">
                    Fecha Nacimiento (Opcional)
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => handleBirthDateChange(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* 2. Circunferencias Iniciales Opcionales */}
              <div className="rounded-2xl border border-white/5 bg-[#162229]/60 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#38bdf8]">
                    <Ruler className="h-3.5 w-3.5" />
                    Circunferencias Iniciales (Opcional - Calcula % Grasa US Navy automático)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-[#94a3b8]">Cintura (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej. 74"
                      value={waistCm}
                      onChange={(e) => setWaistCm(e.target.value === '' ? '' : Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      className="mt-0.5 w-full rounded-xl border border-white/10 bg-[#111a1f] px-3 py-1.5 text-xs text-white focus:border-[#34d399] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#94a3b8]">Cadera (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej. 96"
                      value={hipCm}
                      onChange={(e) => setHipCm(e.target.value === '' ? '' : Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      className="mt-0.5 w-full rounded-xl border border-white/10 bg-[#111a1f] px-3 py-1.5 text-xs text-white focus:border-[#34d399] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#94a3b8]">Cuello (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej. 35"
                      value={neckCm}
                      onChange={(e) => setNeckCm(e.target.value === '' ? '' : Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      className="mt-0.5 w-full rounded-xl border border-white/10 bg-[#111a1f] px-3 py-1.5 text-xs text-white focus:border-[#34d399] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Contacto y Notas Clínicas (100% Opcionales) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-[#94a3b8]">
                    <Phone className="h-3 w-3 text-[#34d399]" />
                    Teléfono / WhatsApp (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. +58 412 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:border-[#34d399] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-[#94a3b8]">
                    <Mail className="h-3 w-3 text-[#64748b]" />
                    Correo (Opcional - No requiere cuenta)
                  </label>
                  <input
                    type="email"
                    placeholder="Déjalo vacío si no tiene correo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:border-[#34d399] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-[#94a3b8]">
                    <ShieldAlert className="h-3 w-3 text-rose-400" />
                    Alergias o Intolerancias (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Intolerancia a la lactosa, mariscos..."
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:border-[#34d399] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-[#94a3b8]">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    Notas / Observaciones Clínicas (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Consulta presencial, entrena en las mañanas..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-xs text-white focus:border-[#34d399] focus:outline-none"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#94a3b8] hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-5 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creando expediente...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Guardar Expediente del Paciente
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

