import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  numericMoneyTransformer,
  utcTimestampTransformer,
} from '../../../../common/serialization';
import type { NaturalezaCuenta } from '../../../domain/model/cuenta.model';

/**
 * Entidad TypeORM mapeada 1:1 con `public.cuentas` en `pockit-ares.sql`.
 */
@Entity({ name: 'cuentas', schema: 'public' })
export class CuentaEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cta_id' })
  ctaId!: string;

  @Column({ type: 'uuid', name: 'cta_usr_id' })
  ctaUsrId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'cta_cta_padre_id' })
  ctaCtaPadreId!: string | null;

  @Column({
    type: 'enum',
    enum: ['BANCO', 'BILLETERA'],
    enumName: 'naturaleza_cuenta',
    nullable: true,
    name: 'cta_naturaleza',
  })
  ctaNaturaleza!: NaturalezaCuenta | null;

  @Column({ type: 'varchar', length: 100, name: 'cta_nombre' })
  ctaNombre!: string;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'cta_saldo_inicial',
    transformer: numericMoneyTransformer,
  })
  ctaSaldoInicial!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'cta_saldo_actual',
    transformer: numericMoneyTransformer,
  })
  ctaSaldoActual!: number;

  @Column({ type: 'varchar', length: 20, name: 'cta_color' })
  ctaColor!: string;

  @Column({ type: 'varchar', length: 50, name: 'cta_icono' })
  ctaIcono!: string;

  @Column({ type: 'boolean', default: true, name: 'cta_activa' })
  ctaActiva!: boolean;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'cta_creado_en',
    transformer: utcTimestampTransformer,
  })
  ctaCreadoEn!: string;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'cta_actualizado_en',
    transformer: utcTimestampTransformer,
  })
  ctaActualizadoEn!: string;
}
