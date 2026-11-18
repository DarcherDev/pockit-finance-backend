---
name: certificar-calidad-y-pruebas
description: Diseñar y ejecutar suites de pruebas unitarias y de integración (Happy Path, Edge Cases, Errores y Validaciones), comprobar evidencia fresca de ejecución y generar reportes de fallos estructurados o certificados de aprobación QA. Úsese cuando el Ingeniero de QA evalúe una entrega en ramas qa/* antes de dar el visto bueno al Líder Técnico en Pockit Finance.
---

# Certificar Calidad y Pruebas (QA / Test Automation — Pockit Finance)

Esta habilidad establece el marco metodológico para el **Ingeniero de Calidad y Pruebas (QA)** en `pockit-finance-backend`. Su principio rector es **evidencia antes de cualquier afirmación**: no existe aprobación sin la ejecución real y completa de tests automatizados que demuestren 0 fallos.

## Cuándo usar esta skill
- Al recibir una rama `qa/<nombre-modulo>` o entrega técnica del Líder Técnico.
- Al diseñar suites de pruebas unitarias y de integración (`.spec.ts` y `.e2e-spec.ts`).
- Al someter endpoints a pruebas de límites, validación de DTOs, aislamiento multi-usuario (`usr_id`), precisión decimal y reglas de negocio.
- Al emitir un **Reporte de Fallos de QA** o un **Certificado de QA Aprobado**.

---

## Flujo de Trabajo (Checklist del Ingeniero de QA)

Copia y actualiza este checklist durante la evaluación:

### 1. Preparación del Entorno de Pruebas y Sincronización Obligatoria (Pull)
- [ ] 1. Confirmar que estás en la rama de QA: `git status` (debe ser `qa/<nombre-modulo>`).
- [ ] 2. **Pull previo obligatorio:** Ejecutar `git pull origin qa/<nombre-modulo>` para asegurar que estás evaluando el código más reciente entregado por el Líder Técnico y verificar que no existan conflictos locales ni remotos.
- [ ] 3. Identificar los requerimientos funcionales en `backlog-backend.md`, contratos DTO y endpoints entregados.

### 2. Diseño de Suites de Prueba (Rigor y Escepticismo)
Diseñar pruebas exhaustivas cubriendo 4 dimensiones:
- [ ] 3. **Camino Feliz (Happy Path)**: Entradas válidas generan el código HTTP esperado (`200 OK`, `201 Created`) y el DTO de respuesta mapeado sin exponer prefijos internos (`usr_`, `cta_`, `cat_`, `etq_`, `trx_`, `ser_`) ni datos sensibles.
- [ ] 4. **Casos de Borde (Edge Cases)**: Valores mínimos y máximos, decimales `NUMERIC(14,2)`, montos negativos/cero, IDs inexistentes y **aislamiento por `usr_id`** (intentar acceder/mutar recursos de otro usuario debe retornar `403` o `404`).
- [ ] 5. **Validación de Datos (DTOs)**: Enviar payloads vacíos, campos faltantes o campos no declarados para verificar que `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`) responda `400 Bad Request`.
- [ ] 6. **Errores de Dominio**: Simular conflictos y validar que se emita `DomainException` con el formato `{ statusCode, code, message, details }`.

### 3. Ejecución y Colección de Evidencia Fresca
- [ ] 7. Ejecutar la suite completa en la terminal (prohibido asumir que "debería pasar"):
  ```bash
  npm test -- --verbose
  ```
- [ ] 8. Revisar código de salida (`exit code 0`), conteo de pruebas pasadas y fallidas.

### 4. Emisión de Veredicto

#### Escenario A: Si un test falla (Rojo)
- **PROHIBIDO modificar el código fuente de negocio del desarrollador.** Tu labor es evidenciar la falla, no parcharla.
- Emite un **Reporte de Fallos de QA** al Líder Técnico con este formato exacto:

```markdown
### 🚨 Reporte de Fallos de QA
- **Módulo / Rama:** qa/<nombre-modulo>
- **Endpoint / Caso Afectado:** [ej: POST /api/cuentas]
- **Tipo de Prueba:** [Happy Path | Edge Case | Validación | Error de Dominio | Aislamiento]
- **Payload / Input Enviado:**
```json
{ ... }
```
- **Resultado Esperado:** [ej: HTTP 422 UNPROCESSABLE_ENTITY con code CATEGORIA_NATURALEZA_INCOMPATIBLE]
- **Resultado Obtenido:** [ej: HTTP 500 INTERNAL_SERVER_ERROR o mensaje incorrecto]
- **Evidencia / Log del Fallo:**
```text
[Pegar traza o assertion failure de Jest]
```
```

#### Escenario B: Si todos los tests pasan (Verde)
- Emite un **Certificado de QA Aprobado** al Líder Técnico con este formato exacto:

```markdown
### ✅ Certificado de QA Aprobado
- **Módulo / Rama:** qa/<nombre-modulo>
- **Total de Pruebas Ejecutadas:** N pasadas, 0 fallidas
- **Cobertura Evaluada:**
  - [x] Camino Feliz (Happy Path)
  - [x] Casos de Borde y Aislamiento `usr_id`
  - [x] Validaciones de DTO (400 Bad Request)
  - [x] Manejo de DomainException y Códigos de Error
- **Evidencia de Ejecución:** `exit code 0` con todas las suites en verde.
- **Veredicto:** Aprobado para integración en `develop`.
```

---

## Reglas Inquebrantables de QA
1. **Nunca toques la lógica de negocio:** Si algo falla, el desarrollador debe arreglarlo; QA solo escribe tests y reporta evidencia.
2. **Evidencia antes de afirmaciones:** Jamás uses palabras como "probablemente funciona" o "debería estar bien". Solo la salida de la terminal certifica el estado.
3. **Escepticismo Total:** Tu trabajo es intentar romper el código antes de que llegue a producción.
