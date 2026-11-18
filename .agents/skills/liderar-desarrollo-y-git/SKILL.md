---
name: liderar-desarrollo-y-git
description: Gobernar el flujo de ramas Git (develop, feature/*, qa/*), ejecutar revisiones de código (Code Review), arbitrar entregas con QA y autorizar el merge final a develop. Úsese cuando el Líder Técnico gestione el ciclo de vida de un feature, revise código entregado por desarrolladores o reciba la certificación de QA en Pockit Finance.
---

# Liderar Desarrollo y Flujo Git (Tech Lead — Pockit Finance)

Esta habilidad establece el procedimiento operativo estándar para el **Líder Técnico (Tech Lead)** de `pockit-finance-backend` al coordinar a los desarrolladores y testers, asegurando que ningún cambio llegue a `develop` sin doble verificación (Code Review + Certificación QA).

## Cuándo usar esta skill
- Al iniciar una nueva funcionalidad o módulo (`feature/<nombre-modulo>`).
- Al recibir una entrega del Agente Desarrollador para realizar Code Review.
- Al transferir el código revisado a la rama `qa/<nombre-modulo>`.
- Al arbitrar reportes de bugs provenientes de QA.
- Al realizar el merge final (`git merge --no-ff`) hacia `develop`.

---

## Flujo de Trabajo (Checklist del Tech Lead)

Copia y actualiza este checklist durante el ciclo de vida del módulo:

### Fase 1: Creación del Feature
- [ ] 1. Asegurar que `develop` esté actualizado (`git checkout develop && git pull`).
- [ ] 2. Crear y cambiar a la rama de trabajo: `git checkout -b feature/<nombre-modulo>`.
- [ ] 3. Publicar la rama en remoto (`git push -u origin feature/<nombre-modulo>`) y notificar al Desarrollador los objetivos y alcance técnico.

### Fase 2: Code Review (Revisión de Código)
- [ ] 4. Obtener diff y cambios (`git log -p` o `git diff develop...HEAD`).
- [ ] 5. Auditar contra la skill `disenar-modulos-pockit`:
  - Contratos DTO en `dto/request/` y `dto/response/` con `class-validator`.
  - Mapeo exacto 1:1 con `pockit-ares.sql` (`usr_`, `cta_`, `cat_`, `etq_`, `trx_`, `ser_`).
  - Separación estricta de capas (`Controller` -> `Service` -> `Repository` -> `Entity` + `Mapper`).
  - Manejo de excepciones mediante `DomainException` y formato `{ statusCode, code, message, details }`.
  - Aislamiento por `usr_id` desde JWT y transacciones SQL seguras en operaciones de saldo.
- [ ] 6. **Decisión del Code Review**:
  - *Si hay observaciones*: Rebotar al Desarrollador con lista técnica de correcciones y detener el flujo.
  - *Si está aprobado*: Proceder a Fase 3.

### Fase 3: Transición a QA y Arbitraje
- [ ] 7. Habilitar la rama de pruebas: `git checkout -b qa/<nombre-modulo>` y publicar en remoto si aplica.
- [ ] 8. Despachar al Agente de QA indicando endpoints, escenarios esperados y criterios de aceptación.
- [ ] 9. **Arbitraje de QA**:
  - *Si QA reporta error*: Evaluar si es bug real o test defectuoso. Si es bug real, reasignar al Desarrollador con contexto exacto.
  - *Si QA certifica en verde*: Proceder a Fase 4.

### Fase 4: Integración a `develop`
- [ ] 10. Cambiar a `develop` y **actualizar obligatoriamente**: `git checkout develop && git pull origin develop` para validar que `develop` esté al día y sin conflictos remotos antes del merge.
- [ ] 11. Ejecutar merge sin avance rápido: `git merge --no-ff qa/<nombre-modulo> -m "feat(<modulo>): implementacion certificada"`.
- [ ] 12. Ejecutar la suite completa de tests de regresión (`npm test`) y compilación (`npm run build`).
- [ ] 13. Limpiar ramas locales integradas (`git branch -d feature/<nombre-modulo> qa/<nombre-modulo>`), conservando las remotas para trazabilidad.
- [ ] 14. Notificar al Arquitecto de Software la integración exitosa.

---

## Reglas Inquebrantables del Tech Lead
1. **Regla de Merge:** El Tech Lead es el **único agente autorizado** para hacer merge a `develop`.
2. **Cero Bypass:** Prohibido mergear código sin aprobación previa de Code Review y certificación verde de QA.
3. **Merge Seguro:** Siempre utilizar `--no-ff` para preservar el historial de la funcionalidad.
4. **Pull Previo Obligatorio:** Siempre ejecutar `git pull` antes de bifurcar una rama y antes de integrar a `develop` para prevenir colisiones o divergencias con el repositorio remoto.
