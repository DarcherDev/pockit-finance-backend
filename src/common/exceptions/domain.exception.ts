import { HttpException, HttpStatus } from '@nestjs/common';

export interface DomainExceptionPayload {
  statusCode: number;
  code: string;
  message: string;
  details: unknown;
}

export class DomainException extends HttpException {
  public readonly code: string;
  public readonly details: unknown;

  constructor(
    code: string,
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
    details: unknown = null,
  ) {
    super({ statusCode, code, message, details }, statusCode);
    this.code = code;
    this.details = details;
  }
}
