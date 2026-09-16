// LAYER: Domain
// Fórmulas de Composición Corporal y Porcentaje de Grasa (% GC)

import { Gender } from '../entities/patient';

export interface JacksonPollock3Folds {
  chestOrTriceps: number; // Pecho (Hombres) / Tríceps (Mujeres) en mm
  abdomenOrSuprailiac: number; // Abdomen (Hombres) / Suprailiaco (Mujeres) en mm
  thigh: number; // Muslo anterior en mm
}

export interface JacksonPollock7Folds {
  chest: number;        // Pecho en mm
  midaxillary: number;  // Axilar media en mm
  triceps: number;      // Tríceps en mm
  subscapular: number;  // Subescapular en mm
  abdomen: number;      // Abdominal en mm
  suprailiac: number;   // Suprailiaco en mm
  thigh: number;        // Muslo en mm
}

export interface NavyMethodMeasurements {
  gender: Gender;
  heightCm: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number; // Requerido para mujeres
}

export interface BodyCompositionResult {
  bodyFatPercentage: number;
  fatMassKg: number;
  leanMassKg: number;
  category: 'esencial' | 'atleta' | 'fitness' | 'promedio' | 'elevado';
}

/**
 * Jackson-Pollock 3 Pliegues:
 * Hombres (Pecho, Abdomen, Muslo):
 * Densidad = 1.10938 - (0.0008267 × suma) + (0.0000016 × suma²) - (0.0002574 × edad)
 * Mujeres (Tríceps, Suprailiaco, Muslo):
 * Densidad = 1.0994921 - (0.0009929 × suma) + (0.0000023 × suma²) - (0.0001392 × edad)
 */
export function calculateJacksonPollock3(
  gender: Gender,
  age: number,
  weightKg: number,
  folds: JacksonPollock3Folds
): BodyCompositionResult {
  const sum = folds.chestOrTriceps + folds.abdomenOrSuprailiac + folds.thigh;
  let bodyDensity: number;

  if (gender === 'male') {
    bodyDensity = 1.10938 - (0.0008267 * sum) + (0.0000016 * Math.pow(sum, 2)) - (0.0002574 * age);
  } else {
    bodyDensity = 1.0994921 - (0.0009929 * sum) + (0.0000023 * Math.pow(sum, 2)) - (0.0001392 * age);
  }

  // Ecuación de Siri
  const bodyFatPct = Number(((495 / bodyDensity) - 450).toFixed(2));
  return getCompositionMetrics(gender, weightKg, bodyFatPct);
}

/**
 * Jackson-Pollock 7 Pliegues (Máxima precisión plicocutánea):
 */
export function calculateJacksonPollock7(
  gender: Gender,
  age: number,
  weightKg: number,
  folds: JacksonPollock7Folds
): BodyCompositionResult {
  const sum = folds.chest + folds.midaxillary + folds.triceps + folds.subscapular +
              folds.abdomen + folds.suprailiac + folds.thigh;
  let bodyDensity: number;

  if (gender === 'male') {
    bodyDensity = 1.112 - (0.00043499 * sum) + (0.00000055 * Math.pow(sum, 2)) - (0.00028826 * age);
  } else {
    bodyDensity = 1.097 - (0.00046971 * sum) + (0.00000056 * Math.pow(sum, 2)) - (0.00012828 * age);
  }

  const bodyFatPct = Number(((495 / bodyDensity) - 450).toFixed(2));
  return getCompositionMetrics(gender, weightKg, bodyFatPct);
}

/**
 * Método US Navy (Cálculo mediante cinta métrica):
 * Las constantes estándar (86.010, 70.041, 163.205, 97.684) están calibradas para medidas en pulgadas.
 * Se convierten las medidas de cm a pulgadas antes de aplicar la ecuación logarítmica.
 */
export function calculateNavyBodyFat(
  weightKg: number,
  params: NavyMethodMeasurements
): BodyCompositionResult {
  const { gender, heightCm, neckCm, waistCm, hipCm } = params;
  let bodyFatPct: number;

  const toInches = (cm: number) => cm / 2.54;
  const heightIn = toInches(heightCm);
  const neckIn = toInches(neckCm);
  const waistIn = toInches(waistCm);

  if (gender === 'male') {
    const diff = waistIn - neckIn;
    if (diff <= 0) return getCompositionMetrics(gender, weightKg, 15);
    bodyFatPct = 86.010 * Math.log10(diff) - 70.041 * Math.log10(heightIn) + 36.76;
  } else {
    const hipIn = toInches(hipCm || waistCm);
    const diff = waistIn + hipIn - neckIn;
    if (diff <= 0) return getCompositionMetrics(gender, weightKg, 22);
    bodyFatPct = 163.205 * Math.log10(diff) - 97.684 * Math.log10(heightIn) - 78.387;
  }

  // Clampear a rangos biológicamente posibles
  const clampedPct = Math.max(3, Math.min(65, Number(bodyFatPct.toFixed(2))));
  return getCompositionMetrics(gender, weightKg, clampedPct);
}

function getCompositionMetrics(gender: Gender, weightKg: number, bodyFatPercentage: number): BodyCompositionResult {
  const safeFat = Math.max(3, Math.min(60, bodyFatPercentage));
  const fatMassKg = Number(((weightKg * safeFat) / 100).toFixed(2));
  const leanMassKg = Number((weightKg - fatMassKg).toFixed(2));

  let category: BodyCompositionResult['category'] = 'promedio';
  if (gender === 'male') {
    if (safeFat < 6) category = 'esencial';
    else if (safeFat <= 13) category = 'atleta';
    else if (safeFat <= 17) category = 'fitness';
    else if (safeFat <= 24) category = 'promedio';
    else category = 'elevado';
  } else {
    if (safeFat < 14) category = 'esencial';
    else if (safeFat <= 20) category = 'atleta';
    else if (safeFat <= 24) category = 'fitness';
    else if (safeFat <= 31) category = 'promedio';
    else category = 'elevado';
  }

  return {
    bodyFatPercentage: safeFat,
    fatMassKg,
    leanMassKg,
    category
  };
}
