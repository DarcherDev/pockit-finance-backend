import { Injectable } from '@nestjs/common';
import type {
  CuentaConSaldosModel,
  CuentaModel,
} from '../../domain/model/cuenta.model';
import { CuentaJerarquicaResponse } from '../../presentation/dto/response/cuenta-jerarquica.response';
import { CuentaResponse } from '../../presentation/dto/response/cuenta.response';

@Injectable()
export class CuentasMapper {
  toResponse(model: CuentaModel): CuentaResponse {
    const response = new CuentaResponse();
    response.ctaId = model.ctaId;
    response.ctaUsrId = model.ctaUsrId;
    response.ctaCtaPadreId = model.ctaCtaPadreId;
    response.ctaNaturaleza = model.ctaNaturaleza;
    response.ctaNombre = model.ctaNombre;
    response.ctaSaldoInicial = model.ctaSaldoInicial;
    response.ctaSaldoActual = model.ctaSaldoActual;
    response.ctaColor = model.ctaColor;
    response.ctaIcono = model.ctaIcono;
    response.ctaActiva = model.ctaActiva;
    response.ctaCreadoEn = model.ctaCreadoEn;
    response.ctaActualizadoEn = model.ctaActualizadoEn;
    return response;
  }

  toJerarquicaResponse(
    model: CuentaConSaldosModel,
  ): CuentaJerarquicaResponse {
    const response = new CuentaJerarquicaResponse();
    Object.assign(response, this.toResponse(model));
    response.saldoPropio = model.saldoPropio;
    response.saldoSubcuentas = model.saldoSubcuentas;
    response.saldoConsolidado = model.saldoConsolidado;
    response.subcuentas = model.subcuentas.map((sub) => this.toResponse(sub));
    return response;
  }
}
