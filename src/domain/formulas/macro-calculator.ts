// LAYER: Domain
// Fórmula de Cálculo de Macronutrientes por Sistema de Equivalencias Nutricionales

import { DailyPortions, MealDistribution } from '@/domain/entities/diet-plan';

export interface MacroNutritionalValues {
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
}

export const PORTION_EQUIVALENCES: Record<keyof DailyPortions, MacroNutritionalValues> = {
  // Almidón base: 17.25g CHO, 1.5g Prot, 0.5g Grasa
  starch: { carbs: 17.25, protein: 1.5, fat: 0.5, calories: 79.5 },
  // Proteína base: 0g CHO, 8.0g Prot, 2.5g Grasa
  protein: { carbs: 0, protein: 8.0, fat: 2.5, calories: 54.5 },
  // Grasa pura: 0g CHO, 0g Prot, 5.0g Grasa
  fat: { carbs: 0, protein: 0, fat: 5.0, calories: 45.0 },
  // 1 Fruta = 1 Almidón (17.25g CHO, 1.5g Prot, 0.5g Grasa)
  fruit: { carbs: 17.25, protein: 1.5, fat: 0.5, calories: 79.5 },
  // 1 Lácteo = 1 Almidón + 1 Proteína (17.25g CHO, 9.5g Prot, 3.0g Grasa)
  dairy: { carbs: 17.25, protein: 9.5, fat: 3.0, calories: 134.0 }
};

export interface CalculatedMacros {
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  totalCalories: number;
  ratios: {
    carbsPerKg: number;
    proteinPerKg: number;
    fatPerKg: number;
  };
  percentages: {
    carbsPct: number;
    proteinPct: number;
    fatPct: number;
  };
  totalPortions: number;
}

export function calculateMacros(portions: DailyPortions, weightKg: number = 70): CalculatedMacros {
  let totalCarbs = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCalories = 0;
  let totalPortions = 0;

  for (const [key, count] of Object.entries(portions)) {
    const macroKey = key as keyof DailyPortions;
    const eq = PORTION_EQUIVALENCES[macroKey];
    if (eq && count > 0) {
      totalCarbs += eq.carbs * count;
      totalProtein += eq.protein * count;
      totalFat += eq.fat * count;
      totalCalories += eq.calories * count;
      totalPortions += count;
    }
  }

  const safeWeight = weightKg > 0 ? weightKg : 70;
  const carbsCalories = totalCarbs * 4;
  const proteinCalories = totalProtein * 4;
  const fatCalories = totalFat * 9;
  const macroCaloriesSum = carbsCalories + proteinCalories + fatCalories;

  const formatMacro = (val: number) => Number(val.toFixed(1));

  return {
    totalCarbs: formatMacro(totalCarbs),
    totalProtein: formatMacro(totalProtein),
    totalFat: formatMacro(totalFat),
    totalCalories: Math.round(macroCaloriesSum),
    ratios: {
      carbsPerKg: Number((totalCarbs / safeWeight).toFixed(2)),
      proteinPerKg: Number((totalProtein / safeWeight).toFixed(2)),
      fatPerKg: Number((totalFat / safeWeight).toFixed(2))
    },
    percentages: {
      carbsPct: macroCaloriesSum > 0 ? Math.round((carbsCalories / macroCaloriesSum) * 100) : 0,
      proteinPct: macroCaloriesSum > 0 ? Math.round((proteinCalories / macroCaloriesSum) * 100) : 0,
      fatPct: macroCaloriesSum > 0 ? Math.round((fatCalories / macroCaloriesSum) * 100) : 0
    },
    totalPortions
  };
}

/**
 * Distribuye las porciones diarias totales entre 4 comidas de forma automática.
 * Lógica idéntica al autoDistributeMeals() del proyecto vanilla JS original.
 */
export function autoDistributeMeals(totalPortions: DailyPortions): MealDistribution[] {
  const s = Math.max(0, Number(totalPortions.starch) || 0);
  const p = Math.max(0, Number(totalPortions.protein) || 0);
  const f = Math.max(0, Number(totalPortions.fat) || 0);
  const fr = Math.max(0, Number(totalPortions.fruit) || 0);
  const d = Math.max(0, Number(totalPortions.dairy) || 0);

  // FRUTAS: 1 en merienda si hay >= 1, 1 en desayuno si hay >= 2, resto a comidas principales
  const snackFruit = fr >= 1 ? 1 : 0;
  const bfastFruit = fr >= 2 ? 1 : 0;
  const remFruit = fr - snackFruit - bfastFruit;
  const lunchFruit = remFruit > 0 ? Math.ceil(remFruit / 2) : 0;
  const dinnerFruit = remFruit > lunchFruit ? remFruit - lunchFruit : 0;

  // LÁCTEOS: 1 en la merienda por defecto
  const snackDairy = d >= 1 ? 1 : 0;
  const bfastDairy = d - snackDairy;

  // GRASAS: 1 en merienda, resto distribuido en 3 comidas
  const snackFat = f >= 1 ? 1 : 0;
  const mainFat = f - snackFat;
  const bfastFat = Math.floor(mainFat / 3);
  const lunchFat = Math.floor((mainFat - bfastFat) / 2);
  const dinnerFat = mainFat - bfastFat - lunchFat;

  // PROTEÍNAS: distribuidas equitativamente en Desayuno, Almuerzo, Cena
  const snackProt = p >= 15 ? 2 : 0;
  const mainProt = p - snackProt;
  const bfastProt = Math.floor(mainProt / 3);
  const lunchProt = Math.floor((mainProt - bfastProt) / 2);
  const dinnerProt = mainProt - bfastProt - lunchProt;

  // ALMIDONES: distribuidos equitativamente en Desayuno, Almuerzo, Cena
  const snackStarch = s >= 14 ? 1 : 0;
  const mainStarch = s - snackStarch;
  const bfastStarch = Math.floor(mainStarch / 3);
  const lunchStarch = Math.floor((mainStarch - bfastStarch) / 2);
  const dinnerStarch = mainStarch - bfastStarch - lunchStarch;

  return [
    {
      id: 'meal_1',
      name: 'Comida 1 (Desayuno)',
      portions: { starch: bfastStarch, protein: bfastProt, fat: bfastFat, fruit: bfastFruit, dairy: bfastDairy },
    },
    {
      id: 'meal_2',
      name: 'Comida 2 (Almuerzo)',
      portions: { starch: lunchStarch, protein: lunchProt, fat: lunchFat, fruit: lunchFruit, dairy: 0 },
    },
    {
      id: 'meal_3',
      name: 'Comida 3 (Cena)',
      portions: { starch: dinnerStarch, protein: dinnerProt, fat: dinnerFat, fruit: dinnerFruit, dairy: 0 },
    },
    {
      id: 'meal_4',
      name: 'Merienda',
      portions: { starch: snackStarch, protein: snackProt, fat: snackFat, fruit: snackFruit, dairy: snackDairy },
    },
  ];
}
