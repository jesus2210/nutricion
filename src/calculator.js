// Motor de cálculo de macronutrientes y optimizador de porciones
import { PORTION_VALUES } from './constants.js';

/**
 * Calcula los macronutrientes totales exactos basados en la cantidad de porciones.
 * @param {Object} portions - { starch, protein, fat, fruit, dairy }
 * @param {number} weightKg - Peso del paciente en kg (para g/kg)
 * @returns {Object} Resumen completo de macros y calorías
 */
export function calculateMacros(portions, weightKg = 55) {
  const starch = Math.max(0, Number(portions.starch) || 0);
  const protein = Math.max(0, Number(portions.protein) || 0);
  const fat = Math.max(0, Number(portions.fat) || 0);
  const fruit = Math.max(0, Number(portions.fruit) || 0);
  const dairy = Math.max(0, Number(portions.dairy) || 0);

  // Cálculo individual por bloque
  const starchCarbs = starch * PORTION_VALUES.STARCH.carbs;
  const starchProtein = starch * PORTION_VALUES.STARCH.protein;
  const starchFat = starch * PORTION_VALUES.STARCH.fat;

  const proteinCarbs = protein * PORTION_VALUES.PROTEIN.carbs;
  const proteinProtein = protein * PORTION_VALUES.PROTEIN.protein;
  const proteinFat = protein * PORTION_VALUES.PROTEIN.fat;

  const fatCarbs = fat * PORTION_VALUES.FAT.carbs;
  const fatProtein = fat * PORTION_VALUES.FAT.protein;
  const fatFat = fat * PORTION_VALUES.FAT.fat;

  const fruitCarbs = fruit * PORTION_VALUES.FRUIT.carbs;
  const fruitProtein = fruit * PORTION_VALUES.FRUIT.protein;
  const fruitFat = fruit * PORTION_VALUES.FRUIT.fat;

  const dairyCarbs = dairy * PORTION_VALUES.DAIRY.carbs;
  const dairyProtein = dairy * PORTION_VALUES.DAIRY.protein;
  const dairyFat = dairy * PORTION_VALUES.DAIRY.fat;

  // Sumas totales
  const totalCarbs = starchCarbs + proteinCarbs + fatCarbs + fruitCarbs + dairyCarbs;
  const totalProtein = starchProtein + proteinProtein + fatProtein + fruitProtein + dairyProtein;
  const totalFat = starchFat + proteinFat + fatFat + fruitFat + dairyFat;

  // Calorías usando factores Atwater (4-4-9)
  const caloriesFromCarbs = totalCarbs * 4;
  const caloriesFromProtein = totalProtein * 4;
  const caloriesFromFat = totalFat * 9;
  const totalCalories = caloriesFromCarbs + caloriesFromProtein + caloriesFromFat;

  // Ratios relativos al peso
  const safeWeight = weightKg > 0 ? weightKg : 55;
  const proteinPerKg = totalProtein / safeWeight;
  const fatPerKg = totalFat / safeWeight;
  const carbsPerKg = totalCarbs / safeWeight;

  // Distribución porcentual calórica
  const totalCalSafe = totalCalories > 0 ? totalCalories : 1;
  const carbsPct = Math.round((caloriesFromCarbs / totalCalSafe) * 100);
  const proteinPct = Math.round((caloriesFromProtein / totalCalSafe) * 100);
  const fatPct = Math.round((caloriesFromFat / totalCalSafe) * 100);

  return {
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    totalCalories: Math.round(totalCalories),
    totalPortions: starch + protein + fat + fruit + dairy,
    breakdown: {
      carbsFromStarch: starchCarbs,
      carbsFromFruit: fruitCarbs,
      carbsFromDairy: dairyCarbs,
      proteinFromMeat: proteinProtein,
      proteinFromOther: totalProtein - proteinProtein,
      fatFromPureFat: fatFat,
      fatFromOther: totalFat - fatFat
    },
    ratios: {
      proteinPerKg: Math.round(proteinPerKg * 100) / 100,
      fatPerKg: Math.round(fatPerKg * 100) / 100,
      carbsPerKg: Math.round(carbsPerKg * 100) / 100
    },
    percentages: {
      carbs: carbsPct,
      protein: proteinPct,
      fat: fatPct
    }
  };
}

/**
 * Optimizador de porciones automático.
 * Encuentra la combinación exacta de porciones para acercarse a las calorías y ratios deseados.
 */
export function solveOptimalPortions({
  targetCalories = 2000,
  weightKg = 55,
  targetProteinPerKg = 1.8,
  targetFatPerKg = 1.1,
  fruitPortions = 2,
  dairyPortions = 1,
  preferHighFat = false // Para SII / colon irritable
}) {
  const safeWeight = weightKg > 0 ? weightKg : 55;
  let bestPortions = { starch: 9, protein: 9, fat: 11, fruit: fruitPortions, dairy: dairyPortions };
  let minScore = Infinity;

  const targetProteinGrams = safeWeight * targetProteinPerKg;
  const targetFatGrams = safeWeight * targetFatPerKg;

  const minStarch = preferHighFat ? 5 : 6;
  const maxStarch = preferHighFat ? 11 : 16;
  const minProtein = 6;
  const maxProtein = 16;
  const minFat = 4;
  const maxFat = preferHighFat ? 15 : 10;

  for (let s = minStarch; s <= maxStarch; s++) {
    for (let p = minProtein; p <= maxProtein; p++) {
      for (let f = minFat; f <= maxFat; f++) {
        const testPortions = { starch: s, protein: p, fat: f, fruit: fruitPortions, dairy: dairyPortions };
        const result = calculateMacros(testPortions, safeWeight);

        const calDiff = Math.abs(result.totalCalories - targetCalories);
        const protDiff = Math.abs(result.totalProtein - targetProteinGrams);
        const fatDiff = Math.abs(result.totalFat - targetFatGrams);

        let score = (calDiff * 1.5) + (protDiff * 2.0) + (fatDiff * 1.2);

        if (result.ratios.proteinPerKg < 1.6) {
          score += 200;
        }

        if (result.ratios.fatPerKg < 0.9) {
          score += 150;
        }

        if (score < minScore) {
          minScore = score;
          bestPortions = { starch: s, protein: p, fat: f, fruit: fruitPortions, dairy: dairyPortions };
        }
      }
    }
  }

  return bestPortions;
}

/**
 * Distribuye de forma natural y matemática las porciones del día en comidas estándar.
 * Réplica exacta del formato del plan de Génesis:
 * 3 Comidas Principales (Desayuno, Almuerzo, Cena) + 1 Merienda.
 */
export function autoDistributeMeals(totalPortions) {
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

  // LÁCTEOS: 1 en la merienda por defecto (o desayuno si no hay merienda)
  const snackDairy = d >= 1 ? 1 : 0;
  const bfastDairy = d - snackDairy;

  // GRASAS: 1 porción asignada a la merienda (para frutos secos, chocolate o crema), el resto a las 3 comidas principales
  const snackFat = f >= 4 ? 1 : (f >= 1 ? 1 : 0);
  const mainFat = f - snackFat;
  const bfastFat = Math.floor(mainFat / 3);
  const lunchFat = Math.floor((mainFat - bfastFat) / 2);
  const dinnerFat = mainFat - bfastFat - lunchFat;

  // PROTEÍNAS: Las proteínas se dividen equitativamente en Desayuno, Almuerzo y Cena
  // (a menos que haya muchas, ej >= 15 donde se puede dejar 1 para merienda)
  const snackProt = p >= 15 ? 2 : 0;
  const mainProt = p - snackProt;
  const bfastProt = Math.floor(mainProt / 3);
  const lunchProt = Math.floor((mainProt - bfastProt) / 2);
  const dinnerProt = mainProt - bfastProt - lunchProt;

  // ALMIDONES: Divididos equitativamente en Desayuno, Almuerzo y Cena
  const snackStarch = s >= 14 ? 1 : 0;
  const mainStarch = s - snackStarch;
  const bfastStarch = Math.floor(mainStarch / 3);
  const lunchStarch = Math.floor((mainStarch - bfastStarch) / 2);
  const dinnerStarch = mainStarch - bfastStarch - lunchStarch;

  return [
    {
      id: 'meal_1',
      name: 'Comida 1 (Desayuno)',
      portions: {
        starch: bfastStarch,
        protein: bfastProt,
        fat: bfastFat,
        fruit: bfastFruit,
        dairy: bfastDairy
      }
    },
    {
      id: 'meal_2',
      name: 'Comida 2 (Almuerzo)',
      portions: {
        starch: lunchStarch,
        protein: lunchProt,
        fat: lunchFat,
        fruit: lunchFruit,
        dairy: 0
      }
    },
    {
      id: 'meal_3',
      name: 'Comida 3 (Cena)',
      portions: {
        starch: dinnerStarch,
        protein: dinnerProt,
        fat: dinnerFat,
        fruit: dinnerFruit,
        dairy: 0
      }
    },
    {
      id: 'meal_4',
      name: 'Comida 4 (Merienda)',
      portions: {
        starch: snackStarch,
        protein: snackProt,
        fat: snackFat,
        fruit: snackFruit,
        dairy: snackDairy
      }
    }
  ];
}
