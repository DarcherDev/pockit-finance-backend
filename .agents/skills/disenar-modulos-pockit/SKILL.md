---
name: disenar-modulos-pockit
description: Diseñar e implementar módulos NestJS en pockit-finance-backend aplicando principios SOLID, arquitectura estricta por capas (Controller, Service, Mapper, Repository, Entity) y las convenciones del esquema pockit-ares. Úsese al crear o modificar módulos, endpoints, entidades, DTOs o servicios en pockit-finance-backend.
---

# Estándar de Módulos y Diseño Reutilizable — Pockit Finance Backend

## Cuándo usar esta skill
- Al crear o modificar módulos de dominio en `pockit-finance-backend` (`auth`, `usuarios`, `cuentas`, `categorias`, `etiquetas`, `transacciones`, `series`, `sync`, `dashboards`, `health`).
- Al diseñar endpoints REST, servicios, repositorios, mappers, entidades o DTOs del backend.

## 1. Principios SOLID y Reutilización

- **SRP:** Separa presentación (`Controller`), lógica de negocio (`Service`), traducción (`Mapper`) y acceso a datos (`Repository`).
- **OCP:** Extiende comportamientos mediante estrategias, composición o polimorfismo; evita `if/switch` crecientes.
- **LSP / ISP / DIP:** Respeta contratos base, define interfaces pequeñas y específicas, e inyecta abstracciones en lugar de instanciar dependencias concretas.
- **Sin duplicación:** Extrae lógica compartida en utilidades o servicios de dominio reutilizables.

## 2. Estructura de Carpetas por Módulo

```text
src/{modulo}/
├── {modulo}.module.ts
├── controllers/
│   └── {modulo}.controller.ts
├── services/
│   └── {modulo}.service.ts
├── mapper/
│   └── {modulo}.mapper.ts
├── repositories/
│   └── {modulo}.repository.ts
├── entities/
│   └── {modulo}.entity.ts
├── errors/
│   ├── {modulo}-error-code.ts
│   └── {modulo}-error-messages.ts
└── dto/
    ├── index.ts
    ├── request/
    │   ├── create-{modulo}.request.ts
    │   └── update-{modulo}.request.ts
    └── response/
        └── {modulo}.response.ts
```

## 3. Reglas Obligatorias de Capas

| Capa | Responsabilidad | Tipos que usa | Qué devuelve |
| :--- | :--- | :--- | :--- |
| **Controller** | Expone endpoints bajo `/api`, valida DTO y extrae `@CurrentUser()` | `RequestDto` | Lo que retorna el Service |
| **Service** | Lógica de negocio, validaciones, transacciones SQL y propiedad por `usr_id` | `RequestDto` | **Siempre** `ResponseDto` vía Mapper |
| **Mapper** | Traduce `Entity -> ResponseDto` | `Entity` | `ResponseDto` |
| **Repository** | Único acceso a PostgreSQL / ORM (`SELECT ... FOR UPDATE`, queries) | `Entity` | `Entity` (solo uso interno) |
| **Entity** | Reflejo exacto de la tabla en `pockit-ares.sql` | — | — |

1. **El Service nunca devuelve la Entity ni datos crudos:** Siempre retorna `ResponseDto` pasando por `{Modulo}Mapper`.
2. **Solo el Repository conoce y usa la Entity:** Controller, Service y Mapper no importan TypeORM ni ejecutan queries.
3. **DTOs separados:** `dto/request/` con decoradores `class-validator` (`whitelist: true`, `forbidNonWhitelisted: true`) y `dto/response/` para el contrato de salida.

## 4. Reglas Específicas de Pockit Finance

- **Esquema oficial de BD:** Toda `Entity` debe coincidir exactamente con `pockit-finance-docs/docs/base-datos/pockit-ares.sql` (tablas `usuarios`, `cuentas`, `categorias`, `etiquetas`, `transacciones`, `transaccion_etiquetas`, `series_recurrentes`, `esquema_versiones` y prefijos `usr_`, `cta_`, `cat_`, `etq_`, `trx_`, `ser_`).
- **Antes de crear columnas o tablas nuevas:** **Detenerse y preguntar al usuario** para aprobar e incorporar el cambio en `pockit-ares.sql` antes de codificarlo.
- **Aislamiento multi-usuario:** Extraer `usr_id` exclusivamente del JWT verificado (nunca del body o query) y validar pertenencia en cada operación.
- **Precisión y atomicidad:** Operar montos `NUMERIC(14, 2)` sin punto flotante impreciso (centavos enteros o librería decimal) y envolver actualizaciones de saldo en transacciones SQL explícitas con bloqueo determinístico (`SELECT ... FOR UPDATE` por `cta_id`).

## 5. Checklist de Entrega por Módulo

- [ ] Estructura `controllers/`, `services/`, `mapper/`, `repositories/`, `entities/`, `dto/request/`, `dto/response/` completa.
- [ ] Controller sin lógica de negocio y con `usr_id` tomado del JWT.
- [ ] Service retorna siempre `ResponseDto` vía Mapper.
- [ ] Repository encapsula todas las consultas y bloqueos transaccionales.
- [ ] Columnas y tipos de Entity verificados contra `pockit-ares.sql`.
