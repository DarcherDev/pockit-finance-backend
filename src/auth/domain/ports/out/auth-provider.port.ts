import type {
  AuthProviderUser,
  AuthSession,
  CreateAuthUserParams,
  RefreshedAuthSession,
} from '../../model/auth-session.model';

export const AUTH_PROVIDER_PORT = Symbol('AUTH_PROVIDER_PORT');

/**
 * Puerto de salida para delegar identidad, sesiones y recuperación al proveedor de autenticación.
 */
export interface AuthProviderPort {
  createUser(params: CreateAuthUserParams): Promise<AuthProviderUser>;
  deleteUser(userId: string): Promise<void>;
  signInWithPassword(email: string, password: string): Promise<AuthSession>;
  refreshSession(refreshToken: string): Promise<RefreshedAuthSession>;
  resetPasswordForEmail(email: string, redirectTo: string): Promise<void>;
  updatePasswordWithRecoveryToken(
    accessToken: string,
    newPassword: string,
  ): Promise<void>;
}
