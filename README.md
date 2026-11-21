# Pockit Finance — Backend

API backend de **Pockit Finance**, sistema móvil y web de auditoría y finanzas personales, construido con **NestJS**, **TypeORM** y **PostgreSQL (Supabase)**.

> **Tablero de Seguimiento (GitHub Projects):** [Pockit Finance - Backend](https://github.com/users/DarcherDev/projects/5)

## Stack Tecnológico

- **Framework:** NestJS 11 (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`)
- **ORM:** TypeORM (`@nestjs/typeorm`, `typeorm`, `pg`)
- **Configuración:** `@nestjs/config`
- **Base de Datos:** PostgreSQL 15+ en Supabase Cloud
- **Lenguaje:** TypeScript

## Requisitos Previos

- Node.js 20+ (recomendado v22+)
- npm 10+
- Acceso a la base de datos PostgreSQL en Supabase (o instancia local de PostgreSQL 15+)

## Configuración Inicial

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia `.env.example` a `.env` y completa los valores correspondientes:
   ```bash
   cp .env.example .env
   ```

   Variables principales en `.env`:
   - `PORT`: Puerto del servidor HTTP (por defecto `3000`).
   - `DATABASE_URL`: Cadena de conexión PostgreSQL de Supabase (*Direct* o *Session Pooler* en puerto `5432`).
   - `DB_SSL`: Habilita SSL (`true` para Supabase Cloud).
   - `DB_LOGGING`: Activa el log de queries SQL de TypeORM (`false` por defecto).
   - `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`: Credenciales del proyecto Supabase para Auth/API.

> **Nota:** `synchronize` está desactivado (`false`) en `src/config/database.config.ts` porque el esquema de base de datos se gestiona mediante scripts SQL / migraciones externas.

## Autenticación JWT y Seguridad (Defensa en Profundidad)

- Todas las rutas de la API están protegidas por defecto mediante `SupabaseJwtGuard` (`APP_GUARD`), que verifica criptográficamente el token `Bearer` contra `SUPABASE_JWKS_URL` y valida que el usuario (`sub`) exista en `public.usuarios`.
- Las rutas públicas explícitas (como `GET /api/health`) se declaran con `@Public()`.
- El script [`src/database/scripts/rls-policies.sql`](src/database/scripts/rls-policies.sql) habilita **Row Level Security (RLS)** y políticas basadas en `auth.uid()` para las 7 tablas de negocio de `pockit-ares.sql`. Ejecútalo en el SQL Editor de Supabase después de aplicar el esquema inicial.

## Ejecución

```bash
# Desarrollo (watch mode)
npm run start:dev

# Desarrollo estándar
npm run start

# Compilar para producción
npm run build

# Producción
npm run start:prod
```

## Despliegue Continuo (Render / Railway / Docker)

```bash
# 1. Compilar la aplicación
npm run build

# 2. Ejecutar migraciones pendientes contra la base de datos en producción
npm run migration:run:prod

# 3. Iniciar el servidor compilado
npm run start:prod
```

- **Healthcheck HTTP:** `GET /api/health` (responde `200 OK` con `{ "status": "ok", "database": "up" }`, o `503` si falla la conexión a PostgreSQL).
- **Imagen Docker:** `Dockerfile` multi-stage (`builder` + `production` sobre `node:22-alpine`) con `HEALTHCHECK` integrado hacia `/api/health`.
- **Procfile:** Define el proceso `web: npm run start:prod` para plataformas PaaS.

## Pruebas y Calidad

```bash
# Pruebas unitarias
npm run test

# Pruebas e2e
npm run test:e2e

# Cobertura
npm run test:cov

# Linter y formato
npm run lint
npm run format
```

## Estructura Base (Arquitectura en 4 Capas)

```text
src/
├── common/
│   └── domain/              # DomainError, TransactionContext, UnitOfWorkPort
├── config/
│   └── database.config.ts   # Configuración TypeORM + PostgreSQL/Supabase
├── database/
│   ├── database.module.ts   # Módulo global que provee UNIT_OF_WORK_PORT
│   └── typeorm-unit-of-work.ts
├── auth/ | usuarios/ | categorias/ | health/
│   ├── presentation/        # Controllers, DTOs, Guards, Decorators
│   ├── application/         # Services (Casos de uso) y Response Mappers
│   ├── domain/              # Modelos puros, Reglas/Políticas y Ports
│   └── infrastructure/      # Entities TypeORM, Repositories, Persistence Mappers y Adapters
├── app.controller.ts
├── app.module.ts            # ConfigModule, TypeOrmModule y DatabaseModule
├── app.service.ts
└── main.ts
```
