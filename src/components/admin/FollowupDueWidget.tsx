'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Phone,
  MessageCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { PatientFollowupInfo } from '@/domain/services/followup-scheduler';
import { updatePatientFollowupConfigAction } from '@/app/admin/patients/[id]/actions';

interface FollowupDueWidgetProps {
  followups: PatientFollowupInfo[];
  targetFridayDate: string; // YYYY-MM-DD
}

export default function FollowupDueWidget({
  followups,
  targetFridayDate,
}: FollowupDueWidgetProps) {
  const [filter, setFilter] = useState<'all' | 'due' | 'future'>('due');
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localFollowups, setLocalFollowups] = useState<PatientFollowupInfo[]>(followups);

  const dueList = localFollowups.filter((f) => f.isDueThisCycle);
  const overdueCount = localFollowups.filter((f) => f.status === 'overdue').length;
  const dueThisFridayCount = localFollowups.filter((f) => f.status === 'due_this_friday').length;
  const futureList = localFollowups.filter((f) => !f.isDueThisCycle);

  const displayedList =
    filter === 'due'
      ? dueList
      : filter === 'future'
      ? futureList
      : localFollowups;

  const targetDateObj = new Date(targetFridayDate + 'T00:00:00');
  const formattedFriday = targetDateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  async function handleUpdateFrequency(
    patientId: string,
    newFreq: 'weekly' | 'biweekly' | 'monthly'
  ) {
    setSavingId(patientId);
    try {
      const res = await updatePatientFollowupConfigAction(patientId, {
        frequency: newFreq,
      });
      if (res.success) {
        setLocalFollowups((prev) =>
          prev.map((item) =>
            item.patientId === patientId
              ? {
                  ...item,
                  frequency: newFreq,
                  frequencyLabel:
                    newFreq === 'weekly'
                      ? 'Semanal (1 sem)'
                      : newFreq === 'monthly'
                      ? 'Mensual (4 sem)'
                      : 'Quincenal (2 sem)',
                }
              : item
          )
        );
        setEditingPatientId(null);
      }
    } finally {
      setSavingId(null);
    }
  }

  async function handlePostponeToNextFriday(item: PatientFollowupInfo) {
    setSavingId(item.patientId);
    try {
      const currentTarget = new Date(item.nextFridayDate + 'T00:00:00');
      currentTarget.setDate(currentTarget.getDate() + 7);
      const newFridayStr = `${currentTarget.getFullYear()}-${String(
        currentTarget.getMonth() + 1
      ).padStart(2, '0')}-${String(currentTarget.getDate()).padStart(2, '0')}`;

      const res = await updatePatientFollowupConfigAction(item.patientId, {
        frequency: item.frequency,
        postponedUntilFriday: newFridayStr,
      });

      if (res.success) {
        setLocalFollowups((prev) =>
          prev.map((f) =>
            f.patientId === item.patientId
              ? {
                  ...f,
                  nextFridayDate: newFridayStr,
                  status: 'scheduled_future',
                  statusLabel: 'Pospuesto al sig. Viernes',
                  isDueThisCycle: false,
                  postponedUntilFriday: newFridayStr,
                }
              : f
          )
        );
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111a1f] p-5 shadow-sm">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#14352b] text-[#34d399]">
              <Calendar className="h-4 w-4" />
            </span>
            <h2 className="font-heading text-base font-extrabold text-white">
              Seguimientos Clínicos de Progreso
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#94a3b8]">
            Próximo ciclo fijado para el{' '}
            <strong className="capitalize text-[#34d399]">{formattedFriday}</strong>
          </p>
        </div>

        {/* Píldoras de filtro */}
        <div className="flex items-center gap-1.5 self-start rounded-xl border border-white/10 bg-[#0d1519] p-1 text-xs font-semibold sm:self-auto">
          <button
            onClick={() => setFilter('due')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              filter === 'due'
                ? 'bg-[#1b4337] text-[#a7f3d0] shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <span>Toca este Viernes</span>
            <span className="rounded-full bg-[#14352b] px-1.5 py-0.2 text-[10px] font-bold text-[#34d399]">
              {dueList.length}
            </span>
          </button>
          <button
            onClick={() => setFilter('future')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === 'future'
                ? 'bg-[#1b4337] text-[#a7f3d0] shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Próximos ciclos ({futureList.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === 'all'
                ? 'bg-[#1b4337] text-[#a7f3d0] shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Todos ({localFollowups.length})
          </button>
        </div>
      </div>

      {/* Resumen numérico rápido */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-500/20 bg-[#14352b]/50 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
            Para este Viernes
          </div>
          <div className="mt-1 font-heading text-2xl font-black text-white">
            {dueThisFridayCount}
          </div>
          <div className="text-[10px] text-emerald-400/80">Listos para revisión</div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
            Pendientes / Vencidos
          </div>
          <div className="mt-1 font-heading text-2xl font-black text-white">
            {overdueCount}
          </div>
          <div className="text-[10px] text-amber-400/80">Atrasados de ciclos previos</div>
        </div>

        <div className="col-span-2 rounded-xl border border-white/5 bg-[#0d1519] p-3 sm:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
            Siguiente Viernes
          </div>
          <div className="mt-1 font-heading text-2xl font-black text-white">
            {futureList.length}
          </div>
          <div className="text-[10px] text-[#94a3b8]">En semana de consolidación</div>
        </div>
      </div>

      {/* Lista de Pacientes */}
      <div className="mt-4 divide-y divide-white/5">
        {displayedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-[#34d399]/40" />
            <p className="mt-2 text-xs font-semibold text-white">
              {filter === 'due'
                ? '¡No hay seguimientos pendientes para este viernes!'
                : 'No hay pacientes para mostrar en este filtro.'}
            </p>
            <p className="text-[11px] text-[#64748b]">
              Los pacientes aparecerán aquí automáticamente según su fecha de inicio y frecuencia.
            </p>
          </div>
        ) : (
          displayedList.map((item) => {
            const isEditing = editingPatientId === item.patientId;
            const isSaving = savingId === item.patientId;

            // Formato amigable de la fecha de su viernes
            const dateObj = new Date(item.nextFridayDate + 'T00:00:00');
            const dateDisplay = dateObj.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <div
                key={item.patientId}
                className="group flex flex-col gap-3 py-3.5 transition sm:flex-row sm:items-center sm:justify-between hover:bg-white/[0.02] sm:px-2"
              >
                {/* Info del Paciente */}
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      item.status === 'overdue'
                        ? 'border border-amber-500/30 bg-amber-950/60 text-amber-300'
                        : item.status === 'due_this_friday'
                        ? 'border border-emerald-500/30 bg-[#14352b] text-[#34d399]'
                        : 'border border-white/10 bg-[#162229] text-[#94a3b8]'
                    }`}
                  >
                    {item.status === 'overdue' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/patients/${item.patientId}`}
                        className="text-sm font-bold text-white transition hover:text-[#34d399]"
                      >
                        {item.fullName}
                      </Link>

                      {/* Badge de Estado */}
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                          item.status === 'overdue'
                            ? 'border-amber-500/40 bg-amber-950/60 text-amber-300'
                            : item.status === 'due_this_friday'
                            ? 'border-emerald-500/40 bg-[#14352b] text-[#34d399]'
                            : 'border-white/10 bg-white/5 text-[#94a3b8]'
                        }`}
                      >
                        {item.statusLabel}
                      </span>

                      {/* Frecuencia actual */}
                      <button
                        onClick={() => setEditingPatientId(isEditing ? null : item.patientId)}
                        className="flex items-center gap-1 rounded border border-white/10 bg-[#162229] px-1.5 py-0.5 text-[10px] text-[#94a3b8] transition hover:bg-[#1e2e38] hover:text-white"
                        title="Cambiar frecuencia de seguimiento para este paciente"
                      >
                        <SlidersHorizontal className="h-2.5 w-2.5" />
                        <span>{item.frequencyLabel}</span>
                      </button>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748b]">
                      <span>
                        Viernes asignado: <strong className="text-white">{dateDisplay}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Último check-in:{' '}
                        <strong className="text-white">
                          {item.lastCheckinDate || 'Ninguno aún'}
                        </strong>
                      </span>
                    </div>

                    {/* Selector de frecuencia inline si está editando */}
                    {isEditing && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-[#245748] bg-[#0d1a16] p-2 text-xs">
                        <span className="text-[11px] font-semibold text-[#a7f3d0]">
                          Frecuencia:
                        </span>
                        <select
                          disabled={isSaving}
                          defaultValue={item.frequency}
                          onChange={(e) =>
                            handleUpdateFrequency(item.patientId, e.target.value as any)
                          }
                          className="rounded-lg border border-white/10 bg-[#111a1f] px-2 py-1 text-xs font-bold text-white focus:outline-none"
                        >
                          <option value="weekly">Semanal (cada 1 semana)</option>
                          <option value="biweekly">Quincenal (cada 2 semanas)</option>
                          <option value="monthly">Mensual (cada 4 semanas)</option>
                        </select>
                        <button
                          onClick={() => setEditingPatientId(null)}
                          className="text-[11px] text-[#94a3b8] hover:underline"
                        >
                          Cerrar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  {(item.status === 'overdue' || item.status === 'due_this_friday') && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handlePostponeToNextFriday(item)}
                      className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-2.5 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-900/50 cursor-pointer disabled:opacity-50"
                      title="Posponer este chequeo atrasado para el próximo viernes"
                    >
                      {isSaving ? 'Guardando...' : '⏱ Correr al sig. Viernes'}
                    </button>
                  )}

                  {item.phone && (
                    <a
                      href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `¡Hola ${item.fullName}! Te escribo de Contreras Nutrición Fit para recordarte que este viernes toca tu seguimiento y revisión de medidas. ¿Cómo te has sentido con el plan?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#162229] text-[#34d399] transition hover:bg-[#14352b]"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}

                  <Link
                    href={`/admin/patients/${item.patientId}`}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#162229] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#1e2e38]"
                  >
                    <span>Revisar Ficha</span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#94a3b8]" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
