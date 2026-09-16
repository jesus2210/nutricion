// LAYER: Domain
// Fórmulas de Gasto Energético Basal (BMR) y Gasto Energético Total Diario (TDEE)

import { Gender, ActivityLevel } from '../entities/patient';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,      // Poco o ningún ejercicio / Trabajo de escritorio
  light: 1.375,        // Ejercicio ligero 1-3 días/semana
  moderate: 1.55,      // Ejercicio moderado 3-5 días/semana (pesas + cardio)
  intense: 1.725,      // Ejercicio intenso 6-7 días/semana
  very_intense: 1.9    // Atletas de alto rendimiento / 2 sesiones al día
};

export interface EnergyCalculationParams {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  bodyFatPercentage?: number | null;
}

export interface EnergyExpenditureResult {
  bmrMifflin: number;
  bmrHarrisBenedict: number;
  bmrKatchMcArdle?: number | null;
  bmrCunningham?: number | null;
  selectedBmr: number;
  tdee: number;
  leanBodyMassKg?: number | null;
  targetCaloriesByGoal: {
    aggressiveDeficit: number; // -25%
    moderateDeficit: number;   // -15%
    recomposition: number;     // -5%
    maintenance: number;       // 0%
    cleanSurplus: number;      // +10%
    heavySurplus: number;      // +18%
  };
}

/**
 * Fórmula de Mifflin-St Jeor (Gold standard para población general)
 * Hombres: BMR = (10 × peso en kg) + (6.25 × altura en cm) - (5 × edad) + 5
 * Mujeres: BMR = (10 × peso en kg) + (6.25 × altura en cm) - (5 × edad) - 161
 */
export function calculateBmrMifflin(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? Math.round(base + 5) : Math.round(base - 161);
}

/**
 * Fórmula de Harris-Benedict (Revisada por Roza y Shizgal)
 * Hombres: BMR = 88.362 + (13.397 × peso) + (4.799 × altura) - (5.677 × edad)
 * Mujeres: BMR = 447.593 + (9.247 × peso) + (3.098 × altura) - (4.330 × edad)
 */
export function calculateBmrHarrisBenedict(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  if (gender === 'male') {
    return Math.round(88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age);
  } else {
    return Math.round(447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.330 * age);
  }
}

/**
 * Fórmula de Katch-McArdle (Ideal cuando se conoce el % de grasa corporal)
 * BMR = 370 + (21.6 × LBM en kg)
 */
export function calculateBmrKatchMcArdle(
  weightKg: number,
  bodyFatPercentage: number
): { bmr: number; leanBodyMassKg: number } {
  const leanBodyMassKg = weightKg * (1 - bodyFatPercentage / 100);
  const bmr = Math.round(370 + 21.6 * leanBodyMassKg);
  return { bmr, leanBodyMassKg: Number(leanBodyMassKg.toFixed(2)) };
}

/**
 * Fórmula de Cunningham (Para deportistas con alta masa muscular)
 * BMR = 500 + (22 × LBM en kg)
 */
export function calculateBmrCunningham(leanBodyMassKg: number): number {
  return Math.round(500 + 22 * leanBodyMassKg);
}

/**
 * Calcula el gasto energético completo y los rangos de calorías por objetivo
 */
export function calculateEnergyExpenditure(params: EnergyCalculationParams): EnergyExpenditureResult {
  const { gender, weightKg, heightCm, age, activityLevel, bodyFatPercentage } = params;

  const bmrMifflin = calculateBmrMifflin(gender, weightKg, heightCm, age);
  const bmrHarrisBenedict = calculateBmrHarrisBenedict(gender, weightKg, heightCm, age);

  let bmrKatchMcArdle: number | null = null;
  let bmrCunningham: number | null = null;
  let leanBodyMassKg: number | null = null;

  if (bodyFatPercentage && bodyFatPercentage > 3 && bodyFatPercentage < 60) {
    const katch = calculateBmrKatchMcArdle(weightKg, bodyFatPercentage);
    bmrKatchMcArdle = katch.bmr;
    leanBodyMassKg = katch.leanBodyMassKg;
    bmrCunningham = calculateBmrCunningham(leanBodyMassKg);
  }

  // Si se conoce el % de grasa, Katch-McArdle es más preciso; si no, Mifflin-St Jeor
  const selectedBmr = bmrKatchMcArdle ?? bmrMifflin;
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375;
  const tdee = Math.round(selectedBmr * multiplier);

  return {
    bmrMifflin,
    bmrHarrisBenedict,
    bmrKatchMcArdle,
    bmrCunningham,
    selectedBmr,
    tdee,
    leanBodyMassKg,
    targetCaloriesByGoal: {
      aggressiveDeficit: Math.round(tdee * 0.75),
      moderateDeficit: Math.round(tdee * 0.82),
      recomposition: Math.round(tdee * 0.95),
      maintenance: tdee,
      cleanSurplus: Math.round(tdee * 1.10),
      heavySurplus: Math.round(tdee * 1.18)
    }
  };
}
