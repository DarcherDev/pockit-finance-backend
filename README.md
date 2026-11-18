# Pockit Finance — Backend

API backend de **Pockit Finance**, sistema móvil y web de auditoría y finanzas personales, construido con **NestJS**, **TypeORM** y **PostgreSQL (Supabase)**.

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

## Estructura Base

```text
src/
├── config/
│   └── database.config.ts   # Configuración TypeORM + PostgreSQL/Supabase
├── app.controller.ts
├── app.module.ts            # ConfigModule y TypeOrmModule.forRootAsync
├── app.service.ts
└── main.ts
```
