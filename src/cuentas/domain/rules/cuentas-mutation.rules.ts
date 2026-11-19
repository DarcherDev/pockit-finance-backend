import { DomainError } from '../../../common/domain';
import {
  addMoney,
  roundMoney,
  subtractMoney,
} from '../../../common/serialization/numeric-money.serializer';
import type { CuentaModel } from '../model/cuenta.model';

/**
 * Recalcula el saldo inicial normalizado y ajusta el saldo actual preservando el delta.
 */
export const calcularActualizacionSaldoInicial = (
  saldoInicialActual: number,
  saldoActual: number,
  nuevoSaldoInicial: number,
): { ctaSaldoInicial: number; ctaSaldoActual: number } => {
  const saldoInicialNormalizado = roundMoney(nuevoSaldoInicial);
  const delta = subtractMoney(saldoInicialNormalizado, saldoInicialActual);
  const nuevoSaldoActual = addMoney(saldoActual, delta);

  return {
    ctaSaldoInicial: saldoInicialNormalizado,
    ctaSaldoActual: nuevoSaldoActual,
  };
};

/**
 * Valida las reglas de negocio para la edición de una cuenta o subcuenta.
 */
export const validarEdicionCuenta = (
  cuenta: CuentaModel,
  tieneNaturalezaEnPayload: boolean,
): void => {
  if (cuenta.ctaCtaPadreId !== null && tieneNaturalezaEnPayload) {
    throw new DomainError(
      'SUBCUENTA_NO_ADMITE_NATURALEZA',
      'Las subcuentas heredan la naturaleza de su cuenta padre y no admiten ctaNaturaleza.',
      422,
    );
  }
};
