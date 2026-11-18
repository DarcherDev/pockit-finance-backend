---
name: disenar-modulos-pockit
description: Diseñar e implementar módulos NestJS en pockit-finance-backend aplicando principios SOLID, arquitectura estricta en 4 capas (Presentation, Application, Domain, Infrastructure) y las convenciones del esquema pockit-ares. Úsese al crear o modificar módulos, endpoints, entidades, DTOs o servicios en pockit-finance-backend.
---

# Estándar de Módulos y Diseño Reutilizable — Pockit Finance Backend

## Cuándo usar esta skill
- Al crear o modificar módulos de dominio en `pockit-finance-backend` (`auth`, `usuarios`, `cuentas`, `categorias`, `etiquetas`, `transacciones`, `series`, `sync`, `dashboards`, `health`).
- Al diseñar endpoints REST, casos de uso, modelos/puertos de dominio, repositorios, mappers, entidades o DTOs del backend.

## 1. Principios SOLID y Reutilización

- **SRP y Regla de Dependencia:** Separa `presentation/` (HTTP/DTOs), `application/` (Casos de uso + DTO Mappers), `domain/` (Modelos puros + Reglas + Puertos) e `infrastructure/` (TypeORM Entities + Repositories + Persistence Mappers + Adaptadores externos).
- **OCP:** Extiende comportamientos mediante estrategias, composición o polimorfismo; evita `if/switch` crecientes.
- **LSP / ISP / DIP:** La capa `application/` depende únicamente de puertos/interfaces definidos en `domain/` (inyectados vía `Symbol` tokens); la infraestructura implementa dichos puertos.
- **Sin duplicación:** Extrae lógica compartida en utilidades o servicios de dominio reutilizables.

## 2. Estructura de Carpetas por Módulo (4 Capas)

```text
src/{modulo}/
├── {modulo}.module.ts
├── presentation/
│   ├── controllers/
│   │   └── {modulo}.controller.ts
│   └── dto/
│       ├── index.ts
│       ├── request/
│       │   ├── create-{modulo}.request.ts
│       │   └── update-{modulo}.request.ts
│       └── response/
│           └── {modulo}.response.ts
├── application/
│   ├── services/
│   │   └── {modulo}.service.ts
│   └── mappers/
│       └── {modulo}.mapper.ts
├── domain/
│   ├── model/
│   │   └── {modulo}.model.ts
│   ├── rules/                         # Políticas, calculadoras y validaciones puras
│   └── ports/
│       └── out/
│           └── {modulo}-repository.port.ts
└── infrastructure/
    └── persistence/
        ├── entities/
        │   └── {modulo}.entity.ts
        ├── mappers/
        │   └── {modulo}-persistence.mapper.ts
        └── repositories/
            └── {modulo}.repository.ts
```

## 3. Reglas Obligatorias de las 4 Capas

| Capa | Responsabilidad | Tipos que usa | Qué devuelve |
| :--- | :--- | :--- | :--- |
| **Presentation** | Expone endpoints bajo `/api`, valida DTO y extrae `@CurrentUser()` | `RequestDto` | Lo que retorna el Service (`ResponseDto`) |
| **Application** | Orquestación de casos de uso, transacciones (`UnitOfWorkPort`) y aislamiento por `usr_id` | `RequestDto` / `DomainModel` | **Siempre** `ResponseDto` vía Application Mapper |
| **Domain** | Modelos puros, calculadoras/reglas puras (`DomainError`) y puertos (`Symbol` + interfaz) | `DomainModel` / `TransactionContext` | Tipos puros de dominio (cero `@nestjs/*` ni `typeorm`) |
| **Infrastructure** | Único acceso a PostgreSQL/ORM (`SELECT ... FOR UPDATE`) y adaptadores externos | `OrmEntity` ↔ `DomainModel` | `DomainModel` vía Persistence Mapper |

1. **El Service de aplicación nunca devuelve ni manipula la Entity TypeORM:** Recibe `DomainModel` desde el puerto de repositorio y retorna `ResponseDto` pasando por `{Modulo}Mapper`.
2. **Solo `infrastructure/` conoce y usa `*.entity.ts` y TypeORM (`EntityManager`):** `domain/` y `application/` usan `TransactionContext` opaco y puertos.
3. **DTOs separados:** `presentation/dto/request/` con decoradores `class-validator` (`whitelist: true`, `forbidNonWhitelisted: true`) y `presentation/dto/response/` para el contrato de salida.

## 4. Reglas Específicas de Pockit Finance

- **Esquema oficial de BD:** Toda `Entity` debe coincidir exactamente con `pockit-finance-doc/docs/base-datos/pockit-ares.sql` (y `docs/etapa-2/base-datos/pockit-ares-etapa-2.sql` en Etapa 2).
- **Antes de crear columnas o tablas nuevas:** **Detenerse y preguntar al usuario** para aprobar e incorporar el cambio en `pockit-ares*.sql` antes de codificarlo.
- **Aislamiento multi-usuario:** Extraer `usr_id` exclusivamente del JWT verificado (nunca del body o query) y validar pertenencia en cada operación.
- **Precisión y atomicidad:** Operar montos `NUMERIC(14, 2)` sin punto flotante impreciso (centavos enteros o librería decimal) y envolver actualizaciones de saldo en transacciones SQL explícitas (`UnitOfWorkPort` + `SELECT ... FOR UPDATE` por `cta_id`).

## 5. Checklist de Entrega por Módulo

- [ ] Estructura `presentation/`, `application/`, `domain/`, `infrastructure/` completa.
- [ ] `domain/` sin imports de `@nestjs/*`, `typeorm` ni `@supabase/*`.
- [ ] Controller sin lógica de negocio y con `usr_id` tomado del JWT.
- [ ] Service de aplicación retorna siempre `ResponseDto` vía Application Mapper y usa `UnitOfWorkPort`.
- [ ] Repository encapsula consultas TypeORM, bloqueos transaccionales y mapeo a `DomainModel` vía Persistence Mapper.
- [ ] Columnas y tipos de Entity verificados contra `pockit-ares.sql`.
