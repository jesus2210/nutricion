---
name: security-layer
description: >
  Audita el código fuente de un proyecto buscando vulnerabilidades de seguridad, incluyendo
  exposición de secretos, configuraciones CORS inseguras, falta de rate limiting, inyecciones
  (SQL, NoSQL, comandos), autenticación débil, dependencias con CVEs conocidos y datos sensibles
  en logs. Úsala siempre que el usuario mencione: "auditoría de seguridad", "revisar seguridad",
  "buscar vulnerabilidades", "hardening", "pentest", "CORS abierto", ".env expuesto", "secrets
  en el código", o cuando pida revisar un proyecto completo antes de desplegarlo a producción.
  También actívala si el usuario menciona que algo "no debería estar expuesto" o pregunta si
  su configuración es segura.
license: MIT
---

# Security Layer — Auditoría de Seguridad

## Propósito

Realizar una auditoría sistemática del código fuente para detectar vulnerabilidades, malas
prácticas de seguridad y configuraciones riesgosas. El resultado es un reporte priorizado
con hallazgos accionables.

---

## Paso 1 — Reconocimiento del proyecto

Antes de auditar, mapea la superficie de ataque:

```
src/              → lógica de negocio, rutas, controladores
config/           → configuraciones de entorno y servicios
.env, .env.*      → variables de entorno (NO deben tener secretos hardcodeados)
package.json      → dependencias (versiones con CVEs conocidos)
docker-compose.*  → puertos expuestos, volúmenes, variables en claro
Dockerfile        → usuario root, capas innecesarias, secretos en ARG/ENV
middleware/       → autenticación, CORS, rate limiting
```

Si el proyecto no tiene estructura estándar, busca los archivos de entrada principal
(`main.py`, `app.js`, `index.ts`, `server.go`, etc.).

---

## Paso 2 — Checklist de Vulnerabilidades

Revisa **todas** las categorías. No saltes ninguna aunque parezca irrelevante.

### 🔴 CRÍTICO

| # | Qué buscar | Señales de riesgo |
|---|------------|-------------------|
| C1 | **Secretos hardcodeados** | API keys, passwords, tokens en `.env` commiteados, en código fuente o en `docker-compose.yml` |
| C2 | **CORS wildcard en producción** | `Access-Control-Allow-Origin: *` + credenciales habilitadas |
| C3 | **Inyección SQL / NoSQL** | Concatenación de strings en queries, ausencia de ORM o parámetros preparados |
| C4 | **Ejecución de comandos del sistema** | `exec()`, `eval()`, `subprocess` con input del usuario sin sanitizar |
| C5 | **Autenticación rota** | JWT sin verificación de firma, contraseñas en MD5/SHA1, sesiones sin expiración |

### 🟠 ALTA

| # | Qué buscar | Señales de riesgo |
|---|------------|-------------------|
| A1 | **Rate limiting ausente** | Llamadas a OpenAI, Anthropic u otras APIs sin límite por usuario/IP |
| A2 | **Deserialización insegura** | `pickle.loads()`, `JSON.parse()` sin validación de esquema en datos externos |
| A3 | **Rutas sin autenticación** | Endpoints administrativos o de datos sensibles sin middleware de auth |
| A4 | **Datos sensibles en logs** | `console.log(user)`, `print(request.body)` que pueden exponer tokens o PII |
| A5 | **Dependencias vulnerables** | Versiones con CVEs en `package.json`, `requirements.txt`, `go.mod` |

### 🟡 MEDIA

| # | Qué buscar | Señales de riesgo |
|---|------------|-------------------|
| M1 | **CORS permisivo pero no wildcard** | Lista de orígenes demasiado amplia o dinámica sin validación |
| M2 | **Headers de seguridad faltantes** | Sin `Helmet.js`, sin `Content-Security-Policy`, sin `X-Frame-Options` |
| M3 | **HTTPS no forzado** | Redirección HTTP→HTTPS ausente o `secure: false` en cookies |
| M4 | **Variables de entorno sin validación** | Sin librería tipo `zod`, `joi` o `pydantic` validando el esquema del `.env` |
| M5 | **Errores verbosos al cliente** | Stack traces o mensajes internos expuestos en respuestas de error |

---

## Paso 3 — Instrucciones de análisis

1. **Lee los archivos relevantes** — no asumas, verifica el código real.
2. **Para cada hallazgo**, documenta:
   - Archivo y línea exacta
   - Por qué es un riesgo
   - Ejemplo de explotación (si aplica)
   - Fix concreto con código corregido
3. **No reportes falsos positivos** — si una práctica parece riesgosa pero está mitigada
   por otro mecanismo, menciónalo como "mitigado" con la explicación.
4. **Prioriza por impacto real**, no solo por categoría teórica.

---

## Paso 4 — Formato del reporte

Usa esta estructura al presentar resultados:

```
## Reporte de Seguridad — [nombre del proyecto]

### Resumen ejecutivo
- X hallazgos críticos | Y altos | Z medios

---

### [CRÍTICO] C1 — Secreto expuesto en configuración
**Archivo:** `config/database.js:14`
**Descripción:** La contraseña de la base de datos está hardcodeada directamente.
**Riesgo:** Cualquier persona con acceso al repositorio puede comprometer la BD.
**Fix:**
```js
// ❌ Antes
const password = "supersecret123";

// ✅ Después
const password = process.env.DB_PASSWORD;
```
---
```

Finaliza el reporte con una **tabla de prioridades** ordenada por criticidad y el
esfuerzo estimado de remediación (Bajo / Medio / Alto).

---

## Notas

- Si el proyecto usa frameworks específicos (Next.js, Django, Laravel, etc.),
  considera sus vectores de ataque particulares (CSRF en Django, Server Actions en Next.js, etc.).
- Si encuentras dependencias desactualizadas, sugiere el comando exacto para actualizarlas.
- Para proyectos con múltiples servicios (monorepo, microservicios), audita cada uno por separado
  y luego evalúa los riesgos de comunicación entre servicios.
