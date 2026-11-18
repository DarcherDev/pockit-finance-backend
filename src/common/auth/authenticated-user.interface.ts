/**
 * Representa al usuario autenticado extraído del JWT verificado de Supabase Auth.
 */
export interface AuthenticatedUser {
  usrId: string;
  email?: string;
}
