import { PatientIdentityInfo } from '@/domain/entities/patient';

export type FollowupFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface PatientFollowupInfo {
  patientId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  isManualPatient: boolean;
  frequency: FollowupFrequency;
  frequencyLabel: string;
  startDate: string; // YYYY-MM-DD
  lastCheckinDate: string | null; // YYYY-MM-DD
  nextFridayDate: string; // YYYY-MM-DD
  daysUntilNextFriday: number;
  status: 'due_this_friday' | 'overdue' | 'scheduled_future';
  statusLabel: string;
  isDueThisCycle: boolean; // Le toca en el viernes próximo inmediato
}

/**
 * Obtiene el viernes de la misma semana de una fecha dada (considerando lunes=1...domingo=7)
 */
export function getFridayOfSameWeek(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay(); // 0 domingo, 1 lunes, ..., 5 viernes, 6 sabado
  // Diferencia de días hasta el viernes (5)
  // Si es domingo (0), el viernes anterior fue -2, o tratamos la semana de lun a dom:
  const diff = 5 - (day === 0 ? 7 : day);
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Obtiene el viernes de la semana siguiente (+7 días desde el viernes de la misma semana)
 */
export function getFridayOfNextWeek(d: Date): Date {
  const sameWeekFriday = getFridayOfSameWeek(d);
  const nextFriday = new Date(sameWeekFriday);
  nextFriday.setDate(nextFriday.getDate() + 7);
  return nextFriday;
}

/**
 * Calcula la fecha del primer seguimiento en viernes según la regla clínica:
 * Si el paciente inicia lunes o martes (días 1 o 2), el viernes de esa misma semana tiene 4-5 días,
 * pero según la regla del coach:
 * "si alguien empieza a mitad de semana, el seguimiento sería la semana siguiente (para que tenga al menos ~7-10 días con el plan) y de ahí cada 2 semanas".
 *
 * Regla:
 * - Si inicia miércoles o después (o si la distancia al viernes de esta semana es menor a 4 días):
 *   su primer seguimiento es el VIERNES DE LA SEMANA SIGUIENTE.
 * - Si inicia lunes o martes con plan ya entregado temprano: puede ser viernes de esta semana o semana siguiente según días transcurridos.
 *   Por defecto, para garantizar 7-10 días de adherencia, el primer viernes con al menos 7 días de diferencia.
 */
export function calculateFirstFridayFollowup(startDateStr: string): Date {
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);

  const sameWeekFriday = getFridayOfSameWeek(start);
  const daysDiff = Math.round((sameWeekFriday.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Si faltan menos de 4 días para el viernes de esa semana (ej. empezó miércoles, jueves, viernes, sábado o domingo),
  // el primer seguimiento pasa al viernes de la siguiente semana para que tenga tiempo de adaptación.
  if (daysDiff < 4) {
    return getFridayOfNextWeek(start);
  }
  return sameWeekFriday;
}

export function formatYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula la próxima fecha de seguimiento de un paciente dado:
 * - Fecha de inicio (startDate)
 * - Frecuencia (semanal = 7 días, quincenal = 14 días, mensual = 28 días)
 * - Fecha del último checkin completado (lastCheckinDate opcional)
 * - Fecha de referencia (hoy por defecto)
 */
export function calculateNextFollowupDate({
  startDateStr,
  frequency = 'biweekly',
  lastCheckinDateStr,
  referenceDate = new Date(),
}: {
  startDateStr: string;
  frequency?: FollowupFrequency;
  lastCheckinDateStr?: string | null;
  referenceDate?: Date;
}): {
  nextFriday: Date;
  status: 'due_this_friday' | 'overdue' | 'scheduled_future';
  statusLabel: string;
  isDueThisCycle: boolean;
} {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const stepDays = frequency === 'weekly' ? 7 : frequency === 'monthly' ? 28 : 14;

  let currentFriday = calculateFirstFridayFollowup(startDateStr);

  // Si ya tiene check-ins registrados, avanzar a partir del último checkin
  if (lastCheckinDateStr) {
    const lastCheckin = new Date(lastCheckinDateStr);
    lastCheckin.setHours(0, 0, 0, 0);
    // Próximo viernes tras el último check-in
    const nextAfterLast = new Date(lastCheckin);
    nextAfterLast.setDate(nextAfterLast.getDate() + stepDays);
    currentFriday = getFridayOfSameWeek(nextAfterLast);
  } else {
    // Si no tiene check-ins y la fecha inicial calculada quedó en el pasado,
    // avanzar en múltiplos de stepDays (manteniendo siempre días viernes)
    while (currentFriday.getTime() < ref.getTime()) {
      const nextStep = new Date(currentFriday);
      nextStep.setDate(nextStep.getDate() + stepDays);
      // Si la fecha ya pasó por más de 7 días, seguimos avanzando hasta acercarnos
      if (ref.getTime() - currentFriday.getTime() > 7 * 24 * 60 * 60 * 1000) {
        currentFriday = nextStep;
      } else {
        break; // Está vencido o toca este viernes
      }
    }
  }

  // Próximo viernes de referencia (el viernes de esta semana o el próximo si hoy es después de viernes)
  const thisWeekFriday = getFridayOfSameWeek(ref);
  const nextTargetFriday = ref.getDay() > 5 ? getFridayOfNextWeek(ref) : thisWeekFriday;

  const diffDays = Math.round((currentFriday.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));

  let status: 'due_this_friday' | 'overdue' | 'scheduled_future' = 'scheduled_future';
  let statusLabel = 'Próximo ciclo';
  let isDueThisCycle = false;

  if (diffDays < 0) {
    // Ya pasó la fecha y no ha hecho check-in
    status = 'overdue';
    statusLabel = 'Atrasado';
    isDueThisCycle = true;
  } else if (diffDays <= 7 && currentFriday.getTime() <= nextTargetFriday.getTime()) {
    // Toca en el viernes inmediato más próximo (dentro de los próximos 7 días)
    status = 'due_this_friday';
    statusLabel = 'Toca este Viernes';
    isDueThisCycle = true;
  } else {
    status = 'scheduled_future';
    statusLabel = 'Próximo ciclo';
    isDueThisCycle = false;
  }

  return { nextFriday: currentFriday, status, statusLabel, isDueThisCycle };
}
