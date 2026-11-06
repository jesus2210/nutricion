// LAYER: Interface / PDF Export
// Generador de PDF Vertical (A4 Portrait) estilo Contreras Nutrición Fit con enlaces clicables a YouTube

import {
  WorkoutDay,
  TrainingLevel,
  TRAINING_LEVEL_LABELS,
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
  autoYoutubeFallback?: boolean; // Si un ejercicio no tiene link manual, enlaza a su guía en YouTube
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
  const marginX = 28;
  const contentWidth = pageWidth - marginX * 2;

  const clinicName = input.clinicName || 'Contreras Nutrición Fit';
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const levelInfo = TRAINING_LEVEL_LABELS[input.level || 'intermediate'];

  const logoDataUrl = await loadImageAsDataUrl('/logo_contreras_transparent.png');

  let currentPage = 1;

  function drawFooter(pageNum: number) {
    pdf.setFillColor(15, 39, 32); // #0f2720
    pdf.rect(0, pageHeight - 28, pageWidth, 28, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(167, 243, 208); // #a7f3d0
    pdf.text(
      `© ${clinicName} • Planificación de Entrenamiento & Sobrecarga Progresiva`,
      marginX,
      pageHeight - 11
    );

    pdf.setFont('helvetica', 'normal');
    pdf.text(`Página ${pageNum}`, pageWidth - marginX, pageHeight - 11, {
      align: 'right',
    });
  }

  // ==================== ENCABEZADO OFICIAL ESTILO CONTRERAS NUTRICIÓN FIT ====================
  // Fondo Verde Bosque Oscuro
  pdf.setFillColor(15, 39, 32); // #0f2720
  pdf.rect(0, 0, pageWidth, 122, 'F');

  // Franja decorativa esmeralda
  pdf.setFillColor(52, 211, 153); // #34d399
  pdf.rect(0, 119, pageWidth, 3, 'F');

  // Logo si está disponible
  let headerTextX = marginX;
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', marginX, 14, 86, 86);
      headerTextX = marginX + 98;
    } catch {
      headerTextX = marginX;
    }
  }

  // Marca y Título Principal
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(52, 211, 153); // #34d399
  pdf.text(clinicName.toUpperCase(), headerTextX, 28);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.setTextColor(255, 255, 255);
  const cleanTitle = input.routineTitle || 'Plan de Entrenamiento Personalizado';
  pdf.text(cleanTitle.slice(0, 48), headerTextX, 49);

  // Tarjeta de Datos del Paciente dentro del Header
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(209, 250, 229);
  const weightTag = input.weightKg ? ` (${input.weightKg} kg)` : '';
  pdf.text(`Paciente: ${input.patientName}${weightTag}`, headerTextX, 68);
  pdf.text(`Objetivo: ${input.routineGoal}`, headerTextX, 83);

  // Píldoras de Nivel, Frecuencia y Fecha
  pdf.setFillColor(27, 67, 55); // #1b4337
  pdf.roundedRect(headerTextX, 91, 145, 18, 4, 4, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(167, 243, 208);
  pdf.text(`❖ Nivel: ${levelInfo.shortLabel.toUpperCase()}`, headerTextX + 8, 103);

  pdf.setFillColor(27, 67, 55);
  pdf.roundedRect(headerTextX + 152, 91, 118, 18, 4, 4, 'F');
  pdf.text(`❖ Frecuencia: ${input.days.length} Días/Sem`, headerTextX + 160, 103);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text(dateStr, pageWidth - marginX, 28, { align: 'right' });

  let cursorY = 136;

  // ==================== REGLAS DE ORO DE PROGRESIÓN Y RIR ====================
  pdf.setFillColor(240, 253, 244); // #f0fdf4
  pdf.setDrawColor(187, 247, 208); // #bbf7d0
  pdf.roundedRect(marginX, cursorY, contentWidth, 52, 6, 6, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(20, 83, 45); // #14532d
  pdf.text(
    '❖ PAUTAS DE SOBRECARGA PROGRESIVA & SIGNIFICADO DEL RIR:',
    marginX + 10,
    cursorY + 15
  );

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.8);
  pdf.setTextColor(22, 101, 52);
  pdf.text(
    '• RIR (Repeticiones en Recámara): RIR 2 = podrías hacer 2 reps más antes del fallo | RIR 1 = a 1 rep del fallo | RIR 0 = fallo técnico.',
    marginX + 10,
    cursorY + 29
  );
  pdf.text(
    '• Cuando logres el tope de repeticiones pautadas en todas tus series con buena técnica, sube entre 1.25 kg y 2.5 kg la siguiente semana.',
    marginX + 10,
    cursorY + 41
  );

  cursorY += 64;

  // ==================== ITERAR CADA DÍA DE ENTRENAMIENTO ====================
  for (let dIdx = 0; dIdx < input.days.length; dIdx++) {
    const day = input.days[dIdx];
    const totalDaySets = day.exercises.reduce((acc, e) => acc + (Number(e.targetSets) || 0), 0);

    // Verificar si cabe la cabecera del día + al menos 1 ejercicio en la página actual
    if (cursorY + 95 > pageHeight - 40) {
      drawFooter(currentPage);
      pdf.addPage('a4', 'portrait');
      currentPage += 1;
      cursorY = 30;
    }

    // Cabecera del Día (Verde Bosque #1b4337)
    pdf.setFillColor(27, 67, 55); // #1b4337
    pdf.roundedRect(marginX, cursorY, contentWidth, 28, 5, 5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(day.name.toUpperCase(), marginX + 10, cursorY + 13);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(167, 243, 208);
    pdf.text(
      `Enfoque: ${day.focus || 'General'}  •  ${day.exercises.length} ejercicios (${totalDaySets} series efectivas)`,
      marginX + 10,
      cursorY + 23
    );

    cursorY += 32;

    // Cabecera de Columnas de la Tabla del Día
    pdf.setFillColor(241, 245, 249); // #f1f5f9
    pdf.rect(marginX, cursorY, contentWidth, 18, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85); // #334155

    const colOrdX = marginX + 6;
    const colExX = marginX + 34;
    const colSetsX = marginX + 290;
    const colRirX = marginX + 360;
    const colRestX = marginX + 425;
    const colVideoX = marginX + 478;

    pdf.text('#', colOrdX, cursorY + 12);
    pdf.text('EJERCICIO / PAUTA TÉCNICA & VARIANTES', colExX, cursorY + 12);
    pdf.text('SERIES × REPS', colSetsX, cursorY + 12);
    pdf.text('RIR / MÉTODO', colRirX, cursorY + 12);
    pdf.text('DESCANSO', colRestX, cursorY + 12);
    pdf.text('VIDEO GUÍA', colVideoX, cursorY + 12);

    cursorY += 20;

    // Filas de Ejercicios
    for (let eIdx = 0; eIdx < day.exercises.length; eIdx++) {
      const ex = day.exercises[eIdx];

      // Calcular altura dinámica de la fila según si tiene notas o variante alternativa
      let extraLines = 0;
      if (ex.alternativeExercise && ex.alternativeExercise.trim()) extraLines += 1;
      if (ex.coachNotes && ex.coachNotes.trim()) extraLines += 1;
      const rowHeight = 28 + extraLines * 11;

      if (cursorY + rowHeight > pageHeight - 38) {
        drawFooter(currentPage);
        pdf.addPage('a4', 'portrait');
        currentPage += 1;
        cursorY = 30;
      }

      // Fondo alternado de la fila
      if (eIdx % 2 === 0) {
        pdf.setFillColor(255, 255, 255);
      } else {
        pdf.setFillColor(248, 250, 252); // #f8fafc
      }
      pdf.setDrawColor(226, 232, 240); // #e2e8f0
      pdf.rect(marginX, cursorY, contentWidth, rowHeight, 'FD');

      // 1. Número de Orden o Etiqueta de Biserie
      const orderTag = ex.supersetGroup ? `${ex.supersetGroup}${eIdx + 1}` : `${eIdx + 1}`;
      if (ex.supersetGroup) {
        pdf.setFillColor(243, 232, 255); // morado suave para biseries
        pdf.roundedRect(colOrdX - 2, cursorY + 6, 22, 15, 3, 3, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(107, 33, 168);
        pdf.text(orderTag, colOrdX + 9, cursorY + 16, { align: 'center' });
      } else {
        pdf.setFillColor(209, 250, 229); // #d1fae5
        pdf.roundedRect(colOrdX - 2, cursorY + 6, 20, 15, 3, 3, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(6, 95, 70);
        pdf.text(orderTag, colOrdX + 8, cursorY + 16, { align: 'center' });
      }

      // 2. Nombre del Ejercicio, Grupo Muscular y Equipo
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(15, 23, 42); // #0f172a
      const biseriePrefix = ex.supersetGroup ? `[Biserie ${ex.supersetGroup}] ` : '';
      const displayExName = `${biseriePrefix}${ex.name}`.slice(0, 48);
      pdf.text(displayExName, colExX, cursorY + 13);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139); // #64748b
      pdf.text(`${ex.muscleGroup} • ${ex.equipment}`, colExX, cursorY + 23);

      let subLineY = cursorY + 33;
      if (ex.alternativeExercise && ex.alternativeExercise.trim()) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        pdf.setTextColor(3, 105, 161); // #0369a1
        pdf.text(
          `Variante / Alternativa: ${ex.alternativeExercise.trim().slice(0, 58)}`,
          colExX,
          subLineY
        );
        subLineY += 11;
      }

      if (ex.coachNotes && ex.coachNotes.trim()) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7.2);
        pdf.setTextColor(71, 85, 105);
        pdf.text(`Nota: ${ex.coachNotes.trim().slice(0, 65)}`, colExX, subLineY);
      }

      // 3. Series x Repeticiones
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(15, 39, 32);
      pdf.text(`${ex.targetSets} × ${ex.targetReps}`, colSetsX, cursorY + 16);

      // 4. RIR y Método de Intensidad
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.2);
      pdf.setTextColor(180, 83, 9); // Ámbar oscuro legible
      pdf.text(ex.targetRir || 'RIR 1-2', colRirX, cursorY + 13);

      const methodLabel =
        SET_METHOD_LABELS[ex.setMethod || 'normal']?.label || 'Serie Efectiva';
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text(methodLabel.slice(0, 16), colRirX, cursorY + 23);

      // 5. Descanso en Minutos
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 118, 110); // Teal
      pdf.text(formatRestMinutes(ex.restSeconds), colRestX, cursorY + 16);

      // 6. Botón Clicable de Video en YouTube
      const targetVideoUrl =
        ex.videoUrl && ex.videoUrl.trim()
          ? ex.videoUrl.trim()
          : input.autoYoutubeFallback !== false
          ? getDefaultYoutubeSearchUrl(ex.name)
          : '';

      if (targetVideoUrl) {
        const btnW = 54;
        const btnH = 16;
        const btnX = colVideoX;
        const btnY = cursorY + 6;

        // Fondo del botón estilo YouTube / Contreras Fit
        pdf.setFillColor(220, 38, 38); // Rojo YouTube #dc2626
        pdf.roundedRect(btnX, btnY, btnW, btnH, 3, 3, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(255, 255, 255);
        pdf.text('▶ VER VIDEO', btnX + btnW / 2, btnY + 10.5, { align: 'center' });

        // Anotación interactiva clicable en el PDF (redirige directo al hacer clic)
        pdf.link(btnX, btnY, btnW, btnH, { url: targetVideoUrl });
        // También hacer clicable el título del ejercicio
        pdf.link(colExX, cursorY + 3, 240, 16, { url: targetVideoUrl });
      }

      cursorY += rowHeight;
    }

    cursorY += 16;
  }

  drawFooter(currentPage);

  const safeSlug = (input.patientName || 'Paciente')
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  pdf.save(`Rutina_Entrenamiento_${safeSlug}.pdf`);
}

