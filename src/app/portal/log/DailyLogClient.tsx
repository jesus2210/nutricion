// LAYER: Interface
// Componente Interactivo de Registro Diario de Ingestas
'use client';

import { useState } from 'react';
import { DailyPortions } from '@/domain/entities/diet-plan';
import { saveDailyLogAction } from './actions';
import { Plus, Minus, Check, Droplets, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyLogClientProps {
  targetPortions: DailyPortions;
  initialLogDate: string;
  initialConsumed?: DailyPortions;
  initialWater?: number;
}

export default function DailyLogClient({
  targetPortions,
  initialLogDate,
  initialConsumed,
  initialWater = 2.5,
}: DailyLogClientProps) {
  const [logDate, setLogDate] = useState(initialLogDate);
  const [consumed, setConsumed] = useState<DailyPortions>(
    initialConsumed || {
      starch: 0,
      protein: 0,
      fat: 0,
      fruit: 0,
      dairy: 0,
    }
  );
  const [waterLiters, setWaterLiters] = useState<number>(initialWater);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleUpdate(key: keyof DailyPortions, delta: number) {
    setConsumed((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await saveDailyLogAction(logDate, consumed, waterLiters, notes);
      if (res?.success) {
        setSaved(true);
        confetti({ particleCount: 50, spread: 60 });
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(res?.error || 'Error al guardar');
      }
    } finally {
      setSaving(false);
    }
  }

  const items = [
    { key: 'starch', label: 'Almidones', target: targetPortions.starch, color: 'text-[#d97706] bg-[#d97706]' },
    { key: 'protein', label: 'Proteínas', target: targetPortions.protein, color: 'text-[#2563eb] bg-[#2563eb]' },
    { key: 'fat', label: 'Grasas', target: targetPortions.fat, color: 'text-[#15803d] bg-[#15803d]' },
    { key: 'fruit', label: 'Frutas', target: targetPortions.fruit, color: 'text-[#dc2626] bg-[#dc2626]' },
    { key: 'dairy', label: 'Lácteos', target: targetPortions.dairy, color: 'text-[#0891b2] bg-[#0891b2]' },
  ];

  return (
    <div className="space-y-6">
      {/* Selector de fecha */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111a1f] p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
          <Calendar className="h-4 w-4 text-[#34d399]" />
          <span>Fecha del registro:</span>
        </div>
        <input
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
        />
      </div>

      {/* Tarjetas de Porciones */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map(({ key, label, target, color }) => {
          const current = consumed[key as keyof DailyPortions];
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;

          return (
            <div key={key} className="rounded-2xl border border-white/10 bg-[#111a1f] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>{label}</span>
                <span className="text-[#94a3b8]">{current} / {target}</span>
              </div>

              {/* Barra de progreso */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full transition-all duration-300 ${color.split(' ')[1]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Controles */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => handleUpdate(key as any, -1)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#162229] text-white hover:bg-[#1e2e38]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-heading text-lg font-extrabold text-white">{current}</span>
                <button
                  onClick={() => handleUpdate(key as any, 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#162229] text-white hover:bg-[#1e2e38]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tracker de Agua y Notas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-5">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="flex items-center gap-1.5">
              <Droplets className="h-4 w-4 text-[#38bdf8]" />
              Agua Consumida
            </span>
            <span className="text-[#38bdf8]">{waterLiters} Litros</span>
          </div>
          <input
            type="range"
            min="0"
            max="6"
            step="0.5"
            value={waterLiters}
            onChange={(e) => setWaterLiters(Number(e.target.value))}
            className="mt-4 w-full accent-[#38bdf8]"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111a1f] p-5">
          <label className="block text-xs font-bold text-white mb-2">Notas del Día</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Comida libre? ¿Entrenamiento intenso?"
            className="w-full rounded-xl border border-white/10 bg-[#162229] px-3.5 py-2 text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-[#14352b] p-3 text-xs font-bold text-[#a7f3d0]">
          <Check className="h-4 w-4 text-[#34d399]" />
          <span>¡Registro diario guardado exitosamente!</span>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] py-3 text-sm font-bold text-white shadow-xl shadow-[#1b4337]/50 transition hover:brightness-110 disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
        {saving ? 'Guardando...' : 'Guardar Registro de Hoy'}
      </button>
    </div>
  );
}
