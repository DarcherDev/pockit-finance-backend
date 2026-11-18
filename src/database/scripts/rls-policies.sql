-- ============================================================================
-- Script de Defensa en Profundidad: Row Level Security (RLS)
-- Esquema: pockit-ares (Supabase / PostgreSQL 15+)
-- ============================================================================
-- Propósito:
--   Habilitar RLS y definir políticas de aislamiento por usuario basadas en
--   `auth.uid()` para las 7 tablas de negocio de `pockit-ares.sql`.
--
-- Nota de ejecución:
--   - Ejecutar en el SQL Editor de Supabase Cloud después de crear las tablas.
--   - El backend NestJS (conectado con rol privilegiado/service) valida además
--     el JWT y la propiedad en la capa de aplicación (`SupabaseJwtGuard` y
--     `assertResourceOwnership`). Estas políticas protegen ante accesos directos
--     via PostgREST / Supabase Data API con rol `authenticated`.
-- ============================================================================

BEGIN;

-- 1. Habilitar Row Level Security en las 7 tablas de negocio
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaccion_etiquetas ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para public.usuarios
DROP POLICY IF EXISTS usuarios_aislamiento_usuario ON public.usuarios;
CREATE POLICY usuarios_aislamiento_usuario
    ON public.usuarios
    FOR ALL
    TO authenticated
    USING (usr_id = auth.uid())
    WITH CHECK (usr_id = auth.uid());

-- 3. Políticas para public.cuentas
DROP POLICY IF EXISTS cuentas_aislamiento_usuario ON public.cuentas;
CREATE POLICY cuentas_aislamiento_usuario
    ON public.cuentas
    FOR ALL
    TO authenticated
    USING (cta_usr_id = auth.uid())
    WITH CHECK (cta_usr_id = auth.uid());

-- 4. Políticas para public.categorias
DROP POLICY IF EXISTS categorias_aislamiento_usuario ON public.categorias;
CREATE POLICY categorias_aislamiento_usuario
    ON public.categorias
    FOR ALL
    TO authenticated
    USING (cat_usr_id = auth.uid())
    WITH CHECK (cat_usr_id = auth.uid());

-- 5. Políticas para public.etiquetas
DROP POLICY IF EXISTS etiquetas_aislamiento_usuario ON public.etiquetas;
CREATE POLICY etiquetas_aislamiento_usuario
    ON public.etiquetas
    FOR ALL
    TO authenticated
    USING (etq_usr_id = auth.uid())
    WITH CHECK (etq_usr_id = auth.uid());

-- 6. Políticas para public.transacciones (propiedad heredada vía public.cuentas)
DROP POLICY IF EXISTS transacciones_aislamiento_usuario ON public.transacciones;
CREATE POLICY transacciones_aislamiento_usuario
    ON public.transacciones
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.cuentas c
            WHERE c.cta_id = trx_cta_id
              AND c.cta_usr_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.cuentas c
            WHERE c.cta_id = trx_cta_id
              AND c.cta_usr_id = auth.uid()
        )
    );

-- 7. Políticas para public.transaccion_etiquetas (propiedad heredada vía transacciones -> cuentas)
DROP POLICY IF EXISTS transaccion_etiquetas_aislamiento_usuario ON public.transaccion_etiquetas;
CREATE POLICY transaccion_etiquetas_aislamiento_usuario
    ON public.transaccion_etiquetas
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.transacciones t
            JOIN public.cuentas c ON c.cta_id = t.trx_cta_id
            WHERE t.trx_id = txe_trx_id
              AND c.cta_usr_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.transacciones t
            JOIN public.cuentas c ON c.cta_id = t.trx_cta_id
            WHERE t.trx_id = txe_trx_id
              AND c.cta_usr_id = auth.uid()
        )
    );

-- 8. Políticas para public.series (propiedad heredada vía transacciones -> cuentas)
DROP POLICY IF EXISTS series_aislamiento_usuario ON public.series;
CREATE POLICY series_aislamiento_usuario
    ON public.series
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.transacciones t
            JOIN public.cuentas c ON c.cta_id = t.trx_cta_id
            WHERE t.trx_ser_id = ser_id
              AND c.cta_usr_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.transacciones t
            JOIN public.cuentas c ON c.cta_id = t.trx_cta_id
            WHERE t.trx_ser_id = ser_id
              AND c.cta_usr_id = auth.uid()
        )
    );

COMMIT;
