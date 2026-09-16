import { PORTION_VALUES, PRESETS, FOOD_DATABASE } from './constants.js';
import { calculateMacros, solveOptimalPortions, autoDistributeMeals } from './calculator.js';
import { generateDocumentHTML } from './documentGenerator.js';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Estado global de la aplicación
const state = {
  patientName: 'Génesis Ortiz',
  weightKg: 55,
  goal: 'Superávit Limpio (Hipertrofia)',
  clinicName: 'Jesus Contreras',
  notes: 'Disminución estratégica de carbohidratos fermentables y aumento de grasas saludables para protección del colon irritable.',
  portions: {
    starch: 9,
    protein: 9,
    fat: 11,
    fruit: 2,
    dairy: 1
  },
  meals: [],
  activeTab: 'editor',
  catalogSearch: '',
  catalogCategory: 'all'
};

// Inicialización de comidas
state.meals = autoDistributeMeals(state.portions);

/**
 * Inicialización al cargar el DOM
 */
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupPresets();
  setupPortionControls();
  setupPatientInputs();
  setupOptimizer();
  setupMealDistribution();
  setupCatalog();
  setupExportActions();

  // Primer renderizado
  updateAllMetrics();
  renderMealDistribution();
  renderCatalog();
});

/**
 * Gestión de pestañas (Tabs)
 */
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  const btnGotoPreview = document.getElementById('btn-goto-preview');
  if (btnGotoPreview) {
    btnGotoPreview.addEventListener('click', () => switchTab('preview'));
  }

  const btnBackEditor = document.getElementById('btn-back-to-editor');
  if (btnBackEditor) {
    btnBackEditor.addEventListener('click', () => switchTab('editor'));
  }
}

function switchTab(tabName) {
  state.activeTab = tabName;

  // Actualizar botones de pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  // Mostrar el panel activo
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `view-${tabName}`);
  });

  // Si abrimos la vista previa, renderizamos el documento fresco
  if (tabName === 'preview') {
    renderDocumentPreview();
  }

  // Si abrimos catálogo, aseguramos renderizado
  if (tabName === 'catalog') {
    renderCatalog();
  }
}

/**
 * Cargar y configurar presets
 */
function setupPresets() {
  const selectPreset = document.getElementById('select-preset');
  if (!selectPreset) return;

  PRESETS.forEach(preset => {
    const opt = document.createElement('option');
    opt.value = preset.id;
    opt.textContent = preset.name;
    selectPreset.appendChild(opt);
  });

  selectPreset.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    if (selectedId === 'custom') return;

    const preset = PRESETS.find(p => p.id === selectedId);
    if (!preset) return;

    // Cargar datos del preset
    state.weightKg = preset.weightKg || state.weightKg;
    state.portions = { ...preset.portions };
    state.notes = preset.notes || '';

    // Sincronizar inputs en la UI
    document.getElementById('input-weight').value = state.weightKg;
    document.getElementById('input-portion-starch').value = state.portions.starch;
    document.getElementById('input-portion-protein').value = state.portions.protein;
    document.getElementById('input-portion-fat').value = state.portions.fat;
    document.getElementById('input-portion-fruit').value = state.portions.fruit;
    document.getElementById('input-portion-dairy').value = state.portions.dairy;
    document.getElementById('input-patient-notes').value = state.notes;

    // Distribuir en comidas automáticamente
    state.meals = autoDistributeMeals(state.portions);
    renderMealDistribution();

    updateAllMetrics();

    // Pequeña animación festiva al cargar preset
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 }
    });
  });
}

/**
 * Controles de Porciones (+ / - y teclado)
 */
function onPortionsChanged() {
  state.meals = autoDistributeMeals(state.portions);
  renderMealDistribution();
  updateAllMetrics();
  if (state.activeTab === 'preview') {
    renderDocumentPreview();
  }
}

function setupPortionControls() {
  const portionTypes = ['starch', 'protein', 'fat', 'fruit', 'dairy'];

  portionTypes.forEach(type => {
    const input = document.getElementById(`input-portion-${type}`);
    const minusBtn = document.querySelector(`.step-minus[data-portion="${type}"]`);
    const plusBtn = document.querySelector(`.step-plus[data-portion="${type}"]`);

    if (input) {
      input.addEventListener('input', () => {
        state.portions[type] = Math.max(0, parseInt(input.value) || 0);
        onPortionsChanged();
      });
    }

    if (minusBtn) {
      minusBtn.addEventListener('click', () => {
        state.portions[type] = Math.max(0, state.portions[type] - 1);
        if (input) input.value = state.portions[type];
        onPortionsChanged();
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener('click', () => {
        state.portions[type] = state.portions[type] + 1;
        if (input) input.value = state.portions[type];
        onPortionsChanged();
      });
    }
  });
}

/**
 * Inputs de Paciente
 */
function setupPatientInputs() {
  const nameInput = document.getElementById('input-patient-name');
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      state.patientName = e.target.value.trim() || 'Paciente';
    });
  }

  const weightInput = document.getElementById('input-weight');
  if (weightInput) {
    weightInput.addEventListener('input', (e) => {
      state.weightKg = Math.max(20, parseFloat(e.target.value) || 55);
      updateAllMetrics();
    });
  }

  const goalSelect = document.getElementById('input-goal');
  if (goalSelect) {
    goalSelect.addEventListener('change', (e) => {
      state.goal = e.target.value;
    });
  }

  const clinicInput = document.getElementById('input-clinic-name');
  if (clinicInput) {
    clinicInput.addEventListener('input', (e) => {
      state.clinicName = e.target.value.trim() || 'Jesús Contreras';
    });
  }
  const nameNutriElem = document.getElementById('name-nutritionist');
  if (nameNutriElem) {
    state.clinicName = nameNutriElem.textContent.trim() || 'Jesús Contreras';
  }

  const notesInput = document.getElementById('input-patient-notes');
  if (notesInput) {
    notesInput.addEventListener('input', (e) => {
      state.notes = e.target.value.trim();
    });
  }
}

/**
 * Optimizador Inteligente (Auto-Solver)
 */
function setupOptimizer() {
  const slider = document.getElementById('slider-target-kcal');
  const display = document.getElementById('opt-kcal-display');
  const checkIBS = document.getElementById('check-ibs-mode');
  const btnSolve = document.getElementById('btn-auto-solve');

  if (slider && display) {
    slider.addEventListener('input', (e) => {
      display.textContent = `${e.target.value} kcal`;
    });
  }

  if (btnSolve) {
    btnSolve.addEventListener('click', () => {
      const targetCalories = parseInt(slider.value) || 2000;
      const preferHighFat = checkIBS ? checkIBS.checked : false;

      const solved = solveOptimalPortions({
        targetCalories,
        weightKg: state.weightKg,
        preferHighFat
      });

      state.portions = { ...solved };

      // Sincronizar inputs
      document.getElementById('input-portion-starch').value = state.portions.starch;
      document.getElementById('input-portion-protein').value = state.portions.protein;
      document.getElementById('input-portion-fat').value = state.portions.fat;
      document.getElementById('input-portion-fruit').value = state.portions.fruit;
      document.getElementById('input-portion-dairy').value = state.portions.dairy;

      // Actualizar comidas
      state.meals = autoDistributeMeals(state.portions);
      renderMealDistribution();

      updateAllMetrics();

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 }
      });
    });
  }
}

/**
 * Configuración de Distribución por Comidas
 */
function setupMealDistribution() {
  const btnAutoDistribute = document.getElementById('btn-auto-distribute-meals');
  if (btnAutoDistribute) {
    btnAutoDistribute.addEventListener('click', () => {
      state.meals = autoDistributeMeals(state.portions);
      renderMealDistribution();
    });
  }
}

function renderMealDistribution() {
  const container = document.getElementById('meals-builder-list');
  if (!container) return;

  container.innerHTML = '';

  state.meals.forEach((meal, mealIdx) => {
    const card = document.createElement('div');
    card.className = 'meal-row-card';

    card.innerHTML = `
      <div class="meal-row-name">${meal.name}</div>
      <div class="meal-row-portions">
        <div class="mini-portion-control" title="Almidones">
          <span>🌾 Alm:</span>
          <input type="number" min="0" max="15" value="${meal.portions.starch}" data-meal-idx="${mealIdx}" data-type="starch" class="meal-portion-input" />
        </div>
        <div class="mini-portion-control" title="Proteínas">
          <span>🍗 Prot:</span>
          <input type="number" min="0" max="15" value="${meal.portions.protein}" data-meal-idx="${mealIdx}" data-type="protein" class="meal-portion-input" />
        </div>
        <div class="mini-portion-control" title="Grasas">
          <span>🥑 Gra:</span>
          <input type="number" min="0" max="15" value="${meal.portions.fat}" data-meal-idx="${mealIdx}" data-type="fat" class="meal-portion-input" />
        </div>
        <div class="mini-portion-control" title="Frutas">
          <span>🍎 Fru:</span>
          <input type="number" min="0" max="10" value="${meal.portions.fruit}" data-meal-idx="${mealIdx}" data-type="fruit" class="meal-portion-input" />
        </div>
        <div class="mini-portion-control" title="Lácteos">
          <span>🥛 Lác:</span>
          <input type="number" min="0" max="5" value="${meal.portions.dairy}" data-meal-idx="${mealIdx}" data-type="dairy" class="meal-portion-input" />
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // Listeners para los inputs de cada comida
  container.querySelectorAll('.meal-portion-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const mealIdx = parseInt(e.target.getAttribute('data-meal-idx'));
      const type = e.target.getAttribute('data-type');
      const val = Math.max(0, parseInt(e.target.value) || 0);

      state.meals[mealIdx].portions[type] = val;
      if (state.activeTab === 'preview') {
        renderDocumentPreview();
      }
    });
  });
}

/**
 * Actualiza todas las métricas en vivo (calorías, carbos, proteínas, grasas y alertas)
 */
function updateAllMetrics() {
  const macros = calculateMacros(state.portions, state.weightKg);

  // Calorías totales
  const calElem = document.getElementById('metric-total-calories');
  if (calElem) calElem.textContent = macros.totalCalories.toLocaleString();

  // Carbohidratos
  const carbsElem = document.getElementById('metric-total-carbs');
  if (carbsElem) carbsElem.textContent = `${macros.totalCarbs} g`;
  const carbsKg = document.getElementById('metric-carbs-kg');
  if (carbsKg) carbsKg.textContent = `${macros.ratios.carbsPerKg} g/kg`;
  const carbsPct = document.getElementById('metric-carbs-pct');
  if (carbsPct) carbsPct.textContent = `${macros.percentages.carbs}% de kcal`;
  const barCarbs = document.getElementById('bar-carbs');
  if (barCarbs) barCarbs.style.width = `${macros.percentages.carbs}%`;

  // Proteínas
  const protElem = document.getElementById('metric-total-protein');
  if (protElem) protElem.textContent = `${macros.totalProtein} g`;
  const protKg = document.getElementById('metric-protein-kg');
  if (protKg) protKg.textContent = `${macros.ratios.proteinPerKg} g/kg`;
  const protPct = document.getElementById('metric-protein-pct');
  if (protPct) protPct.textContent = `${macros.percentages.protein}% de kcal`;
  const barProt = document.getElementById('bar-protein');
  if (barProt) barProt.style.width = `${macros.percentages.protein}%`;

  // Grasas
  const fatElem = document.getElementById('metric-total-fat');
  if (fatElem) fatElem.textContent = `${macros.totalFat} g`;
  const fatKg = document.getElementById('metric-fat-kg');
  if (fatKg) fatKg.textContent = `${macros.ratios.fatPerKg} g/kg`;
  const fatPct = document.getElementById('metric-fat-pct');
  if (fatPct) fatPct.textContent = `${macros.percentages.fat}% de kcal`;
  const barFat = document.getElementById('bar-fat');
  if (barFat) barFat.style.width = `${macros.percentages.fat}%`;

  // Total de porciones
  const totalPortionsBadge = document.getElementById('total-portions-count-badge');
  if (totalPortionsBadge) {
    totalPortionsBadge.textContent = `${macros.totalPortions} Porciones`;
  }

  // Resumen en las tarjetas individuales
  updatePortionCardSummaries();

  // Alertas clínicas inteligentes
  updateClinicalAlerts(macros);
}

function updatePortionCardSummaries() {
  const p = state.portions;

  const sumStarch = document.getElementById('sum-starch');
  if (sumStarch) {
    const c = (p.starch * PORTION_VALUES.STARCH.carbs).toFixed(1);
    const pr = (p.starch * PORTION_VALUES.STARCH.protein).toFixed(1);
    const cal = Math.round(p.starch * PORTION_VALUES.STARCH.calories);
    sumStarch.textContent = `${c}g C • ${pr}g P • ${cal} kcal`;
  }

  const sumProtein = document.getElementById('sum-protein');
  if (sumProtein) {
    const pr = (p.protein * PORTION_VALUES.PROTEIN.protein).toFixed(1);
    const f = (p.protein * PORTION_VALUES.PROTEIN.fat).toFixed(1);
    const cal = Math.round(p.protein * PORTION_VALUES.PROTEIN.calories);
    sumProtein.textContent = `0g C • ${pr}g P • ${cal} kcal`;
  }

  const sumFat = document.getElementById('sum-fat');
  if (sumFat) {
    const f = (p.fat * PORTION_VALUES.FAT.fat).toFixed(1);
    const cal = Math.round(p.fat * PORTION_VALUES.FAT.calories);
    sumFat.textContent = `0g C • 0g P • ${cal} kcal`;
  }

  const sumFruit = document.getElementById('sum-fruit');
  if (sumFruit) {
    const c = (p.fruit * PORTION_VALUES.FRUIT.carbs).toFixed(1);
    const pr = (p.fruit * PORTION_VALUES.FRUIT.protein).toFixed(1);
    const cal = Math.round(p.fruit * PORTION_VALUES.FRUIT.calories);
    sumFruit.textContent = `${c}g C • ${pr}g P • ${cal} kcal`;
  }

  const sumDairy = document.getElementById('sum-dairy');
  if (sumDairy) {
    const c = (p.dairy * PORTION_VALUES.DAIRY.carbs).toFixed(1);
    const pr = (p.dairy * PORTION_VALUES.DAIRY.protein).toFixed(1);
    const cal = Math.round(p.dairy * PORTION_VALUES.DAIRY.calories);
    sumDairy.textContent = `${c}g C • ${pr}g P • ${cal} kcal`;
  }
}

function updateClinicalAlerts(macros) {
  const container = document.getElementById('nutrition-status-alerts');
  if (!container) return;

  const alerts = [];

  // Verificación de Proteína
  if (macros.ratios.proteinPerKg >= 1.6) {
    alerts.push({
      type: 'alert-success',
      icon: '✅',
      text: `<strong>Proteína óptima (${macros.ratios.proteinPerKg} g/kg):</strong> Garantiza la síntesis proteica y el mantenimiento o crecimiento muscular.`
    });
  } else {
    alerts.push({
      type: 'alert-warning',
      icon: '⚠️',
      text: `<strong>Proteína baja (${macros.ratios.proteinPerKg} g/kg):</strong> Se recomienda al menos 1.6 g/kg para hipertrofia o recomposición.`
    });
  }

  // Verificación de Grasas
  if (macros.ratios.fatPerKg >= 1.0) {
    alerts.push({
      type: 'alert-success',
      icon: '✅',
      text: `<strong>Grasas protectoras (${macros.ratios.fatPerKg} g/kg):</strong> Adecuadas para la salud hormonal, articular y absorción de vitaminas.`
    });
  } else {
    alerts.push({
      type: 'alert-warning',
      icon: '⚠️',
      text: `<strong>Grasas por debajo de 1.0 g/kg (${macros.ratios.fatPerKg} g/kg):</strong> Vigilar no recortar demasiado para no alterar el entorno hormonal.`
    });
  }

  // Alerta Digestiva si las grasas superan los 80g
  if (state.portions.fat >= 10) {
    alerts.push({
      type: 'alert-info',
      icon: '💡',
      text: `<strong>Perfil Colon Irritable / Bajo Volumen:</strong> Menos fermentación de almidones y mayor densidad calórica sin inflamación.`
    });
  }

  container.innerHTML = alerts.map(a => `
    <div class="status-alert ${a.type}">
      <span>${a.icon}</span>
      <div>${a.text}</div>
    </div>
  `).join('');
}

/**
 * Renderizado del Documento Imprimible
 */
function renderDocumentPreview() {
  const target = document.getElementById('document-render-target');
  if (!target) return;

  const docHTML = generateDocumentHTML({
    patientName: state.patientName,
    goal: state.goal,
    weightKg: state.weightKg,
    clinicName: state.clinicName,
    portions: state.portions,
    meals: state.meals,
    notes: state.notes
  });

  target.innerHTML = docHTML;
}

/**
 * Configuración del Catálogo de Alimentos
 */
function setupCatalog() {
  const searchInput = document.getElementById('catalog-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.catalogSearch = e.target.value.toLowerCase().trim();
      renderCatalog();
    });
  }

  const filterButtons = document.querySelectorAll('.filter-tag');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.catalogCategory = btn.getAttribute('data-cat');
      renderCatalog();
    });
  });
}

function renderCatalog() {
  const container = document.getElementById('catalog-cards-container');
  if (!container) return;

  const allItems = [];

  // Almidones
  FOOD_DATABASE.almidones.highFrequency.forEach(item => {
    allItems.push({ ...item, category: 'almidones', catLabel: 'Almidón (Frecuente)' });
  });
  FOOD_DATABASE.almidones.lowFrequency.forEach(item => {
    allItems.push({ ...item, category: 'almidones', catLabel: 'Almidón (Ocasional)' });
  });

  // Proteínas
  FOOD_DATABASE.proteinas.highFrequency.forEach(item => {
    allItems.push({ ...item, category: 'proteinas', catLabel: 'Proteína Animal' });
  });
  FOOD_DATABASE.proteinas.vegetarian.forEach(item => {
    allItems.push({ ...item, category: 'proteinas', catLabel: 'Proteína Vegetal' });
  });

  // Grasas
  FOOD_DATABASE.grasas.highFrequency.forEach(item => {
    allItems.push({ ...item, category: 'grasas', catLabel: 'Grasa Saludable' });
  });
  FOOD_DATABASE.grasas.lowFrequency.forEach(item => {
    allItems.push({ ...item, category: 'grasas', catLabel: 'Grasa Ocasional' });
  });

  // Frutas
  FOOD_DATABASE.frutas.items.forEach(item => {
    allItems.push({ ...item, category: 'frutas', catLabel: 'Fruta Fresca' });
  });

  // Lácteos
  FOOD_DATABASE.lacteos.items.forEach(item => {
    allItems.push({ ...item, category: 'lacteos', catLabel: 'Lácteo / Bebida' });
  });

  // Filtrado
  const filtered = allItems.filter(item => {
    const matchesCategory = state.catalogCategory === 'all' || item.category === state.catalogCategory;
    const matchesSearch = !state.catalogSearch ||
      item.name.toLowerCase().includes(state.catalogSearch) ||
      item.detail.toLowerCase().includes(state.catalogSearch);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No se encontraron alimentos que coincidan con la búsqueda.</div>`;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="food-item-card">
      <div class="food-card-cat" style="color: ${getCategoryColor(item.category)}">${item.catLabel}</div>
      <div class="food-card-name">${item.name}</div>
      <div class="food-card-portion">${item.amount}</div>
      <div class="food-card-detail">${item.detail}</div>
    </div>
  `).join('');
}

function getCategoryColor(cat) {
  switch (cat) {
    case 'almidones': return '#f59e0b';
    case 'proteinas': return '#3b82f6';
    case 'grasas': return '#10b981';
    case 'frutas': return '#ef4444';
    case 'lacteos': return '#8b5cf6';
    default: return '#10b981';
  }
}

/**
 * Acciones de Exportación
 */
function setupExportActions() {
  const btnExportNav = document.getElementById('btn-export-pdf');
  const btnPrintAction = document.getElementById('btn-print-action');
  const btnDownloadNav = document.getElementById('btn-download-pdf-nav');
  const btnDownloadPreview = document.getElementById('btn-download-pdf-preview');

  // Función de descarga directa PDF (HD) - 100% Full Bleed, sin bordes blancos ni esquinas redondeadas
  const handleDownloadHD = async (triggerBtn) => {
    renderDocumentPreview();
    switchTab('preview');

    const container = document.getElementById('printable-diet-document');
    if (!container) return;

    const slides = container.querySelectorAll('.slide-card');
    if (!slides || slides.length === 0) return;

    const originalText = triggerBtn ? triggerBtn.innerHTML : '';
    if (triggerBtn) {
      triggerBtn.innerHTML = '⏳ Preparando PDF...';
      triggerBtn.disabled = true;
    }

    try {
      // Asegurar carga completa de todas las imágenes antes de capturar el PDF
      const images = Array.from(container.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Breve pausa para asegurar renderizado del DOM tras cambio de pestaña
      await new Promise(resolve => setTimeout(resolve, 100));

      // Formato de diapositiva 16:9 exacto (960pt x 540pt, idéntico al PDF de referencia)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: [960, 540],
        compress: true
      });

      for (let i = 0; i < slides.length; i++) {
        if (triggerBtn) {
          triggerBtn.innerHTML = `⏳ Diapositiva ${i + 1} de ${slides.length}...`;
        }

        const slide = slides[i];

        // Forzar dimensiones 1040x585 (16:9 exacto), esquinas rectas y sin sombras para captura 100% limpia
        const prevStyles = {
          width: slide.style.width,
          height: slide.style.height,
          minHeight: slide.style.minHeight,
          maxHeight: slide.style.maxHeight,
          borderRadius: slide.style.borderRadius,
          boxShadow: slide.style.boxShadow
        };

        slide.style.width = '1040px';
        slide.style.height = '585px';
        slide.style.minHeight = '585px';
        slide.style.maxHeight = '585px';
        slide.style.borderRadius = '0px';
        slide.style.boxShadow = 'none';

        const canvas = await html2canvas(slide, {
          scale: 2, // Alta definición nítida (2080 x 1170 px)
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 1040,
          height: 585
        });

        // Restaurar estilos
        slide.style.width = prevStyles.width;
        slide.style.height = prevStyles.height;
        slide.style.minHeight = prevStyles.minHeight;
        slide.style.maxHeight = prevStyles.maxHeight;
        slide.style.borderRadius = prevStyles.borderRadius;
        slide.style.boxShadow = prevStyles.boxShadow;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage([960, 540], 'landscape');
        }

        // Insertar imagen cubriendo exactamente 960x540 pt en proporción 16:9 perfecta (0.00% distorsión)
        pdf.addImage(imgData, 'JPEG', 0, 0, 960, 540, undefined, 'FAST');
      }

      const patientSlug = (state.patientName || 'Paciente').replace(/\s+/g, '_');
      pdf.save(`Plan_Alimentacion_${patientSlug}_${state.goal}.pdf`);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Error generando PDF en HD:', err);
      // Fallback a impresión nativa
      window.print();
    } finally {
      if (triggerBtn) {
        triggerBtn.innerHTML = originalText;
        triggerBtn.disabled = false;
      }
    }
  };

  // Función de impresión con diálogo del navegador (estilos @page A4 landscape 297x210mm)
  const handlePrint = () => {
    renderDocumentPreview();
    switchTab('preview');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  if (btnDownloadNav) {
    btnDownloadNav.addEventListener('click', () => handleDownloadHD(btnDownloadNav));
  }
  if (btnDownloadPreview) {
    btnDownloadPreview.addEventListener('click', () => handleDownloadHD(btnDownloadPreview));
  }

  if (btnExportNav) btnExportNav.addEventListener('click', handlePrint);
  if (btnPrintAction) btnPrintAction.addEventListener('click', handlePrint);
}
