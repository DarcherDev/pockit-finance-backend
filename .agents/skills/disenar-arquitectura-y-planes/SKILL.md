---
name: disenar-arquitectura-y-planes
description: Diseñar las especificaciones técnicas de alto nivel y planes de implementación modulares (modelos, contratos, DTOs, TDD) para entregar exclusivamente al Líder Técnico de Pockit Finance.
---

# Diseño de Arquitectura y Planes de Implementación — Pockit Finance

Esta habilidad se ejecuta únicamente **después** de que el Usuario aprobó el Documento de Diseño generado en `descubrir-negocio-brainstorming` (o cuando se planifica una Historia de Usuario existente en `backlog-backend.md`).

---

## 1. Principio Fundamental

Escribes el plan técnico para que el **Líder Técnico** coordine su ejecución sin ambigüedades.
El Líder Técnico y sus desarrolladores no deben adivinar nombres de campos, firmas de contratos, códigos de error ni reglas de concurrencia.

Tu plan debe ser:
- **Modular y Atómico:** Tareas independientes con criterios de aceptación testeables (TDD).
- **Apegado a `pockit-ares.sql`:** Tablas y columnas (`usr_`, `cta_`, `cat_`, `etq_`, `trx_`, `ser_`) exactas.
- **Respetuoso de 4 Capas (`disenar-modulos-pockit`):** `Presentation (Controller + DTOs)` -> `Application (Service + Mapper)` -> `Domain (Model + Rules + Ports)` -> `Infrastructure (OrmEntity + Repository + PersistenceMapper)`, DTOs separados en `presentation/dto/request/` y `presentation/dto/response/`.

---

## 2. Ubicación de Documentos

Los planes técnicos se guardan en `pockit-finance-docs/docs/planes/`:
- Planes funcionales: `pockit-finance-docs/docs/planes/YYYY-MM-DD-<nombre-modulo>-plan.md`

---

## 3. Estructura Obligatoria del Plan de Implementación

```markdown
# [Nombre del Módulo / HU] — Plan de Implementación Técnica

**Documento / HU Relacionada:** [Ruta al diseño o HU en backlog-backend.md]
**Repositorio Destino:** `C:/Users/ARCHER/Documents/Proyectos/pockit-finance/pockit-finance-backend`
**Destinatario:** Líder Técnico (`tech-lead`)

---

## 1. Resumen Arquitectónico
- Tablas de `pockit-ares.sql` involucradas.
- Módulo NestJS a crear o modificar en `src/{modulo}/`.
- Reglas de concurrencia / atomicidad (transacciones SQL, `SELECT ... FOR UPDATE`, precisión decimal).

## 2. Contratos y Errores del Módulo (`src/{modulo}/dto/` y `errors/`)
- **DTOs de Entrada (Request):** Clases, validadores (`class-validator`), tipos.
- **DTOs de Salida (Response):** Campos limpios en `camelCase` (sin exponer prefijos internos si no corresponde).
- **Catálogo de Errores (`DomainException`):** Códigos (`code`), HTTP status y mensajes en formato `{ statusCode, code, message, details }`.

## 3. Modelo de Datos y Entidades
- Columnas de `pockit-ares.sql` mapeadas 1:1 con la `Entity` de TypeORM.
- Relaciones foráneas y restricciones `CHECK`.

## 4. Desglose Atómico de Tareas (Para el Líder Técnico)

### Tarea 1: Contratos DTO y Errores de Dominio
- **Archivos a Crear/Modificar:** `src/{modulo}/dto/...`, `src/{modulo}/errors/...`
- **Criterio de Aceptación:** Validación estricta con `class-validator` y exportación limpia.

### Tarea 2: Entidad y Repositorio
- **Archivos a Crear/Modificar:** `*.entity.ts`, `*.repository.ts`.
- **Criterio de Aceptación:** Inyección TypeORM restringida al Repository, mapeo 1:1 con `pockit-ares.sql` y bloqueo transaccional si aplica.
- **Test sugerido:** Repository unit/mock test.

### Tarea 3: Servicio, Lógica de Negocio y Mapper
- **Archivos a Crear/Modificar:** `*.service.ts`, `*.mapper.ts`, `*.service.spec.ts`.
- **Criterio de Aceptación:** Reglas de negocio, aislamiento por `usr_id`, lanzamiento de `DomainException`, transformación mediante `Mapper.toResponse*`.
- **Test Rojo -> Verde:** Pruebas unitarias de Service con Happy Path y Edge Cases.

### Tarea 4: Controlador y Endpoint
- **Archivos a Crear/Modificar:** `*.controller.ts`, Guards JWT (`@CurrentUser()`).
- **Criterio de Aceptación:** Invocación limpia al Service, retorno del Response DTO bajo `/api`.
- **Test sugerido:** Controller unit test / E2E test.
```

---

## 4. Protocolo de Entrega al Líder Técnico (Handoff)

> [!IMPORTANT]
> **REGLA DE ORO DE CADENA DE MANDO:**
> Eres el **único** que entrega especificaciones al Líder Técnico.
> **NUNCA** delegas directamente a Desarrolladores (`developer`) ni a QA (`qa-tester`).
> El Líder Técnico es quien:
> 1. Crea la rama de trabajo `feature/*`.
> 2. Asigna la implementación al Desarrollador.
> 3. Gestiona la entrega a la rama `qa/*`.
> 4. Realiza el merge a `develop` tras la certificación verde de QA.
