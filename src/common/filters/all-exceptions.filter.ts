import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../domain/domain.error';

interface ErrorResponseBody {
  statusCode: number;
  code: string;
  message: string;
  details: unknown;
}

const HTTP_STATUS_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const body = this.buildErrorBody(exception);
    response.status(body.statusCode).json(body);
  }

  private buildErrorBody(exception: unknown): ErrorResponseBody {
    if (exception instanceof DomainError) {
      return {
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        details: exception.details ?? null,
      };
    }

    if (exception instanceof HttpException) {
      return this.formatHttpException(exception);
    }

    this.logger.error(
      'Excepción no controlada',
      exception instanceof Error ? exception.stack : String(exception),
    );

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor',
      details: null,
    };
  }

  private formatHttpException(exception: HttpException): ErrorResponseBody {
    const statusCode = exception.getStatus();
    const rawResponse = exception.getResponse();

    if (typeof rawResponse === 'object' && rawResponse !== null) {
      const resObj = rawResponse as Record<string, unknown>;

      if (Array.isArray(resObj.message)) {
        return {
          statusCode,
          code: 'VALIDATION_ERROR',
          message: 'Error de validación',
          details: resObj.message,
        };
      }

      return {
        statusCode,
        code:
          typeof resObj.code === 'string'
            ? resObj.code
            : (HTTP_STATUS_CODES[statusCode] ?? 'HTTP_ERROR'),
        message:
          typeof resObj.message === 'string'
            ? resObj.message
            : exception.message,
        details: 'details' in resObj ? (resObj.details ?? null) : null,
      };
    }

    return {
      statusCode,
      code: HTTP_STATUS_CODES[statusCode] ?? 'HTTP_ERROR',
      message:
        typeof rawResponse === 'string' ? rawResponse : exception.message,
      details: null,
    };
  }
}
