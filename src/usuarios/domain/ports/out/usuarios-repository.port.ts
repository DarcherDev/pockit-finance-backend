import type { TransactionContext } from '../../../../common/domain';
import type { CreateUsuarioData, Usuario } from '../../model/usuario.model';

export const USUARIOS_REPOSITORY_PORT = Symbol('USUARIOS_REPOSITORY_PORT');

/**
 * Puerto de salida para persistencia y consulta de usuarios sin acoplamiento a TypeORM.
 */
export interface UsuariosRepositoryPort {
  findById(usrId: string): Promise<Usuario | null>;
  findByCorreo(
    correo: string,
    tx?: TransactionContext,
  ): Promise<Usuario | null>;
  create(data: CreateUsuarioData, tx?: TransactionContext): Promise<Usuario>;
}
