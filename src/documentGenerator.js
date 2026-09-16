// Generador de Diapositivas tipo PowerPoint / Canva (16:9)
// Formato Verde Oscuro Profundo (Forest Dark), réplica exacta del PDF con tabla de alimentos en 1 sola hoja
import { calculateMacros } from './calculator.js';

export function generateDocumentHTML({
  patientName = 'Génesis Ortiz',
  goal = 'Superávit Limpio / Recomposición',
  weightKg = 55,
  date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
  portions = { starch: 9, protein: 9, fat: 11, fruit: 2, dairy: 1 },
  meals = [],
  notes = '',
  clinicName = ''
}) {
  const macros = calculateMacros(portions, weightKg);

  // Valores de comidas asignadas dinámicamente
  const m1 = meals[0]?.portions || { starch: 3, protein: 3, fat: 3, fruit: 1, dairy: 0 };
  const m2 = meals[1]?.portions || { starch: 3, protein: 3, fat: 3, fruit: 0, dairy: 0 };
  const m3 = meals[2]?.portions || { starch: 3, protein: 3, fat: 3, fruit: 0, dairy: 0 };
  const m4 = meals[3]?.portions || { starch: 0, protein: 0, fat: 2, fruit: 1, dairy: 1 };

  return `
    <div class="slides-deck" id="printable-diet-document">

      <!-- SLIDE 1: PORTADA OFICIAL CONTRERAS NUTRICION FIT -->
      <section class="slide-card slide-cover">
        <div class="slide-cover-inner">
          <div class="brand-image-logo-wrapper">
            <img src="/logo_contreras_transparent.png" alt="Contreras Nutricion Fit" class="brand-image-logo" />
          </div>
          <div class="cover-doc-date">${date}</div>
        </div>
      </section>

      <!-- SLIDE 2: RESUMEN DE MACRONUTRIENTES Y CALORÍAS (VERDE OSCURO PROFUNDO) -->
      <section class="slide-card slide-forest-dark slide-macros-summary">
        <div class="slide-content-split">
          <div class="slide-left-col">
            <h1 class="slide-script-title">Plan de alimentación</h1>
            <div class="slide-patient-tag">Paciente: <strong>${patientName}</strong> (${weightKg} kg)</div>
            
            <div class="slide-calories-bubble">
              <span class="bubble-num">${macros.totalCalories.toLocaleString()}</span>
              <span class="bubble-unit">kcal totales diarias</span>
            </div>

            <div class="slide-bars-container">
              <div class="macro-pill-bar">
                <span class="mp-value">${macros.totalProtein} g</span>
                <span class="mp-label">PROTEÍNAS</span>
                <span class="mp-ratio">${macros.ratios.proteinPerKg} g/kg</span>
              </div>
              <div class="macro-pill-bar">
                <span class="mp-value">${macros.totalFat} g</span>
                <span class="mp-label">GRASAS</span>
                <span class="mp-ratio">${macros.ratios.fatPerKg} g/kg</span>
              </div>
              <div class="macro-pill-bar">
                <span class="mp-value">${macros.totalCarbs} g</span>
                <span class="mp-label">CARBOHIDRATOS</span>
                <span class="mp-ratio">${macros.ratios.carbsPerKg} g/kg</span>
              </div>
            </div>
          </div>

          <div class="slide-right-col-side">
            <div class="totals-pill-box">
              <div class="tpb-title">RESUMEN DEL DÍA</div>
              <div class="tpb-item"><span>Lácteos:</span> <strong>${portions.dairy}</strong></div>
              <div class="tpb-item"><span>Frutas:</span> <strong>${portions.fruit}</strong></div>
              <div class="tpb-item"><span>Almidones:</span> <strong>${portions.starch}</strong></div>
              <div class="tpb-item"><span>Proteínas:</span> <strong>${portions.protein}</strong></div>
              <div class="tpb-item"><span>Grasas:</span> <strong>${portions.fat}</strong></div>
              <div class="tpb-divider"></div>
              <div class="tpb-item tpb-highlight"><span>Total Porciones:</span> <strong>${macros.totalPortions}</strong></div>
            </div>
          </div>
        </div>
        <div class="slide-bottom-brand">© ${clinicName} • Guía de Equivalencias Nutricionales</div>
      </section>

      <!-- SLIDE 3: PAUTAS GENERALES Y REGLAS DE ORO (PÁG 3 DEL PDF) -->
      <section class="slide-card slide-white">
        <div class="food-slide-header">
          <h2 class="slide-page-title-dark">PAUTAS GENERALES Y REGLAS DE ORO</h2>
          <span class="slide-page-badge">Directrices clave para tu adherencia y digestión</span>
        </div>

        <div class="rules-two-columns">
          <div class="rules-column">
            <div class="rule-point">
              <div class="rule-diamond">❖</div>
              <div class="rule-body">
                <strong>TODOS LOS ALIMENTOS DE LA LISTA SE MIDEN YA COCIDOS</strong>
                <p>A excepción de la avena en hojuelas, que se debe pesar cruda.</p>
              </div>
            </div>
            <div class="rule-point">
              <div class="rule-diamond">❖</div>
              <div class="rule-body">
                <strong>PRIORIZA EL CONSUMO DE AGUA</strong>
                <p>Mantén un mínimo de 35 a 40 ml por kg de peso. Las bebidas sin calorías son válidas, pero no reemplazan el agua.</p>
              </div>
            </div>
            <div class="rule-point">
              <div class="rule-diamond">❖</div>
              <div class="rule-body">
                <strong>PUEDES UTILIZAR EDULCORANTES SIN CALORÍAS</strong>
                <p>Stevia, monkfruit, splenda o truvia son permitidos.</p>
              </div>
            </div>
            <div class="rule-point">
              <div class="rule-diamond">❖</div>
              <div class="rule-body">
                <strong>EVITAR EL CONSUMO DE AZÚCARES AÑADIDOS</strong>
                <p>Evita azúcar blanco, moreno, panela, miel o jarabes calóricos.</p>
              </div>
            </div>
            <div class="rule-point">
              <div class="rule-diamond">❖</div>
              <div class="rule-body">
                <strong>REDUCE LAS PREPARACIONES FRITAS</strong>
                <p>Cocina a la plancha, al vapor, horneado o en el airfryer con tu grasa medida.</p>
              </div>
            </div>
            <div class="rule-point">
              <div class="rule-diamond">❖</div>
              <div class="rule-body">
                <strong>SI NO PUEDES HACER MUCHAS COMIDAS</strong>
                <p>Puedes unir porciones (ej: juntar merienda con cena) o moverlas entre comidas.</p>
              </div>
            </div>
          </div>

          <div class="rules-column">
            <div class="rule-point">
              <div class="rule-diamond">❖</div>
              <div class="rule-body">
                <strong>ENTRENAR TEMPRANO EN LAS MAÑANAS</strong>
                <p>Si entrenas en ayunas y te sienta bien, adelante; sino, consume 1 fruta 20min antes.</p>
              </div>
            </div>
            <div class="rule-point">
              <div class="rule-diamond">❖</div>
              <div class="rule-body">
                <strong>SUPLEMENTO DE OMEGA 3</strong>
                <p>Si no consumes suficiente pescado graso a la semana, toma 1000-2000 mg de Omega 3.</p>
              </div>
            </div>
            <div class="rule-point">
              <div class="rule-diamond">❖</div>
              <div class="rule-body">
                <strong>TOMA DE LUZ SOLAR Y VITAMINA D</strong>
                <p>Al menos 20-30 min al día. De no ser posible, suplementa 2000 UI de Vitamina D3 con grasa.</p>
              </div>
            </div>
            <div class="rule-point">
              <div class="rule-diamond">❖</div>
              <div class="rule-body">
                <strong>DEBES AGREGAR VEGETALES</strong>
                <p>Permitidos en cualquier cantidad. Además de saciedad, son excelente fuente de fibra.</p>
              </div>
            </div>
            <div class="rule-point">
              <div class="rule-diamond">❖</div>
              <div class="rule-body">
                <strong>EVALUACIÓN CADA DOS SEMANAS</strong>
                <p>Compara fotos de control, medidas y energía digestiva para seguir progresando.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="slide-bottom-brand">© ${clinicName} • Guía de Equivalencias Nutricionales</div>
      </section>

      <!-- SLIDE 4: PLAN DE COMIDAS & LISTA DE PORCIONES EN UNA SOLA HOJA (RÉPLICA EXACTA PÁG 4 PDF) -->
      <section class="slide-card slide-split-compact">
        <!-- Columna Izquierda: PLAN DE COMIDAS (Verde Bosque Oscuro) -->
        <div class="plan-compact-sidebar">
          <h2 class="sidebar-title-compact">PLAN DE COMIDAS</h2>

          <div class="meal-mini-block">
            <div class="mmb-name">❖ COMIDA 1 (Desayuno)</div>
            <div class="mmb-list">
              ${m1.starch > 0 ? `<div class="mmb-item"><span class="dot dot-yellow"></span> <strong>${m1.starch}</strong> Porciones de Almidones</div>` : ''}
              ${m1.protein > 0 ? `<div class="mmb-item"><span class="dot dot-blue"></span> <strong>${m1.protein}</strong> Porciones de Proteínas</div>` : ''}
              ${m1.fat > 0 ? `<div class="mmb-item"><span class="dot dot-green"></span> <strong>${m1.fat}</strong> Porciones de Grasas</div>` : ''}
              ${m1.fruit > 0 ? `<div class="mmb-item"><span class="dot dot-red"></span> <strong>${m1.fruit}</strong> Porción de Frutas</div>` : ''}
              ${m1.dairy > 0 ? `<div class="mmb-item"><span class="dot dot-cyan"></span> <strong>${m1.dairy}</strong> Porción de Lácteos</div>` : ''}
            </div>
          </div>

          <div class="meal-mini-block">
            <div class="mmb-name">❖ COMIDA 2 (Almuerzo)</div>
            <div class="mmb-list">
              ${m2.starch > 0 ? `<div class="mmb-item"><span class="dot dot-yellow"></span> <strong>${m2.starch}</strong> Porciones de Almidones</div>` : ''}
              ${m2.protein > 0 ? `<div class="mmb-item"><span class="dot dot-blue"></span> <strong>${m2.protein}</strong> Porciones de Proteínas</div>` : ''}
              ${m2.fat > 0 ? `<div class="mmb-item"><span class="dot dot-green"></span> <strong>${m2.fat}</strong> Porciones de Grasas</div>` : ''}
              ${m2.fruit > 0 ? `<div class="mmb-item"><span class="dot dot-red"></span> <strong>${m2.fruit}</strong> Porción de Frutas</div>` : ''}
            </div>
          </div>

          <div class="meal-mini-block">
            <div class="mmb-name">❖ COMIDA 3 (Cena)</div>
            <div class="mmb-list">
              ${m3.starch > 0 ? `<div class="mmb-item"><span class="dot dot-yellow"></span> <strong>${m3.starch}</strong> Porciones de Almidones</div>` : ''}
              ${m3.protein > 0 ? `<div class="mmb-item"><span class="dot dot-blue"></span> <strong>${m3.protein}</strong> Porciones de Proteínas</div>` : ''}
              ${m3.fat > 0 ? `<div class="mmb-item"><span class="dot dot-green"></span> <strong>${m3.fat}</strong> Porciones de Grasas</div>` : ''}
              ${m3.fruit > 0 ? `<div class="mmb-item"><span class="dot dot-red"></span> <strong>${m3.fruit}</strong> Porción de Frutas</div>` : ''}
            </div>
          </div>

          <div class="meal-mini-block">
            <div class="mmb-name">❖ MERIENDA</div>
            <div class="mmb-list">
              ${m4.fruit > 0 ? `<div class="mmb-item"><span class="dot dot-red"></span> <strong>${m4.fruit}</strong> Porción de Frutas</div>` : ''}
              ${m4.dairy > 0 ? `<div class="mmb-item"><span class="dot dot-cyan"></span> <strong>${m4.dairy}</strong> Porción de Lácteos</div>` : ''}
              ${m4.fat > 0 ? `<div class="mmb-item"><span class="dot dot-green"></span> <strong>${m4.fat}</strong> Porción de Grasas</div>` : ''}
              ${m4.starch > 0 ? `<div class="mmb-item"><span class="dot dot-yellow"></span> <strong>${m4.starch}</strong> Porciones de Almidones</div>` : ''}
              ${m4.protein > 0 ? `<div class="mmb-item"><span class="dot dot-blue"></span> <strong>${m4.protein}</strong> Porciones de Proteínas</div>` : ''}
              </div>
          </div>

          <div class="powder-protein-box">
            <strong>NOTA:</strong> Esta distribucion es solo una sugerencia, si lo deseas puedes cambiarla a tu gusto A lo que mas se ajuste a tu dia a dia.
          </div>
        </div>

        <!-- Columna Derecha: TABLA COMPLETA DE ALIMENTOS EN 1 SOLA HOJA (SIN SCROLLBARS) -->
        <div class="table-compact-content">
          <!-- Cabecera de la tabla y leyenda explícita -->
          <div class="tcc-header">
            <div class="tcc-title-wrap">
              <span class="tcc-title">LISTA DE PORCIONES</span>
              <span class="tcc-subtitle">1 PORCIÓN EQUIVALE A:</span>
            </div>
            <div class="tcc-legend-chips">
              <span class="chip-legend chip-green">🟢 CON MAYOR FRECUENCIA</span>
              <span class="chip-legend chip-amber">🟡 CON MENOR FRECUENCIA</span>
              <span class="chip-legend chip-blue">🔵 PARA UNTAR</span>
            </div>
          </div>

          <!-- Cuadrícula de 2 columnas de alimentos que cabe al 100% -->
          <div class="tcc-columns-grid">
            <!-- Subcolumna 1: Vegetales, Lácteos, Frutas, Proteínas -->
            <div class="tcc-col">
              <div class="tcc-group">
                <div class="tcc-gtitle color-green">❖ VEGETALES (Libres)</div>
                <div class="tcc-gbody">
                  <div class="tcc-row">1/2 Taza de vegetales cocidos.</div>
                  <div class="tcc-row">1 Taza de vegetales crudos al gusto.</div>
                </div>
              </div>

              <div class="tcc-group">
                <div class="tcc-gtitle color-cyan">❖ LÁCTEOS</div>
                <div class="tcc-gbody">
                  <div class="tcc-row">240ml (1 tz) Leche descremada.</div>
                  <div class="tcc-row">240ml (1 tz) Bebida de soya.</div>
                  <div class="tcc-row">200ml Kéfir líquido.</div>
                  <div class="tcc-row">150g Yogurt descremado o griego sin azúcar.</div>
                </div>
              </div>

              <div class="tcc-group">
                <div class="tcc-gtitle color-red">❖ FRUTAS (1 Fruta = 1 Almidón)</div>
                <div class="tcc-gbody">
                  <div class="tcc-row">90g (1/2 und) Cambur / banana.</div>
                  <div class="tcc-row">1 und. Manzana, pera, kiwi, naranja o durazno.</div>
                  <div class="tcc-row">180g (1 tz) Fresas frescas.</div>
                  <div class="tcc-row">100g (3/4 tz) Arándanos o piña.</div>
                  <div class="tcc-row">200g (2 tz) Papaya, melón o sandía.</div>
                  <div class="tcc-row">90g Uvas frescas (12 a 15 und).</div>
                </div>
              </div>

              <div class="tcc-group">
                <div class="tcc-gtitle color-blue">❖ PROTEÍNAS (Pesar cocidas)</div>
                <div class="tcc-gbody">
                  <div class="tcc-row">1 und Huevo entero o 2 claras. (considerar restar 1 porcion de grasa, por cada 2 huevos enteros).</div>
                  <div class="tcc-row">30g Pechuga de pollo o pavo sin piel.</div>
                  <div class="tcc-row">30g Pescado blanco, salmón o mariscos.</div>
                  <div class="tcc-row">30g Atún en lata (al natural).</div>
                  <div class="tcc-row">30g Lomo de cerdo magro o carne de res sin grasa. </div>
                  <div class="tcc-row">50g (1/4 tz) Queso cottage descremado.</div>
                  <div class="tcc-row">30g Quesos blanco llanero (sumar 1 de grasas).</div>
                  <div class="tcc-row">50g Quesos ricotta.(sumar 1 de grasas segun tabla nutricional).</div>
                  <div class="tcc-row">40g Jamon ahumado.</div>
                  <div class="tcc-subrow color-purple">• Vegetal: 100g tofu / 15g soja text. (seco) / 35g tempeh.</div>
                  <div class="tcc-subrow color-purple">• De no ser carne magra, sumar 1 porcion de grasas por cada 2 porciones de proteinas.</div>
                </div>
              </div>
            </div>

            <!-- Subcolumna 2: Almidones y Grasas -->
            <div class="tcc-col">
              <div class="tcc-group">
                <div class="tcc-gtitle color-orange">❖ ALMIDONES</div>
                <div class="tcc-gbody">
                  <div class="tcc-tag-label tag-green">🟢 MAYOR FRECUENCIA:</div>
                  <div class="tcc-row"><strong>40g</strong> (1 und peq) Arepa.</div>
                  <div class="tcc-row"><strong>20g</strong> (2 cdas) Avena (pesar cruda).</div>
                  <div class="tcc-row"><strong>80g</strong> (1/2 tz) Arroz blanco o integral.</div>
                  <div class="tcc-row"><strong>100g</strong> (1 und peq) Papa cocida u horno.</div>
                  <div class="tcc-row"><strong>65g</strong> Batata u Ocumo / <strong>60g</strong> Yuca o apio.</div>
                  <div class="tcc-row"><strong>70g</strong> Ñame.</div>
                  <div class="tcc-row"><strong>70g</strong> (1/2 tz) Pasta cocida.</div>
                  <div class="tcc-row"><strong>50g</strong> (1/4 und) Plátano verde o maduro.</div>
                  <div class="tcc-row"><strong>30g</strong> (1 rebanada) Pan integral.</div>
                  <div class="tcc-row"><strong>40g</strong> (1/4 tz) Quinoa cocida.</div>
                  <div class="tcc-row"><strong>3 und</strong> Galletas de arroz inflado.</div>
                  <div class="tcc-row"><strong>25g</strong> (3 tz) Cotufas / palomitas sin grasa.</div>
                  <div class="tcc-row"><strong>50g</strong> (1/4 tz) Leguminosas cocidas.</div>

                  <div class="tcc-tag-label tag-amber" style="margin-top: 4px;">🟡 MENOR FRECUENCIA:</div>
                  <div class="tcc-row text-muted-food">20g (1 cda) mermelada o miel / 20g granola.</div>
                  <div class="tcc-row text-muted-food">25g cereal en hojuelas / 30g galletas maría.</div>
                </div>
              </div>

              <div class="tcc-group">
                <div class="tcc-gtitle color-fat">❖ GRASAS</div>
                <div class="tcc-gbody">
                  <div class="tcc-tag-label tag-green">🟢 MAYOR FRECUENCIA:</div>
                  <div class="tcc-row"><strong>5g</strong> (1 cdta) Aceite de oliva o aguacate.</div>
                  <div class="tcc-row"><strong>30g</strong> (2 cdas) Aguacate o aceitunas.</div>
                  <div class="tcc-row"><strong>10g</strong> (2 cdtas) Mantequilla maní / almendras.</div>
                  <div class="tcc-row"><strong>8g</strong> Frutos secos (almendras, nueces, maní).</div>
                  <div class="tcc-row"><strong>10g</strong> (1 cda) Linaza o chía molida.</div>
                  <div class="tcc-row"><strong>240ml</strong> (1 tz) Bebida de almendras.</div>

                  <div class="tcc-tag-label tag-blue" style="margin-top: 4px;">🔵 PARA UNTAR / OCASIONAL:</div>
                  <div class="tcc-row text-muted-food">5g aceite maíz / 10g mayonesa / 2 cdas coco rallado.</div>
                  <div class="tcc-row text-muted-food">2 tiras tocineta / 5g mantequilla / 15g queso amarillo.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SLIDE 6: EJEMPLO DE DESAYUNO (PÁG 6 DEL PDF) -->
      <section class="slide-card slide-white slide-meal-example">
        <div class="example-split-layout">
          <div class="example-visual-side">
            <h2 class="example-title">Ejemplo de desayuno</h2>
            <div class="plate-illustration-box">
              <svg viewBox="0 0 400 360" class="plate-svg-large">
                <!-- Bebida -->
                <circle cx="340" cy="80" r="34" fill="#d1fae5" stroke="#059669" stroke-width="2"/>
                <ellipse cx="340" cy="80" rx="26" ry="18" fill="#78350f" opacity="0.6"/>
                <text x="340" y="75" text-anchor="middle" font-size="8" font-weight="bold" fill="#065f46">AGUA, CAFÉ,</text>
                <text x="340" y="86" text-anchor="middle" font-size="8" font-weight="bold" fill="#065f46">TÉ O INFUSIÓN</text>
                <text x="340" y="97" text-anchor="middle" font-size="7" fill="#065f46">SIN AZÚCAR</text>

                <!-- Plato redondo -->
                <circle cx="180" cy="180" r="140" fill="#f8fafc" stroke="#cbd5e1" stroke-width="5"/>
                <circle cx="180" cy="180" r="120" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>

                <!-- Proteína -->
                <path d="M 180 180 L 65 140 A 120 120 0 0 1 295 140 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
                <text x="180" y="115" text-anchor="middle" font-size="14" font-weight="800" fill="#1e3a8a">
                  ${m1.protein} PROTEÍNAS
                </text>
                <text x="180" y="132" text-anchor="middle" font-size="9" fill="#854d0e">Huevos / Queso / Jamón</text>

                <!-- Almidón -->
                <path d="M 180 180 L 295 140 A 120 120 0 0 1 180 300 Z" fill="#fed7aa" stroke="#c2410c" stroke-width="2"/>
                <text x="235" y="215" text-anchor="middle" font-size="13" font-weight="800" fill="#9a3412">
                  ${m1.starch} ALMIDONES
                </text>
                <text x="235" y="232" text-anchor="middle" font-size="9" fill="#7c2d12">Pan / Arepa / Avena</text>

                <!-- Grasas -->
                <path d="M 180 180 L 180 300 A 120 120 0 0 1 65 140 Z" fill="#bbf7d0" stroke="#15803d" stroke-width="2"/>
                <text x="125" y="215" text-anchor="middle" font-size="13" font-weight="800" fill="#166534">
                  ${m1.fat} GRASAS
                </text>
                <text x="125" y="232" text-anchor="middle" font-size="9" fill="#14532d">Aguacate / Mantequilla</text>

                <!-- Fruta -->
                <circle cx="280" cy="300" r="32" fill="#fca5a5" stroke="#dc2626" stroke-width="2"/>
                <text x="280" y="298" text-anchor="middle" font-size="9" font-weight="800" fill="#991b1b">
                  ${m1.fruit} FRUTA
                </text>
                <text x="280" y="310" text-anchor="middle" font-size="8" fill="#7f1d1d">Fresas / Manzana</text>
              </svg>
            </div>
          </div>

          <div class="example-options-side">
            <h3 class="options-headline">ESCOGE 1 OPCIÓN DE CADA GRUPO:</h3>

            <div class="opt-group-box">
              <h4 class="og-title text-blue">${m1.protein} PROTEÍNAS:</h4>
              <ul class="og-bullets">
                <li>${m1.protein} huevos enteros o ${m1.protein * 2} claras de huevo revueltas.</li>
                <li>${m1.protein} rebanadas de jamón magro + ${m1.protein} rebanadas de queso bajo en grasa.</li>
                <li>${m1.protein * 25}g (${(m1.protein * 0.25).toFixed(1)} tazas) de queso cottage descremado.</li>
                <li>${m1.protein * 30} gramos (${m1.protein * 2} cdas) de pechuga de pollo, pavo o lomo magro.</li>
              </ul>
            </div>

            <div class="opt-group-box">
              <h4 class="og-title text-orange">${m1.starch} ALMIDONES:</h4>
              <ul class="og-bullets">
                <li>${m1.starch} rebanadas de pan tostado (integral o blanco).</li>
                <li>${(m1.starch * 0.5).toFixed(1)} tazas de avena cocida (${m1.starch * 20}g en seco).</li>
                <li>1 arepa mediana de ${m1.starch * 40} gramos.</li>
                <li>${(m1.starch * 0.25).toFixed(1)} unidad de plátano verde o maduro (${m1.starch * 50}g).</li>
              </ul>
            </div>

            <div class="opt-group-box">
              <h4 class="og-title text-green">${m1.fat} GRASAS:</h4>
              <ul class="og-bullets">
                <li>${m1.fat} cucharaditas de aceite de oliva o mantequilla.</li>
                <li>${m1.fat * 15}g (${m1.fat >= 2 ? '1/4 a 1/2' : '1/4'} aguacate) o ${m1.fat * 2} cdtas mantequilla de maní/almendras.</li>
                <li>${m1.fat} rebanadas finas de tocineta crocante sin freír en aceite.</li>
              </ul>
            </div>

            ${m1.fruit > 0 ? `
              <div class="opt-group-box">
                <h4 class="og-title text-red">${m1.fruit} PORCIÓN DE FRUTA:</h4>
                <ul class="og-bullets">
                  <li>1 unidad mediana de manzana, pera, kiwi o naranja fresca.</li>
                  <li>1 taza colmada de fresas picadas o 1/2 banana grande.</li>
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="slide-bottom-brand">© ${clinicName} • Guía de Equivalencias Nutricionales</div>
      </section>

      <!-- SLIDE 7: EJEMPLO DE ALMUERZO O CENA (PÁG 7 DEL PDF) -->
      <section class="slide-card slide-white slide-meal-example">
        <div class="example-split-layout">
          <div class="example-visual-side">
            <h2 class="example-title">Ejemplo de almuerzo o cena</h2>
            <div class="plate-illustration-box">
              <svg viewBox="0 0 400 360" class="plate-svg-large">
                <!-- Vaso de agua -->
                <polygon points="325,45 355,45 350,110 330,110" fill="#bfdbfe" stroke="#3b82f6" stroke-width="2"/>
                <text x="340" y="75" text-anchor="middle" font-size="7" font-weight="bold" fill="#1e40af">AGUA O TÉ</text>
                <text x="340" y="85" text-anchor="middle" font-size="6" fill="#1e40af">SIN AZÚCAR</text>

                <!-- Plato redondo -->
                <circle cx="180" cy="180" r="140" fill="#f8fafc" stroke="#cbd5e1" stroke-width="5"/>
                <circle cx="180" cy="180" r="120" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>

                <!-- Vegetales libres (50%) -->
                <path d="M 180 180 L 180 60 A 120 120 0 0 0 180 300 Z" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
                <text x="120" y="165" text-anchor="middle" font-size="14" font-weight="800" fill="#15803d">VEGETALES</text>
                <text x="120" y="185" text-anchor="middle" font-size="13" font-weight="800" fill="#15803d">LIBRES</text>
                <text x="120" y="202" text-anchor="middle" font-size="8" fill="#166534">Crudos o cocidos al gusto</text>

                <!-- Proteína (25%) -->
                <path d="M 180 180 L 180 60 A 120 120 0 0 1 300 180 Z" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
                <text x="240" y="125" text-anchor="middle" font-size="13" font-weight="800" fill="#1d4ed8">
                  ${m2.protein} PROTEÍNAS
                </text>
                <text x="240" y="142" text-anchor="middle" font-size="8" fill="#1e40af">Pechuga / Pescado / Lomo</text>

                <!-- Almidón (25%) -->
                <path d="M 180 180 L 300 180 A 120 120 0 0 1 180 300 Z" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
                <text x="240" y="235" text-anchor="middle" font-size="13" font-weight="800" fill="#b45309">
                  ${m2.starch} ALMIDONES
                </text>
                <text x="240" y="252" text-anchor="middle" font-size="8" fill="#92400e">Arroz / Papa / Pasta</text>

                <!-- Grasa / Aguacate -->
                <ellipse cx="60" cy="100" rx="28" ry="38" fill="#bbf7d0" stroke="#15803d" stroke-width="2"/>
                <ellipse cx="60" cy="100" rx="14" ry="18" fill="#78350f" opacity="0.4"/>
                <text x="60" y="98" text-anchor="middle" font-size="9" font-weight="800" fill="#14532d">
                  ${m2.fat} GRASAS
                </text>
                <text x="60" y="110" text-anchor="middle" font-size="7" fill="#14532d">Aguacate / Aceite</text>
              </svg>
            </div>
          </div>

          <div class="example-options-side">
            <h3 class="options-headline">ESCOGE 1 OPCIÓN DE CADA GRUPO:</h3>

            <div class="opt-group-box">
              <h4 class="og-title text-blue">${m2.protein} PROTEÍNAS:</h4>
              <p class="og-subhint">${m2.protein * 30} GRAMOS (Aprox. 2 palmas de tu mano sin los dedos):</p>
              <ul class="og-bullets">
                <li>Pechuga de pollo o pavo a la plancha.</li>
                <li>Filete de pescado blanco o azul (salmón, merluza, atún).</li>
                <li>Lomo de cerdo magro sin grasa visible.</li>
                <li>Carne de res magra a la plancha o al horno.</li>
              </ul>
            </div>

            <div class="opt-group-box">
              <h4 class="og-title text-orange">${m2.starch} ALMIDONES:</h4>
              <ul class="og-bullets">
                <li>${(m2.starch * 0.5).toFixed(1)} tazas de arroz cocido (${m2.starch * 80}g).</li>
                <li>${(m2.starch * 0.5).toFixed(1)} tazas de pasta cocida (${m2.starch * 70}g).</li>
                <li>${m2.starch * 100}g de papas cocidas o al horno (${m2.starch >= 3 ? '2 a 3 medianas' : '1 a 2 pequeñas'}).</li>
                <li>${(m2.starch * 0.25).toFixed(1)} unidad de plátano horneado (${m2.starch * 50}g).</li>
              </ul>
            </div>

            <div class="opt-group-box">
              <h4 class="og-title text-green">${m2.fat} GRASAS:</h4>
              <ul class="og-bullets">
                <li>${m2.fat} cucharaditas de aceite de oliva virgen extra en la ensalada.</li>
                <li>${m2.fat * 15}g de aguacate fresco (aprox. 1/4 a 1/2 unidad).</li>
                <li>${m2.fat * 2} cucharadas de aderezo vinagreta casera ligera.</li>
              </ul>
            </div>

            <div class="opt-group-box">
              <h4 class="og-title text-emerald">VEGETALES LIBRES:</h4>
              <ul class="og-bullets">
                <li>Ensalada verde abundante o vegetales al vapor al gusto (lechuga, tomate, pepino, brócoli, espinacas).</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="slide-bottom-brand">© ${clinicName} • Guía de Equivalencias Nutricionales</div>
      </section>

      <!-- SLIDE 8: IDEAS PARA LA MERIENDA (PÁG 8 DEL PDF) -->
      <section class="slide-card slide-white">
        <h2 class="slide-page-title-dark" style="text-align: center; margin-bottom: 14px;">IDEAS PARA LA MERIENDA</h2>

        <div class="snack-three-cols">
          <div class="snack-col-card">
            <div class="scc-header">
              <span class="scc-num">1 PORCIÓN DE FRUTA</span>
              <span class="scc-sub">Elegir 1 opción</span>
            </div>
            <div class="scc-icon-art">🍎 🍌 🫐</div>
            <ul class="scc-list">
              <li>1/2 und. de cambur grande.</li>
              <li>1 und. de manzana, pera, kiwi, naranja o mandarina.</li>
              <li>2 und. de durazno pequeño.</li>
              <li>3/4 tz. de arándanos, piña o mora.</li>
              <li>1 tz. de fresas frescas picadas.</li>
            </ul>
            <div class="scc-note">
              <strong>NOTA:</strong> Puedes cambiar esta fruta por 1 almidón (granola, galleta maría).
            </div>
          </div>

          <div class="snack-col-sep">+</div>

          <div class="snack-col-card">
            <div class="scc-header">
              <span class="scc-num">1 PORCIÓN DE LÁCTEO</span>
              <span class="scc-sub">Elegir 1 opción</span>
            </div>
            <div class="scc-icon-art">🥛 🥣 ☕</div>
            <ul class="scc-list">
              <li>150g o 1 yogurt pequeño (descremado, sin azúcar).</li>
              <li>1 taza de leche descremada.</li>
              <li>1 taza de bebida de soya sin azúcar.</li>
              <li>200ml de kéfir natural líquido.</li>
            </ul>
            <div class="scc-note">
              <strong>VÁLIDO:</strong> Hacer café con leche o cambiar por postre ocasional pequeño.
            </div>
          </div>

          <div class="snack-col-sep">+</div>

          <div class="snack-col-card">
            <div class="scc-header">
              <span class="scc-num">1 PORCIÓN DE GRASA</span>
              <span class="scc-sub">Elegir 1 opción</span>
            </div>
            <div class="scc-icon-art">🍫 🥜 🥑</div>
            <ul class="scc-list">
              <li>10g o 2 cuadritos de chocolate oscuro 70%.</li>
              <li>8g de maní, almendras, nueces o pistachos.</li>
              <li>10g (2 cdtas) mantequilla de maní o almendras.</li>
              <li>1 cucharada (15g) de queso crema light.</li>
              <li>1 taza de leche de almendras.</li>
            </ul>
            <div class="scc-note">
              <strong>NOTA:</strong> Si no usas esta grasa aquí, muévela al almuerzo o cena.
            </div>
          </div>
        </div>

        <div class="slide-bottom-brand">© ${clinicName} • Guía de Equivalencias Nutricionales</div>
      </section>

      <!-- SLIDE 9: OTRAS IDEAS DE MERIENDA & EQUIVALENCIAS (PÁG 9 DEL PDF) -->
      <section class="slide-card slide-white">
        <h2 class="slide-page-title-dark" style="text-align: center; margin-bottom: 12px;">OTRAS IDEAS DE MERIENDA</h2>

        <div class="snack-combos-box">
          <div class="combo-group">
            <h4 class="combo-title">1 porción de frutas + 1 porción de lácteos + 1 porción de grasas:</h4>
            <div class="combo-two-col">
              <p>• ½ unidad de banana + 1 yogurt descremado + 8g de maní sin concha.</p>
              <p>• Merengada con 1 taza de fresas + 1 taza de leche descremada + 10g chocolate oscuro.</p>
              <p>• 1 manzana picada con dip de 1 yogurt descremado + 10g mantequilla de maní.</p>
              <p>• Bowl de 1 yogurt descremado + 8g de almendras + ¾ tz de arándanos.</p>
            </div>
          </div>

          <div class="combo-group" style="margin-top: 8px;">
            <h4 class="combo-title">1 porción de almidón + 1 porción de lácteos + 1 porción de grasas:</h4>
            <div class="combo-two-col">
              <p>• Café con leche (1 tz leche descremada) + 1 rebanada de pan + 2 cdtas mantequilla maní.</p>
              <p>• 1 yogurt descremado + 8g de maní + 20g de granola.</p>
              <p>• 1 taza de leche descremada + 2 o 3 galletas de arroz inflado + 2 cdtas mantequilla almendras.</p>
              <p>• Café con leche descremada + 1 paquete de galletas maría sin azúcar.</p>
            </div>
          </div>

          <div class="combo-group" style="margin-top: 8px;">
            <h4 class="combo-title">2 porciones de almidones + 1 porción de proteínas + 1 porción de grasas:</h4>
            <div class="combo-two-col">
              <p>• 2 rebanadas pan tostado + 1 rebanada de jamón + 1 queso + 1 cdta margarina.</p>
              <p>• 2 rebanadas pan tostado + 1 huevo tipo frito sin aceite + 30g aguacate.</p>
              <p>• 4 galletas de arroz inflado + 2 rebanadas de salmón ahumado + 1 cda queso crema.</p>
              <p>• 2 rebanadas pan tostado + 2 rebanadas mozzarella light + tomate + 1 cda pesto.</p>
            </div>
          </div>
        </div>

        <div class="equivalencies-footer-box">
          <span class="efb-title">Equivalencias Oficiales:</span>
          <span><strong>1 lácteo</strong> = 1 almidón + 1 proteína.</span>
          <span><strong>1 fruta</strong> = 1 almidón.</span>
          <span><strong>1 scoop proteína</strong> = 3 porciones de proteína.</span>
        </div>

        <div class="slide-bottom-brand">© ${clinicName} • Guía de Equivalencias Nutricionales</div>
      </section>

    </div>
  `;
}
