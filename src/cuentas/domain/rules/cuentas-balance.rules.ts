import {
  addMoney,
  roundMoney,
} from '../../../common/serialization/numeric-money.serializer';
import type { CuentaConSaldosModel, CuentaModel } from '../model/cuenta.model';

const buildCuentaConSaldos = (
  cuenta: CuentaModel,
  subcuentasVisibles: CuentaModel[],
  subcuentasActivas: CuentaModel[],
): CuentaConSaldosModel => {
  const saldoPropio = roundMoney(cuenta.ctaSaldoActual);
  const saldoSubcuentas = subcuentasActivas.reduce(
    (acc, sub) => addMoney(acc, sub.ctaSaldoActual),
    0,
  );
  const saldoConsolidado = addMoney(saldoPropio, saldoSubcuentas);

  return {
    ...cuenta,
    saldoPropio,
    saldoSubcuentas,
    saldoConsolidado,
    subcuentas: subcuentasVisibles,
  };
};

export const construirDetalleCuenta = (
  cuenta: CuentaModel,
  subcuentas: CuentaModel[],
): CuentaConSaldosModel => {
  const subcuentasActivas = subcuentas.filter((sub) => sub.ctaActiva);
  return buildCuentaConSaldos(cuenta, subcuentas, subcuentasActivas);
};

export const construirJerarquiaCuentas = (
  cuentas: CuentaModel[],
  incluirInactivas: boolean,
): CuentaConSaldosModel[] => {
  const subcuentasPorPadre = new Map<string, CuentaModel[]>();

  for (const cuenta of cuentas) {
    if (cuenta.ctaCtaPadreId !== null) {
      const lista = subcuentasPorPadre.get(cuenta.ctaCtaPadreId) ?? [];
      lista.push(cuenta);
      subcuentasPorPadre.set(cuenta.ctaCtaPadreId, lista);
    }
  }

  return cuentas
    .filter(
      (cuenta) =>
        cuenta.ctaCtaPadreId === null && (incluirInactivas || cuenta.ctaActiva),
    )
    .map((padre) => {
      const todasSubcuentas = subcuentasPorPadre.get(padre.ctaId) ?? [];
      const subcuentasActivas = todasSubcuentas.filter((sub) => sub.ctaActiva);
      const subcuentasVisibles = incluirInactivas
        ? todasSubcuentas
        : subcuentasActivas;

      return buildCuentaConSaldos(padre, subcuentasVisibles, subcuentasActivas);
    });
};
