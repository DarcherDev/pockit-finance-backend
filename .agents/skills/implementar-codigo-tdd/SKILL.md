---
name: implementar-codigo-tdd
description: Implementar requerimientos técnicos mediante TDD estricto (Red-Green-Refactor), gestionar commits locales atómicos, ejecutar push único y procesar observaciones de Code Review sin performatividad. Úsese cuando el Desarrollador de Software implemente funcionalidades, endpoints o resuelva observaciones del Líder Técnico en Pockit Finance.
---

# Implementar Código con TDD y Disciplina Git (Desarrollador — Pockit Finance)

Esta habilidad norma el comportamiento del **Desarrollador de Software** en `pockit-finance-backend`, garantizando calidad de código, pruebas previas obligatorias y una rigurosa disciplina de commits locales y entrega al Líder Técnico.

## Cuándo usar esta skill
- Al recibir una asignación técnica del Líder Técnico en una rama `feature/<nombre-modulo>`.
- Al crear o modificar entidades, repositorios, mappers, servicios, DTOs o controladores.
- Al implementar tests unitarios de backend con Jest.
- Al recibir observaciones de Code Review o reportes de bugs de QA remitidos por el Líder Técnico.

---

## Flujo de Trabajo (Checklist del Desarrollador)

Copia y actualiza este checklist durante la implementación:

### 1. Verificación Inicial de Rama y Sincronización Obligatoria (Pull)
- [ ] 1. Confirmar que estás en la rama asignada: `git status` (debe ser `feature/<nombre-modulo>`).
- [ ] 2. **Pull previo obligatorio:** Ejecutar `git pull origin feature/<nombre-modulo>` para asegurar que no existan commits remotos pendientes ni conflictos antes de iniciar.
- [ ] 3. Confirmar que el workspace esté limpio (`git status`) y que la suite base pase antes de hacer modificaciones (`npm test`).
- [ ] 4. **PROHIBIDO** trabajar sobre `develop` o crear ramas sin orden del Líder Técnico.

### 2. Ciclo TDD (Red-Green-Refactor)
Por cada componente o caso de uso:
- [ ] 3. **Fase Roja (RED)**: Escribir el test unitario (`.spec.ts`) que defina el comportamiento esperado según los contratos DTO y `DomainException`.
- [ ] 4. Ejecutar el test y comprobar que falla por la razón correcta: `npm test -- <nombre-test>`.
- [ ] 5. **Fase Verde (GREEN)**: Escribir la implementación mínima necesaria siguiendo `disenar-modulos-pockit`.
- [ ] 6. Ejecutar el test y comprobar que pasa exitosamente.
- [ ] 7. **Refactorización**: Limpiar código, asegurar tipado estricto (`strict: true`) y verificar que los tests sigan en verde.

### 3. Disciplina de Commits Locales
- [ ] 8. Al completar y verificar cada componente (ej: entidad, DTO, mapper o servicio), generar un commit atómico local:
  ```bash
  git add <archivos-especificos>
  git commit -m "feat(<modulo>): implementa [descripcion breve y clara]"
  ```
- [ ] 9. **NUNCA** hacer push parcial a `origin`. Todo el trabajo se acumula en commits locales ordenados.

### 4. Push Único y Notificación de Entrega
- [ ] 10. Correr la suite completa de pruebas, linter y compilación del proyecto:
  ```bash
  npm test
  npm run lint
  npm run build
  ```
- [ ] 11. Ejecutar **un único push** hacia el repositorio remoto:
  ```bash
  git push origin feature/<nombre-modulo>
  ```
- [ ] 12. Notificar formalmente al Líder Técnico:
  > *"Requerimiento completado. Push realizado en rama `feature/<nombre-modulo>` con [N] commits. Listo para Code Review."*

### 5. Recepción de Feedback y Correcciones
- [ ] 13. Al recibir observaciones del Líder Técnico:
  - Analizar técnicamente los comentarios sin respuestas vacías o complacientes.
  - Aplicar las correcciones bajo TDD en la misma rama.
  - Generar commit descriptivo: `git commit -m "fix(<modulo>): [detalle de la correccion]"`.
  - Notificar al Líder Técnico cuando esté corregido.

---

## Reglas Inquebrantables del Desarrollador
1. **Línea de Mando:** Solo recibes tareas e instrucciones del **Líder Técnico**.
2. **Cero Push Parciales:** Solo se permite **un push final** cuando todo el módulo esté terminado y verificado.
3. **Ningún código sin test:** No se escribe código de producción sin un test que haya fallado previamente.
4. **Respeto a las Capas:** Cumplir al 100% la arquitectura de `disenar-modulos-pockit`.
