import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { DomainError } from '../domain/domain.error';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('formatea DomainError puro con { statusCode, code, message, details }', () => {
    const error = new DomainError(
      'CORREO_YA_REGISTRADO',
      'El correo ya existe',
      HttpStatus.CONFLICT,
      { field: 'correo' },
    );

    filter.catch(error, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 409,
      code: 'CORREO_YA_REGISTRADO',
      message: 'El correo ya existe',
      details: { field: 'correo' },
    });
  });

  it('formatea errores de ValidationPipe (BadRequestException con array) en formato uniforme', () => {
    const exception = new BadRequestException([
      'correo must be an email',
      'nombre should not be empty',
    ]);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Error de validación',
      details: ['correo must be an email', 'nombre should not be empty'],
    });
  });

  it('formatea HttpException estándar en formato uniforme', () => {
    const exception = new NotFoundException('Recurso no encontrado');

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Recurso no encontrado',
      details: null,
    });
  });

  it('formatea excepciones no controladas como 500 sin filtrar detalles internos', () => {
    const exception = new Error('Sensitive connection string leak');

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor',
      details: null,
    });
  });
});
