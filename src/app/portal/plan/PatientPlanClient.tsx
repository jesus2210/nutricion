// LAYER: Interface
// Componente de Vista del Plan Nutricional del Paciente (Móvil Interactivo + Diapositivas HD)
'use client';

import { useState } from 'react';
import SlideDeckPreview from '@/components/pdf/SlideDeckPreview';
import { DailyPortions, MealDistribution } from '@/domain/entities/diet-plan';
import { calculateMacros } from '@/domain/formulas/macro-calculator';
import {
  Smartphone,
  Presentation,
  Flame,
  Utensils,
  BookOpen,
  CheckCircle2,
  Droplets,
  Scale,
  Sparkles,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PatientPlanClientProps {
  patientName: string;
  weightKg: number;
  goal: string;
  portions: DailyPortions;
  meals: MealDistribution[];
  planTitle?: string;
}

export default function PatientPlanClient({
  patientName,
  weightKg,
  goal,
  portions,
  meals,
  planTitle = 'Plan de Alimentación • NutriEquiv Pro',
}: PatientPlanClientProps) {
  const [viewMode, setViewMode] = useState<'interactive' | 'slides'>('interactive');
  const [expandedEquiv, setExpandedEquiv] = useState(false);

  const macros = calculateMacros(portions, weightKg);

  const portionCategories = [
    { key: 'starch', label: 'Almidones', count: portions.starch, color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    { key: 'protein', label: 'Proteínas', count: portions.protein, color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    { key: 'fat', label: 'Grasas', count: portions.fat, color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    { key: 'fruit', label: 'Frutas', count: portions.fruit, color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    { key: 'dairy', label: 'Lácteos', count: portions.dairy, color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Selector de Modo de Vista */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">{planTitle}</h1>
          <p className="text-xs text-[#94a3b8]">
            Paciente: <strong className="text-white">{patientName}</strong> ({weightKg} kg) • Objetivo: <span className="text-[#34d399] font-bold">{goal}</span>
          </p>
        </div>

        {/* Botones de Cambio de Vista */}
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#111a1f] p-1.5 shadow-sm">
          <button
            onClick={() => setViewMode('interactive')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              viewMode === 'interactive'
                ? 'border border-[#245748] bg-[#14352b] text-white shadow-md'
                : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
            }`}
          >
            <Smartphone className="h-4 w-4 text-[#34d399]" />
            Vista Interactiva
          </button>

          <button
            onClick={() => setViewMode('slides')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              viewMode === 'slides'
                ? 'border border-[#245748] bg-[#14352b] text-white shadow-md'
                : 'text-[#94a3b8] hover:bg-[#162229] hover:text-white'
            }`}
          >
            <Presentation className="h-4 w-4 text-[#38bdf8]" />
            Diapositivas 16:9
          </button>
        </div>
      </div>

      {viewMode === 'interactive' ? (
        <div className="space-y-6">
          {/* Tarjeta de Calorías y Macronutrientes */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111a1f] to-[#162229] p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#14352b] text-[#34d399] border border-[#245748]">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#94a3b8]">Objetivo Calórico Diario</div>
                  <div className="font-heading text-3xl font-extrabold text-white">
                    {Math.round(macros.totalCalories)}{' '}
                    <span className="text-sm font-normal text-[#94a3b8]">kcal/día</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setViewMode('slides')}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1b4337] to-[#2d6a4f] px-4 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-110"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar PDF (HD)
                </button>
              </div>
            </div>

            {/* Grid de Macros */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Proteína */}
              <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">PROTEÍNA</span>
                  <span className="text-xs font-semibold text-[#94a3b8]">{macros.ratios.proteinPerKg} g/kg</span>
                </div>
                <div className="mt-2 font-heading text-2xl font-extrabold text-white">
                  {macros.totalProtein} <span className="text-xs font-normal text-[#94a3b8]">g</span>
                </div>
                <div className="mt-1 text-[11px] text-[#94a3b8]">
                  ~{Math.round(macros.totalProtein * 4)} kcal ({Math.round(((macros.totalProtein * 4) / macros.totalCalories) * 100)}%)
                </div>
              </div>

              {/* Grasas */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">GRASAS</span>
                  <span className="text-xs font-semibold text-[#94a3b8]">{macros.ratios.fatPerKg} g/kg</span>
                </div>
                <div className="mt-2 font-heading text-2xl font-extrabold text-white">
                  {macros.totalFat} <span className="text-xs font-normal text-[#94a3b8]">g</span>
                </div>
                <div className="mt-1 text-[11px] text-[#94a3b8]">
                  ~{Math.round(macros.totalFat * 9)} kcal ({Math.round(((macros.totalFat * 9) / macros.totalCalories) * 100)}%)
                </div>
              </div>

              {/* Carbohidratos */}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">CARBOHIDRATOS</span>
                  <span className="text-xs font-semibold text-[#94a3b8]">{macros.ratios.carbsPerKg} g/kg</span>
                </div>
                <div className="mt-2 font-heading text-2xl font-extrabold text-white">
                  {macros.totalCarbs} <span className="text-xs font-normal text-[#94a3b8]">g</span>
                </div>
                <div className="mt-1 text-[11px] text-[#94a3b8]">
                  ~{Math.round(macros.totalCarbs * 4)} kcal ({Math.round(((macros.totalCarbs * 4) / macros.totalCalories) * 100)}%)
                </div>
              </div>
            </div>

            {/* Resumen de Porciones del Día */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-3">
                Total de Porciones Asignadas al Día
              </div>
              <div className="flex flex-wrap gap-2">
                {portionCategories.map((c) => (
                  <div key={c.key} className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${c.color}`}>
                    <span>{c.label}:</span>
                    <strong className="font-extrabold text-white">{c.count}</strong>
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80">
                  <span>Vegetales:</span>
                  <strong className="font-bold text-[#34d399]">Libres</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose de Comidas del Día */}
          <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-6 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Utensils className="h-5 w-5 text-[#34d399]" />
              <h2 className="font-heading text-lg font-bold text-white">Distribución de Comidas</h2>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {meals.map((m, idx) => {
                const mp = m.portions;
                return (
                  <div
                    key={m.id || idx}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#162229] p-5 transition hover:border-[#34d399]/40"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-sm font-bold text-white">{m.name}</span>
                        <span className="rounded-full bg-[#14352b] px-2.5 py-0.5 text-[10px] font-bold text-[#34d399]">
                          Comida {idx + 1}
                        </span>
                      </div>

                      {/* Lista de porciones de esta comida */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {mp.starch > 0 && (
                          <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                            {mp.starch} {mp.starch === 1 ? 'Almidón' : 'Almidones'}
                          </span>
                        )}
                        {mp.protein > 0 && (
                          <span className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-300">
                            {mp.protein} {mp.protein === 1 ? 'Proteína' : 'Proteínas'}
                          </span>
                        )}
                        {mp.fat > 0 && (
                          <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
                            {mp.fat} {mp.fat === 1 ? 'Grasa' : 'Grasas'}
                          </span>
                        )}
                        {mp.fruit > 0 && (
                          <span className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-300">
                            {mp.fruit} {mp.fruit === 1 ? 'Fruta' : 'Frutas'}
                          </span>
                        )}
                        {mp.dairy > 0 && (
                          <span className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-300">
                            {mp.dairy} {mp.dairy === 1 ? 'Lácteo' : 'Lácteos'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-white/5 pt-3 text-[11px] text-[#94a3b8] flex items-center justify-between">
                      <span>Vegetales verdes acompañantes:</span>
                      <span className="font-bold text-[#34d399]">A gusto (Libres)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reglas de Oro y Pautas Generales */}
          <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-6 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Sparkles className="h-5 w-5 text-[#f59e0b]" />
              <h2 className="font-heading text-lg font-bold text-white">Reglas de Oro & Recomendaciones</h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs text-[#cbd5e1]">
              <div className="flex items-start gap-3 rounded-2xl bg-[#162229] p-4">
                <Scale className="h-5 w-5 text-[#34d399] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Todos los alimentos se miden cocidos</strong>
                  Pesa tus carnes y almidones cocidos, salvo la avena en hojuelas (pesar cruda).
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-[#162229] p-4">
                <Droplets className="h-5 w-5 text-[#38bdf8] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Hidratación diaria obligatoria</strong>
                  Consume de 35 a 40 ml de agua por kg de peso (aprox. {((weightKg * 38) / 1000).toFixed(1)} litros al día).
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-[#162229] p-4">
                <CheckCircle2 className="h-5 w-5 text-[#a7f3d0] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Vegetales totalmente libres</strong>
                  Puedes incluir lechuga, espinaca, pepino, acelga y tomate sin descontar de tus porciones.
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-[#162229] p-4">
                <Info className="h-5 w-5 text-[#fbbf24] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Flexibilidad de comidas</strong>
                  Puedes juntar la merienda con la cena o redistribuir porciones en el día si mantienes el total.
                </div>
              </div>
            </div>
          </div>

          {/* Guía Rápida de Porciones & Alimentos */}
          <div className="rounded-3xl border border-white/10 bg-[#111a1f] p-6 shadow-xl">
            <button
              onClick={() => setExpandedEquiv(!expandedEquiv)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#38bdf8]" />
                <div>
                  <h2 className="font-heading text-lg font-bold text-white">Guía de Equivalencias de Porciones</h2>
                  <p className="text-xs text-[#94a3b8]">¿A cuánto equivale 1 porción de cada grupo?</p>
                </div>
              </div>
              {expandedEquiv ? (
                <ChevronUp className="h-5 w-5 text-[#94a3b8]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#94a3b8]" />
              )}
            </button>

            {expandedEquiv && (
              <div className="mt-6 border-t border-white/10 pt-5 space-y-4 text-xs">
                {/* Leyenda de frecuencia */}
                <div className="flex flex-wrap items-center gap-2 pb-1">
                  <span className="rounded-md bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                    🟢 CON MAYOR FRECUENCIA
                  </span>
                  <span className="rounded-md bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                    🟡 CON MENOR FRECUENCIA
                  </span>
                  <span className="rounded-md bg-blue-950/80 border border-blue-500/40 px-2.5 py-1 text-[11px] font-bold text-blue-300">
                    🔵 PARA UNTAR / OCASIONAL
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* VEGETALES */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-[#162229] p-4 space-y-2">
                    <div className="font-bold text-emerald-400 flex items-center justify-between">
                      <span>❖ VEGETALES (Libres)</span>
                      <span className="text-[10px] text-emerald-300/80">Sin límite</span>
                    </div>
                    <ul className="space-y-1.5 text-[#cbd5e1]">
                      <li>• <strong>1/2 Taza</strong> de vegetales cocidos.</li>
                      <li>• <strong>1 Taza</strong> de vegetales crudos al gusto (lechuga, tomate, pepino, espinaca, etc.).</li>
                    </ul>
                  </div>

                  {/* LÁCTEOS */}
                  <div className="rounded-2xl border border-cyan-500/30 bg-[#162229] p-4 space-y-2">
                    <div className="font-bold text-cyan-400 flex items-center justify-between">
                      <span>❖ LÁCTEOS</span>
                      <span className="text-[10px] text-cyan-300/80">~17.25g C, 9.5g P, 3g G</span>
                    </div>
                    <ul className="space-y-1.5 text-[#cbd5e1]">
                      <li>• <strong>240ml (1 tz)</strong> Leche descremada.</li>
                      <li>• <strong>240ml (1 tz)</strong> Bebida de soya sin azúcar.</li>
                      <li>• <strong>200ml</strong> Kéfir líquido natural.</li>
                      <li>• <strong>150g</strong> Yogurt descremado o griego sin azúcar.</li>
                    </ul>
                  </div>

                  {/* FRUTAS */}
                  <div className="rounded-2xl border border-rose-500/30 bg-[#162229] p-4 space-y-2">
                    <div className="font-bold text-rose-400 flex items-center justify-between">
                      <span>❖ FRUTAS (1 Fruta = 1 Almidón)</span>
                      <span className="text-[10px] text-rose-300/80">~17.25g C (1.5g P)</span>
                    </div>
                    <ul className="space-y-1.5 text-[#cbd5e1]">
                      <li>• <strong>90g (1/2 und)</strong> Cambur / banana.</li>
                      <li>• <strong>1 und</strong> Manzana, pera, kiwi, naranja o durazno.</li>
                      <li>• <strong>180g (1 tz)</strong> Fresas frescas picadas.</li>
                      <li>• <strong>100g (3/4 tz)</strong> Arándanos o piña picada.</li>
                      <li>• <strong>200g (2 tz)</strong> Papaya, melón o sandía.</li>
                      <li>• <strong>90g</strong> Uvas frescas (12 a 15 und).</li>
                    </ul>
                  </div>

                  {/* PROTEÍNAS */}
                  <div className="rounded-2xl border border-blue-500/30 bg-[#162229] p-4 space-y-2 sm:col-span-2 lg:col-span-1">
                    <div className="font-bold text-blue-400 flex items-center justify-between">
                      <span>❖ PROTEÍNAS (Pesar cocidas)</span>
                      <span className="text-[10px] text-blue-300/80">~8g P (2.5g G)</span>
                    </div>
                    <ul className="space-y-1.5 text-[#cbd5e1]">
                      <li>• <strong>1 und</strong> Huevo entero o <strong>2 claras</strong> (considerar restar 1 porción de grasa por cada 2 huevos enteros).</li>
                      <li>• <strong>30g</strong> Pechuga de pollo o pavo sin piel.</li>
                      <li>• <strong>30g</strong> Pescado blanco, salmón o mariscos.</li>
                      <li>• <strong>30g</strong> Atún en lata (al natural en agua).</li>
                      <li>• <strong>30g</strong> Lomo de cerdo magro o carne de res sin grasa.</li>
                      <li>• <strong>50g (1/4 tz)</strong> Queso cottage descremado.</li>
                      <li>• <strong>30g</strong> Queso blanco llanero (sumar 1 de grasas).</li>
                      <li>• <strong>50g</strong> Queso ricotta (sumar 1 de grasas según tabla).</li>
                      <li>• <strong>40g</strong> Jamón ahumado magro.</li>
                      <li className="pt-1 text-[11px] text-purple-300 font-semibold">• Vegetal: 100g tofu / 15g soja text. (seco) / 35g tempeh.</li>
                      <li className="text-[10px] text-purple-300/80">• De no ser carne magra, sumar 1 porción de grasa por cada 2 porciones de proteína.</li>
                    </ul>
                  </div>

                  {/* ALMIDONES */}
                  <div className="rounded-2xl border border-amber-500/30 bg-[#162229] p-4 space-y-2 sm:col-span-2 lg:col-span-1">
                    <div className="font-bold text-amber-400 flex items-center justify-between">
                      <span>❖ ALMIDONES</span>
                      <span className="text-[10px] text-amber-300/80">~17.25g C (1.5g P, 0.5g G)</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-emerald-400">🟢 MAYOR FRECUENCIA:</div>
                      <ul className="space-y-1 text-[#cbd5e1]">
                        <li>• <strong>40g (1 und peq)</strong> Arepa de maíz.</li>
                        <li>• <strong>20g (2 cdas)</strong> Avena en hojuelas (pesar cruda).</li>
                        <li>• <strong>80g (1/2 tz)</strong> Arroz blanco o integral cocido.</li>
                        <li>• <strong>100g (1 und peq)</strong> Papa cocida u horno.</li>
                        <li>• <strong>65g</strong> Batata u Ocumo / <strong>60g</strong> Yuca o apio.</li>
                        <li>• <strong>70g</strong> Ñame.</li>
                        <li>• <strong>70g (1/2 tz)</strong> Pasta cocida.</li>
                        <li>• <strong>50g (1/4 und)</strong> Plátano verde o maduro.</li>
                        <li>• <strong>30g (1 rebanada)</strong> Pan integral.</li>
                        <li>• <strong>40g (1/4 tz)</strong> Quinoa cocida.</li>
                        <li>• <strong>3 und</strong> Galletas de arroz inflado.</li>
                        <li>• <strong>25g (3 tz)</strong> Cotufas / palomitas sin grasa.</li>
                        <li>• <strong>50g (1/4 tz)</strong> Leguminosas cocidas (caraotas, lentejas, garbanzos).</li>
                      </ul>

                      <div className="text-[11px] font-bold text-amber-400 pt-1">🟡 MENOR FRECUENCIA:</div>
                      <ul className="space-y-1 text-[#94a3b8]">
                        <li>• <strong>20g (1 cda)</strong> Mermelada o miel / <strong>20g</strong> granola.</li>
                        <li>• <strong>25g</strong> Cereal en hojuelas / <strong>30g</strong> galletas maría.</li>
                      </ul>
                    </div>
                  </div>

                  {/* GRASAS */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-[#162229] p-4 space-y-2 sm:col-span-2 lg:col-span-1">
                    <div className="font-bold text-emerald-400 flex items-center justify-between">
                      <span>❖ GRASAS</span>
                      <span className="text-[10px] text-emerald-300/80">~5g G</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-emerald-400">🟢 MAYOR FRECUENCIA:</div>
                      <ul className="space-y-1 text-[#cbd5e1]">
                        <li>• <strong>5g (1 cdta)</strong> Aceite de oliva o aguacate.</li>
                        <li>• <strong>30g (2 cdas)</strong> Aguacate o aceitunas.</li>
                        <li>• <strong>10g (2 cdtas)</strong> Mantequilla de maní o almendras.</li>
                        <li>• <strong>8g</strong> Frutos secos (almendras, nueces, maní).</li>
                        <li>• <strong>10g (1 cda)</strong> Linaza o chía molida.</li>
                        <li>• <strong>240ml (1 tz)</strong> Bebida de almendras sin azúcar.</li>
                      </ul>

                      <div className="text-[11px] font-bold text-blue-400 pt-1">🔵 PARA UNTAR / OCASIONAL:</div>
                      <ul className="space-y-1 text-[#94a3b8]">
                        <li>• <strong>5g</strong> Aceite de maíz / <strong>10g</strong> mayonesa / <strong>2 cdas</strong> coco rallado.</li>
                        <li>• <strong>2 tiras</strong> Tocineta / <strong>5g</strong> mantequilla / <strong>15g</strong> queso amarillo.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Caja de equivalencias clave */}
                <div className="rounded-2xl border border-white/10 bg-[#14352b]/40 p-3 text-xs text-[#a7f3d0] flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">Equivalencias Rápidas:</span>
                  <span><strong>1 Lácteo</strong> = 1 Almidón + 1 Proteína</span>
                  <span>•</span>
                  <span><strong>1 Fruta</strong> = 1 Almidón</span>
                  <span>•</span>
                  <span><strong>1 Scoop Proteína</strong> = 3 Porciones de Proteína</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Vista de Diapositivas 16:9 con contenedor responsive */
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111a1f] p-4">
            <span className="text-xs text-[#94a3b8]">
              Mostrando las 8 diapositivas oficiales en alta definición. Puedes guardarlas o imprimirlas en PDF.
            </span>
            <button
              onClick={() => setViewMode('interactive')}
              className="text-xs font-bold text-[#34d399] hover:underline"
            >
              ← Volver a vista interactiva
            </button>
          </div>

          <div className="w-full overflow-hidden">
            <SlideDeckPreview
              patientName={patientName}
              weightKg={weightKg}
              goal={goal}
              portions={portions}
              meals={meals}
            />
          </div>
        </div>
      )}
    </div>
  );
}
