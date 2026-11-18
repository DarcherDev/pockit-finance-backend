import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { utcTimestampTransformer } from '../../common/serialization';

/**
 * Entidad TypeORM mapeada 1:1 con `public.usuarios` en `pockit-ares.sql`.
 */
@Entity({ name: 'usuarios', schema: 'public' })
export class UsuarioEntity {
  @PrimaryColumn({ type: 'uuid', name: 'usr_id' })
  usrId!: string;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'usr_correo' })
  usrCorreo!: string;

  @Column({ type: 'varchar', length: 100, name: 'usr_nombre' })
  usrNombre!: string;

  @Column({ type: 'varchar', length: 100, name: 'usr_apellido' })
  usrApellido!: string;

  @Column({ type: 'smallint', name: 'usr_edad' })
  usrEdad!: number;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'usr_creado_en',
    transformer: utcTimestampTransformer,
  })
  usrCreadoEn!: string;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'usr_actualizado_en',
    transformer: utcTimestampTransformer,
  })
  usrActualizadoEn!: string;
}
