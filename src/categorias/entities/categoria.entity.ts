import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { utcTimestampTransformer } from '../../common/serialization';

export type NaturalezaMovimiento = 'INGRESO' | 'GASTO';

/**
 * Entidad TypeORM mapeada 1:1 con `public.categorias` en `pockit-ares.sql`.
 */
@Entity({ name: 'categorias', schema: 'public' })
export class CategoriaEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cat_id' })
  catId!: string;

  @Column({ type: 'uuid', name: 'cat_usr_id' })
  catUsrId!: string;

  @Column({ type: 'varchar', length: 100, name: 'cat_nombre' })
  catNombre!: string;

  @Column({
    type: 'enum',
    enum: ['INGRESO', 'GASTO'],
    enumName: 'naturaleza_movimiento',
    name: 'cat_naturaleza',
  })
  catNaturaleza!: NaturalezaMovimiento;

  @Column({ type: 'varchar', length: 20, name: 'cat_color' })
  catColor!: string;

  @Column({ type: 'varchar', length: 50, name: 'cat_icono' })
  catIcono!: string;

  @Column({ type: 'boolean', default: false, name: 'cat_es_sistema' })
  catEsSistema!: boolean;

  @Column({ type: 'boolean', default: true, name: 'cat_activa' })
  catActiva!: boolean;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'cat_creado_en',
    transformer: utcTimestampTransformer,
  })
  catCreadoEn!: string;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'cat_actualizado_en',
    transformer: utcTimestampTransformer,
  })
  catActualizadoEn!: string;
}
