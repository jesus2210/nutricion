// LAYER: Interface
// Página de Check-in Semanal del Paciente

import CheckinForm from './CheckinForm';

export default function PatientCheckinPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
          Reporte de Check-in Semanal
        </h1>
        <p className="text-xs text-[#94a3b8]">
          Registra tus medidas y fotografías de progreso cada semana para evaluar tu evolución y ajustar tu plan.
        </p>
      </div>

      <CheckinForm />
    </div>
  );
}
