export const HEALTH_PROBE_PORT = Symbol('HEALTH_PROBE_PORT');

/**
 * Puerto de salida para verificar conectividad contra el motor de persistencia.
 */
export interface HealthProbePort {
  pingDatabase(): Promise<void>;
}
