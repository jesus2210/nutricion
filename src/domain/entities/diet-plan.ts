// LAYER: Domain
// Entidad de Plan Nutricional y Distribución de Comidas

export interface DailyPortions {
  starch: number;
  protein: number;
  fat: number;
  fruit: number;
  dairy: number;
}

export interface MealDistribution {
  id: string;
  name: string; // e.g. "Comida 1 (Desayuno)", "Comida 2 (Almuerzo)"
  time?: string;
  portions: DailyPortions;
  notes?: string;
}

export interface DietPlan {
  id: string;
  patientId: string;
  createdBy: string;
  title: string;
  goal: string;
  targetCalories: number;
  targetProteinG: number;
  targetFatG: number;
  targetCarbsG: number;
  portions: DailyPortions;
  meals: MealDistribution[];
  notes?: string | null;
  isCurrent: boolean;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  createdAt: Date;
}
