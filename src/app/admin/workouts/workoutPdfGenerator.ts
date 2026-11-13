// LAYER: Interface / PDF Export
// Generador de PDF Vertical (A4 Portrait) limpio y editorial estilo Contreras Nutrición Fit con enlaces clicables a YouTube

import {
  WorkoutDay,
  TrainingLevel,
  SET_METHOD_LABELS,
  formatRestMinutes,
  getDefaultYoutubeSearchUrl,
} from '@/domain/entities/workout';

export interface GenerateWorkoutPdfInput {
  patientName: string;
  weightKg?: number;
  routineTitle: string;
  routineGoal: string;
  level?: TrainingLevel;
  days: WorkoutDay[];
  clinicName?: string;
  autoYoutubeFallback?: boolean;
}

async function loadImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateWorkoutRoutinePdf(input: GenerateWorkoutPdfInput): Promise<void> {
  const { jsPDF } = await import('jspdf');

  // Formato Vertical A4 en puntos (595.28 x 841.89 pt)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // ~595 pt
  const pageHeight = pdf.internal.pageSize.getHeight(); // ~842 pt
  const marginX = 32;
  const contentWidth = pageWidth - marginX * 2;

  const clinicName = input.clinicName || 'Contreras Nutrición Fit';
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const logoDataUrl = await loadImageAsDataUrl('/logo_contreras_transparent.png');

  let currentPage = 1;

  function drawFooter(pageNum: number) {
    pdf.setDrawColor(226, 232, 240); // #e2e8f0
    pdf.setLineWidth(0.75);
    pdf.line(marginX, pageHeight - 32, pageWidth - marginX, pageHeight - 32);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139); // #64748b
    pdf.text(
      `${clinicName}  ·  Plan de Entrenamiento Personalizado`,
      marginX,
      pageHeight - 17
    );
    pdf.text(`Página ${pageNum}`, pageWidth - marginX, pageHeight - 17, {
      align: 'right',
    });
  }

  function drawContinuationHeader() {
    pdf.setFillColor(15, 39, 32); // #0f2720
    pdf.rect(0, 0, pageWidth, 34, 'F');
    pdf.setFillColor(52, 211, 153); // #34d399
    pdf.rect(0, 34, pageWidth, 2, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(167, 243, 208);
    pdf.text(clinicName.toUpperCase(), marginX, 21);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Paciente: ${input.patientName}`, pageWidth - marginX, 21, {
      align: 'right',
    });
  }

  // ==================== ENCABEZADO OFICIAL ESTILO CONTRERAS NUTRICIÓN FIT ====================
  pdf.setFillColor(15, 39, 32); // #0f2720
  pdf.rect(0, 0, pageWidth, 88, 'F');

  // Franja decorativa esmeralda sutil
  pdf.setFillColor(52, 211, 153); // #34d399
  pdf.rect(0, 86, pageWidth, 2.5, 'F');

  let headerTextX = marginX;
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', marginX, 14, 58, 58);
      headerTextX = marginX + 70;
    } catch {
      headerTextX = marginX;
    }
  }

  // Marca
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(52, 211, 153); // #34d399
  pdf.text(clinicName.toUpperCase(), headerTextX, 29);

  // Título limpio de la rutina
  const rawTitle = (input.routineTitle || 'Plan de Entrenamiento').split('•')[0].trim();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text(rawTitle.slice(0, 42), headerTextX, 50);

  // Datos del cliente: SOLO el nombre
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(226, 248, 238);
  pdf.text(`Paciente: ${input.patientName}`, headerTextX, 68);

  // Fecha discreta arriba a la derecha
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text(dateStr, pageWidth - marginX, 29, { align: 'right' });

  // Píldora limpia de frecuencia abajo a la derecha
  pdf.setFillColor(27, 67, 55); // #1b4337
  pdf.roundedRect(pageWidth - marginX - 96, 53, 96, 18, 9, 9, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.8);
  pdf.setTextColor(167, 243, 208);
  pdf.text(
    `${input.days.length} ${input.days.length === 1 ? 'Día / Semana' : 'Días / Semana'}`,
    pageWidth - marginX - 48,
    65,
    { align: 'center' }
  );

  let cursorY = 108;

  // ==================== GUÍA BREVE DE PROGRESIÓN Y RIR ====================
  pdf.setFillColor(248, 250, 252); // #f8fafc
  pdf.setDrawColor(226, 232, 240); // #e2e8f0
  pdf.setLineWidth(0.75);
  pdf.roundedRect(marginX, cursorY, contentWidth, 38, 6, 6, 'FD');

  // Acento lateral verde bosque
  pdf.setFillColor(27, 67, 55); // #1b4337
  pdf.roundedRect(marginX, cursorY, 4, 38, 2, 2, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 39, 32);
  pdf.text('GUÍA RÁPIDA DE EJECUCIÓN Y RIR', marginX + 14, cursorY + 14);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.6);
  pdf.setTextColor(71, 85, 105); // #475569
  pdf.text(
    'RIR = repeticiones que te quedan antes del fallo (ej. RIR 1-2 = termina sintiendo que podías hacer 1 o 2 más). Sube 1.25–2.5 kg al completar el rango.',
    marginX + 14,
    cursorY + 27
  );

  cursorY += 54;

  // ==================== DÍAS DE ENTRENAMIENTO ====================
  for (let dIdx = 0; dIdx < input.days.length; dIdx++) {
    const day = input.days[dIdx];
    const totalDaySets = day.exercises.reduce((acc, e) => acc + (Number(e.targetSets) || 0), 0);

    // Verificar espacio para cabecera del día + encabezados de tabla + al menos 1 fila
    if (cursorY + 92 > pageHeight - 44) {
      drawFooter(currentPage);
      pdf.addPage('a4', 'portrait');
      currentPage += 1;
      drawContinuationHeader();
      cursorY = 54;
    }

    // Cabecera elegante del Día
    pdf.setFillColor(27, 67, 55); // #1b4337
    pdf.roundedRect(marginX, cursorY, contentWidth, 26, 5, 5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text(day.name.toUpperCase(), marginX + 12, cursorY + 16.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(167, 243, 208);
    pdf.text(
      `${day.exercises.length} ejercicios  ·  ${totalDaySets} series`,
      pageWidth - marginX - 12,
      cursorY + 16.5,
      { align: 'right' }
    );

    cursorY += 32;

    // Columnas limpias con línea inferior sutil
    const colOrdX = marginX + 4;
    const colExX = marginX + 30;
    const colSetsX = marginX + 292;
    const colRirX = marginX + 362;
    const colRestX = marginX + 422;
    const colVideoX = pageWidth - marginX - 56;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.2);
    pdf.setTextColor(100, 116, 139); // #64748b
    pdf.text('#', colOrdX + 6, cursorY + 8);
    pdf.text('EJERCICIO', colExX, cursorY + 8);
    pdf.text('SERIES × REPS', colSetsX, cursorY + 8);
    pdf.text('RIR', colRirX, cursorY + 8);
    pdf.text('DESCANSO', colRestX, cursorY + 8);
    pdf.text('VIDEO', colVideoX + 28, cursorY + 8, { align: 'center' });

    pdf.setDrawColor(203, 213, 225); // #cbd5e1
    pdf.setLineWidth(0.75);
    pdf.line(marginX, cursorY + 13, pageWidth - marginX, cursorY + 13);

    cursorY += 15;

    // Filas de Ejercicios (estilo limpio editorial sin cajas pesadas)
    for (let eIdx = 0; eIdx < day.exercises.length; eIdx++) {
      const ex = day.exercises[eIdx];
      const hasNotes = Boolean(ex.coachNotes && ex.coachNotes.trim());
      const showMethodSub = ex.setMethod && ex.setMethod !== 'normal';
      const rowHeight = hasNotes ? 40 : 31;

      if (cursorY + rowHeight > pageHeight - 42) {
        drawFooter(currentPage);
        pdf.addPage('a4', 'portrait');
        currentPage += 1;
        drawContinuationHeader();
        cursorY = 54;
      }

      // Fondo muy sutil en filas impares
      if (eIdx % 2 === 1) {
        pdf.setFillColor(249, 250, 251); // #f9fafb
        pdf.rect(marginX, cursorY, contentWidth, rowHeight, 'F');
      }

      // Línea divisoria inferior fina
      pdf.setDrawColor(226, 232, 240); // #e2e8f0
      pdf.setLineWidth(0.5);
      pdf.line(marginX, cursorY + rowHeight, pageWidth - marginX, cursorY + rowHeight);

      // 1. Número de Orden o Biserie
      const orderTag = ex.supersetGroup ? `${ex.supersetGroup}${eIdx + 1}` : `${eIdx + 1}`;
      if (ex.supersetGroup) {
        pdf.setFillColor(243, 232, 255);
        pdf.roundedRect(colOrdX, cursorY + 7, 20, 16, 4, 4, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.8);
        pdf.setTextColor(107, 33, 168);
        pdf.text(orderTag, colOrdX + 10, cursorY + 17.5, { align: 'center' });
      } else {
        pdf.setFillColor(236, 253, 245); // #ecfdf5
        pdf.roundedRect(colOrdX, cursorY + 7, 20, 16, 4, 4, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.8);
        pdf.setTextColor(6, 95, 70);
        pdf.text(orderTag, colOrdX + 10, cursorY + 17.5, { align: 'center' });
      }

      // 2. Nombre del Ejercicio + Grupo Muscular
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.2);
      pdf.setTextColor(15, 23, 42); // #0f172a
      const biseriePrefix = ex.supersetGroup ? `[Biserie ${ex.supersetGroup}] ` : '';
      const displayExName = `${biseriePrefix}${ex.name}`.slice(0, 48);
      pdf.text(displayExName, colExX, cursorY + 13.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.4);
      pdf.setTextColor(100, 116, 139); // #64748b
      pdf.text(`${ex.muscleGroup}  ·  ${ex.equipment}`, colExX, cursorY + 23.5);

      if (hasNotes) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7.1);
        pdf.setTextColor(71, 85, 105);
        pdf.text(`Nota: ${ex.coachNotes!.trim().slice(0, 68)}`, colExX, cursorY + 34);
      }

      // 3. Series × Repeticiones
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.2);
      pdf.setTextColor(15, 39, 32);
      pdf.text(`${ex.targetSets} × ${ex.targetReps}`, colSetsX, cursorY + 17.5);

      // 4. RIR (y método solo si es técnica especial)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.2);
      pdf.setTextColor(51, 65, 85);
      pdf.text(ex.targetRir || 'RIR 1-2', colRirX, showMethodSub ? cursorY + 13.5 : cursorY + 17.5);

      if (showMethodSub) {
        const methodLabel = SET_METHOD_LABELS[ex.setMethod]?.label || '';
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.8);
        pdf.setTextColor(180, 83, 9);
        pdf.text(methodLabel.slice(0, 16), colRirX, cursorY + 23.5);
      }

      // 5. Descanso en Minutos
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.4);
      pdf.setTextColor(15, 118, 110);
      pdf.text(formatRestMinutes(ex.restSeconds), colRestX, cursorY + 17.5);

      // 6. Enlace elegante tipo píldora minimalista para Video en YouTube
      const targetVideoUrl =
        ex.videoUrl && ex.videoUrl.trim()
          ? ex.videoUrl.trim()
          : input.autoYoutubeFallback !== false
          ? getDefaultYoutubeSearchUrl(ex.name, ex.exerciseId)
          : '';

      if (targetVideoUrl) {
        const btnW = 56;
        const btnH = 16;
        const btnX = colVideoX;
        const btnY = cursorY + 7.5;

        pdf.setFillColor(236, 253, 245); // #ecfdf5
        pdf.setDrawColor(167, 243, 208); // #a7f3d0
        pdf.setLineWidth(0.75);
        pdf.roundedRect(btnX, btnY, btnW, btnH, 8, 8, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        pdf.setTextColor(6, 95, 70); // #065f46
        pdf.text('▶ Ver video', btnX + btnW / 2, btnY + 10.5, { align: 'center' });

        pdf.link(btnX, btnY, btnW, btnH, { url: targetVideoUrl });
        pdf.link(colExX, cursorY + 4, 245, 15, { url: targetVideoUrl });
      }

      cursorY += rowHeight;
    }

    cursorY += 18;
  }

  drawFooter(currentPage);

  const safeSlug = (input.patientName || 'Paciente')
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  pdf.save(`Rutina_Entrenamiento_${safeSlug}.pdf`);
}
