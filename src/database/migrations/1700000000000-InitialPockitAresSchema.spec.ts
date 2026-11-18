import { QueryRunner } from 'typeorm';
import { InitialPockitAresSchema1700000000000 } from './1700000000000-InitialPockitAresSchema';

describe('InitialPockitAresSchema1700000000000', () => {
  let migration: InitialPockitAresSchema1700000000000;
  let queryRunner: { query: jest.Mock };

  beforeEach(() => {
    migration = new InitialPockitAresSchema1700000000000();
    queryRunner = {
      query: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('up ejecuta creación de 6 ENUMs, 7 tablas, índices y esquema_versiones sin BEGIN/COMMIT', async () => {
    await migration.up(queryRunner as unknown as QueryRunner);

    expect(queryRunner.query).toHaveBeenCalled();
    const fullSql = queryRunner.query.mock.calls
      .map((call: [string]) => call[0])
      .join('\n');

    expect(fullSql).not.toMatch(/\bBEGIN\b/i);
    expect(fullSql).not.toMatch(/\bCOMMIT\b/i);

    for (const enumName of [
      'public.naturaleza_cuenta',
      'public.naturaleza_movimiento',
      'public.estado_transaccion',
      'public.tipo_registro_transaccion',
      'public.tipo_serie',
      'public.frecuencia_serie',
    ]) {
      expect(fullSql).toContain(`CREATE TYPE ${enumName}`);
    }

    for (const tableName of [
      'public.usuarios',
      'public.cuentas',
      'public.categorias',
      'public.etiquetas',
      'public.series',
      'public.transacciones',
      'public.transaccion_etiquetas',
    ]) {
      expect(fullSql).toContain(`CREATE TABLE ${tableName}`);
    }

    expect(fullSql).toContain(
      'CREATE TABLE IF NOT EXISTS public.esquema_versiones',
    );
    expect(fullSql).toContain('INSERT INTO public.esquema_versiones');

    for (const constraintName of [
      'chk_cta_no_autopadre',
      'chk_cta_naturaleza_principal',
      'chk_ser_cuotas',
      'chk_trx_no_autopar',
      'chk_trx_origen_coherente',
    ]) {
      expect(fullSql).toContain(`CONSTRAINT ${constraintName}`);
    }

    for (const indexName of [
      'idx_cta_usr_id',
      'idx_cta_cta_padre_id',
      'uq_cat_usr_nombre_naturaleza',
      'uq_etq_usr_nombre',
      'idx_ser_activas_proxima',
      'idx_trx_cta_fecha',
      'idx_trx_cat_fecha',
      'idx_trx_estado',
      'idx_trx_ser_id',
      'idx_txe_etq_id',
    ]) {
      expect(fullSql).toContain(indexName);
    }
  });

  it('down elimina índices, 7 tablas y 6 ENUMs en orden inverso sin BEGIN/COMMIT', async () => {
    await migration.down(queryRunner as unknown as QueryRunner);

    expect(queryRunner.query).toHaveBeenCalled();
    const fullSql = queryRunner.query.mock.calls
      .map((call: [string]) => call[0])
      .join('\n');

    expect(fullSql).not.toMatch(/\bBEGIN\b/i);
    expect(fullSql).not.toMatch(/\bCOMMIT\b/i);

    for (const indexName of [
      'idx_txe_etq_id',
      'idx_trx_ser_id',
      'idx_trx_estado',
      'idx_trx_cat_fecha',
      'idx_trx_cta_fecha',
      'idx_ser_activas_proxima',
      'uq_etq_usr_nombre',
      'uq_cat_usr_nombre_naturaleza',
      'idx_cta_cta_padre_id',
      'idx_cta_usr_id',
    ]) {
      expect(fullSql).toContain(`DROP INDEX IF EXISTS public.${indexName}`);
    }

    expect(fullSql).toContain(
      'DROP TABLE IF EXISTS public.transaccion_etiquetas',
    );
    expect(fullSql).toContain('DROP TABLE IF EXISTS public.transacciones');
    expect(fullSql).toContain('DROP TABLE IF EXISTS public.series');
    expect(fullSql).toContain('DROP TABLE IF EXISTS public.etiquetas');
    expect(fullSql).toContain('DROP TABLE IF EXISTS public.categorias');
    expect(fullSql).toContain('DROP TABLE IF EXISTS public.cuentas');
    expect(fullSql).toContain('DROP TABLE IF EXISTS public.usuarios');
    expect(fullSql).toContain('DROP TYPE IF EXISTS public.frecuencia_serie');
    expect(fullSql).toContain('DROP TYPE IF EXISTS public.naturaleza_cuenta');
  });
});
