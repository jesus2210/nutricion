// Constantes del sistema de equivalencias nutricionales
// Basado en ingeniería inversa exacta del documento de referencia

export const PORTION_VALUES = {
  STARCH: {
    name: 'Almidón',
    singular: 'Almidón',
    plural: 'Almidones',
    carbs: 17.25,
    protein: 1.5,
    fat: 0.5,
    calories: 17.25 * 4 + 1.5 * 4 + 0.5 * 9, // 79.5 kcal
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'wheat'
  },
  PROTEIN: {
    name: 'Proteína',
    singular: 'Proteína',
    plural: 'Proteínas',
    carbs: 0.0,
    protein: 8.0,
    fat: 2.5,
    calories: 0 * 4 + 8.0 * 4 + 2.5 * 9, // 54.5 kcal
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: 'fish'
  },
  FAT: {
    name: 'Grasa',
    singular: 'Grasa',
    plural: 'Grasas',
    carbs: 0.0,
    protein: 0.0,
    fat: 5.0,
    calories: 0 * 4 + 0 * 4 + 5.0 * 9, // 45.0 kcal
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'droplet'
  },
  FRUIT: {
    name: 'Fruta',
    singular: 'Fruta',
    plural: 'Frutas',
    // 1 Fruta equivale a 1 Almidón
    carbs: 17.25,
    protein: 1.5,
    fat: 0.5,
    calories: 17.25 * 4 + 1.5 * 4 + 0.5 * 9, // 79.5 kcal
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'apple'
  },
  DAIRY: {
    name: 'Lácteo',
    singular: 'Lácteo',
    plural: 'Lácteos',
    // 1 Lácteo equivale a 1 Almidón + 1 Proteína
    carbs: 17.25,
    protein: 9.5, // 1.5 + 8.0
    fat: 3.0,     // 0.5 + 2.5
    calories: 17.25 * 4 + 9.5 * 4 + 3.0 * 9, // 134.0 kcal
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    icon: 'cup-soda'
  },
  VEGETABLE: {
    name: 'Vegetales',
    singular: 'Vegetal',
    plural: 'Vegetales',
    carbs: 0.0,
    protein: 0.0,
    fat: 0.0,
    calories: 0.0,
    free: true,
    color: '#16A34A',
    bgColor: '#DCFCE7',
    icon: 'leaf'
  }
};

export const PRESETS = [
  {
    id: 'genesis_ref',
    name: 'Plan de Referencia (Diet Break / Recomposición)',
    description: 'Estructura original exacta de 1,978 kcal: balance óptimo para rendimiento y recuperación.',
    weightKg: 55,
    portions: {
      starch: 9,
      protein: 12,
      fat: 7,
      fruit: 2,
      dairy: 1
    },
    notes: '207g Carbos, 122g Proteína (2.22 g/kg), 73.5g Grasa (1.34 g/kg).'
  },
  {
    id: 'ibs_digestive',
    name: 'Ajuste Intestino Irritable / Bajo Volumen (1,994 kcal)',
    description: 'Menos almidones fermentables y volumen gástrico, mayor densidad energética con grasas saludables.',
    weightKg: 55,
    portions: {
      starch: 9,
      protein: 9,
      fat: 11,
      fruit: 2,
      dairy: 1
    },
    notes: '207g Carbos, 98g Proteína (1.78 g/kg), 86g Grasa (1.56 g/kg). Digestión ligera.'
  },
  {
    id: 'clean_surplus_2000',
    name: 'Superávit Limpio 2,000 kcal (Alto Carbohidrato)',
    description: 'Prioriza combustible muscular para entrenamientos pesados con grasas moderadas.',
    weightKg: 55,
    portions: {
      starch: 12,
      protein: 9,
      fat: 6,
      fruit: 2,
      dairy: 1
    },
    notes: '258.7g Carbos, 102.5g Proteína (1.86 g/kg), 62.5g Grasa (1.13 g/kg).'
  },
  {
    id: 'fat_loss_1600',
    name: 'Definición / Déficit Controlado (~1,600 kcal)',
    description: 'Proteína alta para preservación muscular con moderación estratégica en carbohidratos.',
    weightKg: 60,
    portions: {
      starch: 6,
      protein: 12,
      fat: 5,
      fruit: 2,
      dairy: 1
    },
    notes: '155.2g Carbos, 117.5g Proteína (1.95 g/kg), 56g Grasa. Saciedad elevada.'
  },
  {
    id: 'athlete_high_energy',
    name: 'Alto Rendimiento / Volumen Atleta (~2,450 kcal)',
    description: 'Para personas con alto gasto calórico diario o entrenamiento doble sesión.',
    weightKg: 70,
    portions: {
      starch: 14,
      protein: 14,
      fat: 9,
      fruit: 3,
      dairy: 1
    },
    notes: '310.5g Carbos, 148g Proteína (2.11 g/kg), 89.5g Grasa.'
  }
];

export const FOOD_DATABASE = {
  almidones: {
    category: 'Almidones',
    description: '1 porción aporta ~17.25g Carbohidratos, 1.5g Proteína y 0.5g Grasa (~80 kcal). Medir cocido salvo indicación.',
    highFrequency: [
      { name: 'Arepa', amount: '40g', detail: '1 unidad pequeña' },
      { name: 'Avena en hojuelas', amount: '20g', detail: '2 cucharadas (pesar cruda)' },
      { name: 'Arroz blanco o integral cocido', amount: '80g', detail: '1/2 taza' },
      { name: 'Papa cocida o al horno', amount: '100g', detail: '1 unidad pequeña' },
      { name: 'Batata / Camote', amount: '65g', detail: '1 trozo mediano' },
      { name: 'Yuca / Apio cocido', amount: '60g', detail: '1 trozo' },
      { name: 'Pasta cocida', amount: '70g', detail: '1/2 taza' },
      { name: 'Plátano verde o maduro', amount: '50g', detail: '1/4 de unidad' },
      { name: 'Pan integral', amount: '30g', detail: '1 rebanada' },
      { name: 'Quinoa cocida', amount: '40g', detail: '1/4 de taza' },
      { name: 'Tortilla de maíz o trigo', amount: '30g', detail: '1 unidad' },
      { name: 'Galletas de arroz inflado', amount: '3 unidades', detail: '~25g' },
      { name: 'Cotufas / Palomitas de maíz sin grasa', amount: '25g', detail: '3 tazas' },
      { name: 'Leguminosas (lentejas, caraotas, garbanzos, frijoles)', amount: '50g', detail: '1/4 de taza cocidas' }
    ],
    lowFrequency: [
      { name: 'Mermelada', amount: '20g', detail: '1 cucharada' },
      { name: 'Miel de abeja pura', amount: '20g', detail: '1 cucharada' },
      { name: 'Granola o muesli', amount: '20g', detail: '1/4 de taza' },
      { name: 'Cereal en hojuelas (corn flakes)', amount: '25g', detail: '1/2 taza' },
      { name: 'Galletas de soda o maría', amount: '30g', detail: '1 paquete individual' }
    ]
  },
  proteinas: {
    category: 'Proteínas',
    description: '1 porción aporta 0g Carbohidratos, 8.0g Proteína y 2.5g Grasa (~55 kcal). Pesar cocidas sin grasa visible.',
    highFrequency: [
      { name: 'Huevo entero', amount: '1 unidad', detail: 'O 2 unidades de claras de huevo' },
      { name: 'Pechuga de pollo o pavo', amount: '30g', detail: 'Sin piel cocida' },
      { name: 'Pescado blanco o azul o mariscos', amount: '30g', detail: 'Filete cocido' },
      { name: 'Lomo de cerdo magro', amount: '30g', detail: 'Cocido sin grasa' },
      { name: 'Carne de res magra', amount: '30g', detail: 'Corte magro cocido' },
      { name: 'Queso cottage descremado', amount: '50g', detail: '1/4 de taza' },
      { name: 'Quesos blancos bajos en grasa', amount: '30g', detail: 'Mozzarella light, paisa, requesón' }
    ],
    vegetarian: [
      { name: 'Tofu firme', amount: '100g', detail: 'Pesar crudo' },
      { name: 'Soja texturizada', amount: '15g', detail: '1/4 taza (pesar en seco)' },
      { name: 'Tempeh', amount: '35g', detail: '1/4 taza' },
      { name: 'Leguminosas cocidas (aporte proteico)', amount: '100g', detail: '1/2 taza (+ cuenta como 1 almidón)' }
    ],
    note: 'Suplemento: 1 scoop de proteína de suero (whey/isolate) equivale a 3 porciones de proteína.'
  },
  grasas: {
    category: 'Grasas Saludables',
    description: '1 porción aporta 0g Carbohidratos, 0g Proteína y 5.0g Grasa (45 kcal).',
    highFrequency: [
      { name: 'Aceite de oliva virgen extra o aguacate', amount: '5g', detail: '1 cucharadita' },
      { name: 'Aguacate fresco', amount: '30g', detail: 'Aprox. 2 cucharadas triturado' },
      { name: 'Mantequilla de maní o de almendras natural', amount: '10g', detail: '2 cucharaditas' },
      { name: 'Frutos secos (almendras, maní, merey, nueces)', amount: '8g', detail: 'Un puñadito medido' },
      { name: 'Semillas de linaza o de chía', amount: '10g', detail: '1 cucharada' },
      { name: 'Aceitunas enteras', amount: '30g', detail: '6 a 8 unidades' },
      { name: 'Bebida de almendras sin azúcar', amount: '240ml', detail: '1 taza' }
    ],
    lowFrequency: [
      { name: 'Aceite de maíz o vegetal', amount: '5g', detail: '1 cucharadita' },
      { name: 'Mayonesa', amount: '10g', detail: '1 cucharadita' },
      { name: 'Coco rallado', amount: '2 cucharadas', detail: '~10g' },
      { name: 'Tocineta crocante', amount: '2 tiras finas', detail: 'Ocasional' },
      { name: 'Mantequilla de leche o margarina', amount: '5g', detail: '1 cucharadita' },
      { name: 'Queso amarillo madurado', amount: '15g', detail: '1 rebanada fina' }
    ]
  },
  frutas: {
    category: 'Frutas',
    description: '1 porción equivale a 1 Almidón (~17.25g Carbos, 1.5g Proteína, 0.5g Grasa). Ricas en micronutrientes y agua.',
    items: [
      { name: 'Cambur / Banana / Plátano maduro', amount: '90g', detail: '1/2 unidad mediana' },
      { name: 'Manzana, pera, kiwi, naranja, melocotón o mandarina', amount: '1 unidad', detail: 'Mediana (~120-150g)' },
      { name: 'Duraznos', amount: '2 unidades', detail: 'Pequeñas' },
      { name: 'Fresas enteras frescas', amount: '180g', detail: '1 taza colmada' },
      { name: 'Arándanos, piña en trozos o moras', amount: '100g', detail: '3/4 de taza' },
      { name: 'Frambuesas frescas', amount: '140g', detail: '3/4 de taza' },
      { name: 'Papaya, melón o sandía / patilla', amount: '200g', detail: '2 tazas en cubos' },
      { name: 'Parchita / Maracuyá', amount: '140g', detail: 'Pulpa' },
      { name: 'Uvas frescas', amount: '90g', detail: 'Aprox. 12 a 15 uvas' }
    ]
  },
  lacteos: {
    category: 'Lácteos y Bebidas',
    description: '1 porción equivale a 1 Almidón + 1 Proteína (~17.25g C, 9.5g P, 3g G, ~134 kcal).',
    items: [
      { name: 'Leche descremada / desnatada', amount: '240ml', detail: '1 taza' },
      { name: 'Yogurt griego descremado (sin azúcar añadido)', amount: '150g', detail: '1 pote individual o 3/4 taza' },
      { name: 'Kéfir natural líquido', amount: '200ml', detail: '1 vaso mediano' },
      { name: 'Bebida de soya sin azúcar añadido', amount: '240ml', detail: '1 taza' }
    ]
  },
  vegetales: {
    category: 'Vegetales Libres',
    description: 'Aportan saciedad, fibra, vitaminas y minerales. Libres en cualquier comida.',
    items: [
      { name: 'Vegetales crudos (lechuga, espinaca, pepino, tomate, rúcula)', amount: '1 taza o libre', detail: 'En todas las comidas' },
      { name: 'Vegetales cocidos (brócoli, calabacín, vainitas, berenjena, espárragos)', amount: '1/2 taza o libre', detail: 'Acompañamiento ideal' }
    ]
  }
};

export const DEFAULT_GUIDELINES = [
  {
    title: 'Medición de Alimentos',
    text: 'Todos los alimentos de la lista de porciones se miden una vez cocidos, a excepción de la avena que se pesa cruda.'
  },
  {
    title: 'Prioriza el Consumo de Agua',
    text: 'Mantén un mínimo de 35-40 ml de agua por kg de peso corporal al día. Las infusiones y bebidas sin calorías son válidas, pero no sustituyen el agua pura.'
  },
  {
    title: 'Vegetales Libres en Cada Comida',
    text: 'Puedes agregar vegetales verdes y ensaladas en cualquier comida sin restricción estricta. Aportan saciedad inmediata y fibra saludable.'
  },
  {
    title: 'Edulcorantes y Azúcares',
    text: 'Usa con libertad stevia, monkfruit o splenda. Evita el azúcar blanco, moreno, miel o jarabes calóricos salvo en las porciones contabilizadas.'
  },
  {
    title: 'Flexibilidad de Comidas',
    text: 'Puedes unir comidas o intercambiar porciones entre momentos del día según tu horario, siempre que cumplas el total de porciones al finalizar la jornada.'
  },
  {
    title: 'Entrenamiento en Ayunas',
    text: 'Solo entrena en ayunas si ya es tu hábito y te sientes con energía. Si buscas fuerza máxima, consume 1 porción de fruta 20-30 min antes.'
  },
  {
    title: 'Suplementación de Apoyo',
    text: 'Si consumes poco pescado graso, evalúa 1000-2000 mg de Omega 3 (EPA+DHA). Toma 15-20 min de sol directo o suplementa 2000 UI de Vitamina D3.'
  }
];

export const SNACK_IDEAS = [
  {
    type: '1 Fruta + 1 Lácteo + 1 Grasa',
    examples: [
      '½ banana en rodajas + 150g yogurt griego descremado + 8g de maní o nueces.',
      'Merengada batida: 1 taza de fresas + 1 taza de leche descremada + 10g de chocolate oscuro 70%.',
      '1 manzana picada con dip de 150g yogurt griego + 10g (2 cdtas) de mantequilla de maní.',
      'Bowl de 150g yogurt descremado + ¾ taza de arándanos + 8g de almendras fileteadas.'
    ]
  },
  {
    type: '1 Almidón + 1 Lácteo + 1 Grasa',
    examples: [
      'Café con leche (1 taza leche descremada) + 1 rebanada de pan integral tostado + 2 cdtas mantequilla de maní.',
      '1 yogurt descremado + 20g de granola + 8g de maní sin sal.',
      '1 taza de leche descremada fría + 3 galletas de arroz inflado untadas con 2 cdtas de mantequilla de almendras.',
      'Café con leche descremada + 1 paquete de galletas maría o de soda + 10g de frutos secos.'
    ]
  },
  {
    type: '2 Almidones + 1 Proteína + 1 Grasa',
    examples: [
      '2 rebanadas de pan tostado + 1 huevo a la plancha sin aceite + 30g de aguacate en rebanadas.',
      '2 rebanadas de pan tostado + 1 rebanada de jamón magro + 30g de queso bajo en grasa + 1 cdta de margarina/aceite.',
      '4 galletas de arroz inflado + 30g de salmón o atún ahumado + 1 cda de queso crema light.',
      '2 rebanadas de pan tostado + 30g queso mozzarella bajo en grasa + rodajas de tomate + 1 cda de salsa pesto casera.'
    ]
  }
];
