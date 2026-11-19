/**
 * Modelo puro de dominio que representa un usuario registrado en Pockit Finance.
 */
export interface Usuario {
  usrId: string;
  usrCorreo: string;
  usrNombre: string;
  usrApellido: string;
  usrEdad: number;
  usrCreadoEn: string;
  usrActualizadoEn: string;
}

export interface CreateUsuarioData {
  usrId: string;
  usrCorreo: string;
  usrNombre: string;
  usrApellido: string;
  usrEdad: number;
}
