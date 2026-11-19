import {
  addMoney,
  roundMoney,
} from '../../../common/serialization/numeric-money.serializer';
import type { CuentaConSaldosModel, CuentaModel } from '../model/cuenta.model';

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

      const saldoPropio = roundMoney(padre.ctaSaldoActual);
      const saldoSubcuentas = subcuentasActivas.reduce(
        (acc, sub) => addMoney(acc, sub.ctaSaldoActual),
        0,
      );
      const saldoConsolidado = addMoney(saldoPropio, saldoSubcuentas);

      return {
        ...padre,
        saldoPropio,
        saldoSubcuentas,
        saldoConsolidado,
        subcuentas: subcuentasVisibles,
      };
    });
};
