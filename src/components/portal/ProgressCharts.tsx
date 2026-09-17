// LAYER: Interface
// Gráficas de Evolución de Peso, Medidas Corporales y Adherencia
'use client';

import { useState } from 'react';
import { TrendingUp, Ruler, Activity, ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

interface CheckinData {
  id: string;
  checkin_date: string;
  weight_kg: number;
  waist_cm?: number | null;
  hip_cm?: number | null;
  thigh_cm?: number | null;
  arm_cm?: number | null;
  adherence_score?: number | null;
}

interface ProgressChartsProps {
  checkins: CheckinData[];
  targetGoal?: string;
  initialWeight?: number;
}

export default function ProgressCharts({
  checkins,
  targetGoal,
  initialWeight,
}: ProgressChartsProps) {
  const [activeMetric, setActiveMetric] = useState<'weight' | 'measurements' | 'adherence'>('weight');

  // Ordenar de más antiguo a más reciente para la gráfica cronológica
  const sortedCheckins = [...checkins].sort(
    (a, b) => new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime()
  );

  if (sortedCheckins.length === 0) {
    return null;
  }

  // Cálculos de Peso
  const weights = sortedCheckins.map((c) => Number(c.weight_kg));
  const minWeight = Math.min(...weights, initialWeight || weights[0]);
  const maxWeight = Math.max(...weights, initialWeight || weights[0]);
  const weightRange = maxWeight - minWeight === 0 ? 1 : maxWeight - minWeight;

  const firstWeight = initialWeight || weights[0];
  const lastWeight = weights[weights.length - 1];
  const totalWeightDiff = Number((lastWeight - firstWeight).toFixed(1));

  // Adherencia promedio
  const adherences = sortedCheckins.map((c) => c.adherence_score || 0).filter((v) => v > 0);
  const avgAdherence = adherences.length > 0
    ? (adherences.reduce((acc, curr) => acc + curr, 0) / adherences.length).toFixed(1)
    : 'N/A';

  // Dimensiones SVG
  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;

  // Puntos para curva de peso
  const weightPoints = sortedCheckins.map((c, i) => {
    const x = paddingX + (i / Math.max(sortedCheckins.length - 1, 1)) * plotWidth;
    const y = height - paddingY - ((Number(c.weight_kg) - minWeight) / weightRange) * plotHeight;
    return { x, y, date: c.checkin_date, val: c.weight_kg };
  });

  const weightPath = weightPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const weightArea = weightPoints.length > 1
    ? `${weightPath} L ${weightPoints[weightPoints.length - 1].x} ${height - paddingY} L ${weightPoints[0].x} ${height - paddingY} Z`
    : '';

  // Medidas disponibles
  const hasMeasurements = sortedCheckins.some(
    (c) => c.waist_cm || c.hip_cm || c.thigh_cm || c.arm_cm
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header & Selector de métrica */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#34d399]" />
            <h3 className="font-heading text-base font-bold text-white">
              Análisis Gráfico de Evolución
            </h3>
          </div>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Comportamiento semanal de peso corporal, medidas y consistencia
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-black/40 p-1 border border-white/5">
          <button
            onClick={() => setActiveMetric('weight')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeMetric === 'weight'
                ? 'bg-[#14352b] text-[#34d399] border border-[#245748] shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Peso (kg)
          </button>
          <button
            onClick={() => setActiveMetric('measurements')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeMetric === 'measurements'
                ? 'bg-[#14352b] text-[#34d399] border border-[#245748] shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Medidas (cm)
          </button>
          <button
            onClick={() => setActiveMetric('adherence')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeMetric === 'adherence'
                ? 'bg-[#14352b] text-[#34d399] border border-[#245748] shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Adherencia
          </button>
        </div>
      </div>

      {/* MÉTRICA 1: PESO CORPORAL */}
      {activeMetric === 'weight' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/5 bg-black/20 p-3">
              <div className="text-[10px] uppercase font-bold text-[#64748b]">Peso Inicial</div>
              <div className="text-lg font-extrabold text-white mt-0.5">{firstWeight} kg</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-3">
              <div className="text-[10px] uppercase font-bold text-[#64748b]">Último Registro</div>
              <div className="text-lg font-extrabold text-[#34d399] mt-0.5">{lastWeight} kg</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-3">
              <div className="text-[10px] uppercase font-bold text-[#64748b]">Diferencia Total</div>
              <div className={`text-lg font-extrabold mt-0.5 flex items-center gap-1 ${
                totalWeightDiff < 0 ? 'text-[#38bdf8]' : totalWeightDiff > 0 ? 'text-[#34d399]' : 'text-[#94a3b8]'
              }`}>
                {totalWeightDiff < 0 ? <ArrowDownRight className="h-4 w-4" /> : totalWeightDiff > 0 ? <ArrowUpRight className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                {totalWeightDiff > 0 ? `+${totalWeightDiff}` : totalWeightDiff} kg
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-3">
              <div className="text-[10px] uppercase font-bold text-[#64748b]">Total Reportes</div>
              <div className="text-lg font-extrabold text-white mt-0.5">{sortedCheckins.length} semanas</div>
            </div>
          </div>

          {/* Gráfico SVG de Peso */}
          <div className="w-full overflow-hidden rounded-2xl bg-[#0d1418] p-4 border border-white/5">
            <div className="flex justify-between items-center text-[11px] text-[#64748b] mb-2 px-2">
              <span>Eje Y: Peso (kg)</span>
              <span>Línea de tendencia semanal</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 sm:h-56">
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Guías horizontales */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = height - paddingY - ratio * plotHeight;
                const val = (minWeight + ratio * weightRange).toFixed(1);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="4 4"
                    />
                    <text x={paddingX - 8} y={y + 3} textAnchor="end" fill="#64748b" fontSize="10">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Área y Línea */}
              {weightArea && <path d={weightArea} fill="url(#weightGradient)" />}
              <path
                d={weightPath}
                fill="none"
                stroke="#34d399"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Nodos interactivos */}
              {weightPoints.map((p, idx) => (
                <g key={idx} className="cursor-pointer group">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    fill="#111a1f"
                    stroke="#34d399"
                    strokeWidth="2.5"
                    className="transition-transform group-hover:scale-150"
                  />
                  {/* Tooltip SVG */}
                  <g className="opacity-80 group-hover:opacity-100 transition-opacity">
                    <text
                      x={p.x}
                      y={p.y - 12}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {p.val} kg
                    </text>
                    <text
                      x={p.x}
                      y={height - 10}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="9"
                    >
                      {p.date.slice(5)}
                    </text>
                  </g>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* MÉTRICA 2: MEDIDAS CORPORALES (Cintura, Cadera, Brazo, Muslo) */}
      {activeMetric === 'measurements' && (
        <div className="space-y-4">
          {!hasMeasurements ? (
            <div className="py-10 text-center text-xs text-[#64748b]">
              No hay suficientes registros de medidas en centímetros para trazar la gráfica.
            </div>
          ) : (
            <div>
              {/* Leyenda */}
              <div className="flex flex-wrap items-center gap-4 text-xs mb-3 px-1">
                <span className="flex items-center gap-1.5 text-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#38bdf8]" /> Cintura
                </span>
                <span className="flex items-center gap-1.5 text-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#a855f7]" /> Cadera
                </span>
                <span className="flex items-center gap-1.5 text-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Muslo
                </span>
                <span className="flex items-center gap-1.5 text-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" /> Brazo
                </span>
              </div>

              {/* Gráfica de Barras o Comparación por Check-in */}
              <div className="space-y-3">
                {sortedCheckins.map((c) => (
                  <div key={c.id} className="rounded-xl bg-black/20 p-3.5 border border-white/5">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-bold text-white">{c.checkin_date}</span>
                      <span className="text-[#94a3b8]">{c.weight_kg} kg</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="rounded-lg bg-white/5 p-2 flex items-center justify-between">
                        <span className="text-[#38bdf8]">Cintura:</span>
                        <span className="font-bold text-white">{c.waist_cm ? `${c.waist_cm} cm` : '-'}</span>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2 flex items-center justify-between">
                        <span className="text-[#a855f7]">Cadera:</span>
                        <span className="font-bold text-white">{c.hip_cm ? `${c.hip_cm} cm` : '-'}</span>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2 flex items-center justify-between">
                        <span className="text-[#f59e0b]">Muslo:</span>
                        <span className="font-bold text-white">{c.thigh_cm ? `${c.thigh_cm} cm` : '-'}</span>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2 flex items-center justify-between">
                        <span className="text-[#34d399]">Brazo:</span>
                        <span className="font-bold text-white">{c.arm_cm ? `${c.arm_cm} cm` : '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MÉTRICA 3: ADHERENCIA NUTRICIONAL */}
      {activeMetric === 'adherence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4 border border-white/5">
            <div>
              <div className="text-xs text-[#94a3b8]">Adherencia Promedio del Paciente</div>
              <div className="text-2xl font-extrabold text-[#fbbf24] mt-1">{avgAdherence} / 10</div>
            </div>
            <div className="text-right text-xs text-[#64748b]">
              Basado en auto-evaluaciones semanales del protocolo
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sortedCheckins.map((c) => {
              const score = c.adherence_score || 0;
              const color =
                score >= 8
                  ? 'text-[#34d399] border-[#34d399]/30 bg-[#14352b]/40'
                  : score >= 6
                  ? 'text-[#fbbf24] border-amber-500/30 bg-amber-950/20'
                  : 'text-red-400 border-red-500/30 bg-red-950/20';

              return (
                <div key={c.id} className={`rounded-xl border p-3 ${color}`}>
                  <div className="text-[10px] text-[#94a3b8] font-bold">{c.checkin_date}</div>
                  <div className="text-lg font-black mt-1">{score} / 10</div>
                  <div className="mt-1.5 h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-current rounded-full"
                      style={{ width: `${(score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
