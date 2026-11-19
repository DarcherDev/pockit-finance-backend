/**
 * Modelo puro de dominio que representa el estado operativo del servicio y su base de datos.
 */
export interface HealthStatus {
  status: 'ok';
  database: 'up';
}
