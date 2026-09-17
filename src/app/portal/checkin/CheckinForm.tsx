// LAYER: Interface
// Formulario de Check-in Semanal con Compresión de Fotos en el Navegador
'use client';

import { useState } from 'react';
import { compressProgressPhoto, CompressionResult } from '@/components/image-compressor/compressor';
import { Camera, Check, UploadCloud, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckinForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fotos comprimidas en cliente
  const [frontPhoto, setFrontPhoto] = useState<CompressionResult | null>(null);
  const [sidePhoto, setSidePhoto] = useState<CompressionResult | null>(null);
  const [backPhoto, setBackPhoto] = useState<CompressionResult | null>(null);

  async function handleFileSelect(type: 'front' | 'side' | 'back', e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressProgressPhoto(file);
      if (type === 'front') setFrontPhoto(compressed);
      else if (type === 'side') setSidePhoto(compressed);
      else setBackPhoto(compressed);
    } catch (err: any) {
      alert(`Error comprimiendo imagen: ${err.message}`);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Adjuntar fotos comprimidas en lugar de las originales
    if (frontPhoto) formData.set('photo_front', frontPhoto.file);
    if (sidePhoto) formData.set('photo_side', sidePhoto.file);
    if (backPhoto) formData.set('photo_back', backPhoto.file);

    try {
      const response = await fetch('/api/portal/checkin', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || (result && result.error)) {
        const errorText = result?.error || `Error en el servidor (${response.status})`;
        setError(errorText);
      } else {
        setSuccess(true);
        form.reset();
        setFrontPhoto(null);
        setSidePhoto(null);
        setBackPhoto(null);
        if (typeof confetti === 'function') {
          try {
            confetti({ particleCount: 60, spread: 70 });
          } catch {
            // Ignorar si canvas-confetti falla en móvil
          }
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Error de conexión al enviar check-in';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-[#245748] bg-[#14352b] p-4 text-xs font-bold text-[#a7f3d0]">
          <Check className="h-5 w-5 text-[#34d399]" />
          <span>¡Reporte semanal enviado con éxito a tu nutricionista!</span>
        </div>
      )}

      {/* 1. Medidas Corporales */}
      <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-6 shadow-sm">
        <h2 className="font-heading text-base font-bold text-white mb-4">1. Medidas Corporales</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Peso en Ayunas (kg) *</label>
            <input
              type="number"
              step="0.1"
              name="weightKg"
              required
              placeholder="Ej. 55.4"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-sm text-white focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Cintura (cm)</label>
            <input
              type="number"
              step="0.5"
              name="waistCm"
              placeholder="Ej. 68.5"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-sm text-white focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Cadera / Glúteos (cm)</label>
            <input
              type="number"
              step="0.5"
              name="hipCm"
              placeholder="Ej. 96.0"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-sm text-white focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Muslo (cm)</label>
            <input
              type="number"
              step="0.5"
              name="thighCm"
              placeholder="Ej. 52.0"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-sm text-white focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Brazo (cm)</label>
            <input
              type="number"
              step="0.5"
              name="armCm"
              placeholder="Ej. 26.5"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-sm text-white focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Cuello (cm)</label>
            <input
              type="number"
              step="0.5"
              name="neckCm"
              placeholder="Ej. 34.0"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-sm text-white focus:border-[#2d6a4f] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Sensaciones y Adherencia */}
      <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-6 shadow-sm">
        <h2 className="font-heading text-base font-bold text-white mb-4">2. Sensaciones & Adherencia</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Adherencia al Plan (1-10)</label>
            <select
              name="adherenceScore"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-sm text-white focus:outline-none"
              defaultValue="9"
            >
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                <option key={num} value={num}>{num}/10</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Apetito / Hambre</label>
            <select
              name="hungerLevel"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="bajo">Bajo (Saciado/a)</option>
              <option value="medio">Medio (Normal)</option>
              <option value="alto">Alto (Con mucha hambre)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Nivel de Energía</label>
            <select
              name="energyLevel"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="alto">Alto (Entrené excelente)</option>
              <option value="medio">Medio (Normal)</option>
              <option value="bajo">Bajo (Cansado/a)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94a3b8]">Calidad de Sueño</label>
            <select
              name="sleepQuality"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="buena">Buena (Reparador)</option>
              <option value="regular">Regular</option>
              <option value="mala">Mala (Insomnio/Desvelos)</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-[#94a3b8]">Notas o Comentarios para el Nutricionista</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="¿Cómo te sentiste esta semana? ¿Digestión, salidas o comidas libres?"
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#162229] p-3 text-sm text-white placeholder-[#64748b] focus:border-[#2d6a4f] focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Fotos de Progreso con Compresión WebP */}
      <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div>
            <h2 className="font-heading text-base font-bold text-white">3. Fotos de Progreso</h2>
            <p className="text-xs text-[#94a3b8]">
              Tus fotos se comprimen automáticamente en el navegador a formato WebP antes de subirse
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#14352b] px-3 py-1 text-[10px] font-bold text-[#a7f3d0]">
            <Sparkles className="h-3 w-3" />
            Compresión ~95%
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Frente */}
          <div className="rounded-xl border border-white/10 bg-[#162229] p-4 text-center">
            <div className="text-xs font-bold text-white mb-2">Foto de Frente</div>
            {frontPhoto ? (
              <div className="space-y-2">
                <img src={frontPhoto.previewUrl} alt="Frente" className="mx-auto h-40 w-auto rounded-lg object-cover" />
                <div className="text-[10px] text-[#34d399]">
                  {(frontPhoto.compressedSizeBytes / 1024).toFixed(0)} KB (Ahorro {frontPhoto.compressionRatioPct}%)
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 p-6 hover:border-[#34d399]">
                <Camera className="h-6 w-6 text-[#64748b]" />
                <span className="mt-2 text-xs text-[#94a3b8]">Subir foto frontal</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileSelect('front', e)} className="hidden" />
              </label>
            )}
          </div>

          {/* Perfil */}
          <div className="rounded-xl border border-white/10 bg-[#162229] p-4 text-center">
            <div className="text-xs font-bold text-white mb-2">Foto de Perfil</div>
            {sidePhoto ? (
              <div className="space-y-2">
                <img src={sidePhoto.previewUrl} alt="Perfil" className="mx-auto h-40 w-auto rounded-lg object-cover" />
                <div className="text-[10px] text-[#34d399]">
                  {(sidePhoto.compressedSizeBytes / 1024).toFixed(0)} KB (Ahorro {sidePhoto.compressionRatioPct}%)
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 p-6 hover:border-[#34d399]">
                <Camera className="h-6 w-6 text-[#64748b]" />
                <span className="mt-2 text-xs text-[#94a3b8]">Subir foto de perfil</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileSelect('side', e)} className="hidden" />
              </label>
            )}
          </div>

          {/* Espalda */}
          <div className="rounded-xl border border-white/10 bg-[#162229] p-4 text-center">
            <div className="text-xs font-bold text-white mb-2">Foto de Espalda</div>
            {backPhoto ? (
              <div className="space-y-2">
                <img src={backPhoto.previewUrl} alt="Espalda" className="mx-auto h-40 w-auto rounded-lg object-cover" />
                <div className="text-[10px] text-[#34d399]">
                  {(backPhoto.compressedSizeBytes / 1024).toFixed(0)} KB (Ahorro {backPhoto.compressionRatioPct}%)
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 p-6 hover:border-[#34d399]">
                <Camera className="h-6 w-6 text-[#64748b]" />
                <span className="mt-2 text-xs text-[#94a3b8]">Subir foto de espalda</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileSelect('back', e)} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] py-3.5 text-sm font-bold text-white shadow-xl shadow-[#1b4337]/50 transition hover:brightness-110 disabled:opacity-50"
      >
        <UploadCloud className="h-5 w-5" />
        {loading ? 'Subiendo reporte y fotos...' : 'Enviar Reporte Semanal'}
      </button>
    </form>
  );
}
