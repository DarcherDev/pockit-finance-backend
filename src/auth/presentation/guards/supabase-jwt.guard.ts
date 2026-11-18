import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';
import { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { UsuariosService } from '../../../usuarios/application/services/usuarios.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface RequestWithAuth {
  headers: {
    authorization?: string;
  };
  user?: AuthenticatedUser;
}

interface SupabaseJwtPayload extends jwt.JwtPayload {
  sub?: string;
  email?: string;
}

/**
 * Guard global que valida criptográficamente el JWT emitido por Supabase Auth
 * mediante JWKS (`RS256`/`ES256`) y verifica que el usuario exista en `public.usuarios`.
 */
@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  private readonly client: JwksClient;
  private readonly expectedIssuer: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    const jwksUri = this.configService.getOrThrow<string>('SUPABASE_JWKS_URL');
    const supabaseUrl = this.configService
      .getOrThrow<string>('SUPABASE_URL')
      .replace(/\/+$/, '');

    this.expectedIssuer = `${supabaseUrl}/auth/v1`;
    this.client = jwksClient({
      jwksUri,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = this.extractBearerToken(request.headers.authorization);
    const payload = await this.verifyJwt(token);

    if (typeof payload.sub !== 'string' || payload.sub.trim().length === 0) {
      throw new DomainException(
        'TOKEN_INVALIDO',
        'El token de autenticación no contiene un identificador de usuario válido',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const usuario = await this.usuariosService.findById(payload.sub);
    if (!usuario) {
      throw new DomainException(
        'USUARIO_NO_REGISTRADO',
        'El usuario autenticado no se encuentra registrado',
        HttpStatus.UNAUTHORIZED,
      );
    }

    request.user = {
      usrId: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };

    return true;
  }

  private extractBearerToken(authorizationHeader?: string): string {
    if (!authorizationHeader) {
      throw new DomainException(
        'TOKEN_NO_PROPORCIONADO',
        'Token de autenticación requerido',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const parts = authorizationHeader.trim().split(/\s+/);
    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !== 'bearer' ||
      !parts[1]
    ) {
      throw new DomainException(
        'TOKEN_INVALIDO',
        'Formato de encabezado Authorization inválido; se esperaba Bearer <token>',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return parts[1];
  }

  private verifyJwt(token: string): Promise<SupabaseJwtPayload> {
    return new Promise((resolve, reject) => {
      const getKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
        if (!header.kid) {
          callback(new Error('Token sin kid en el encabezado'));
          return;
        }

        this.client
          .getSigningKey(header.kid)
          .then((key) => callback(null, key.getPublicKey()))
          .catch((err: unknown) =>
            callback(err instanceof Error ? err : new Error(String(err))),
          );
      };

      jwt.verify(
        token,
        getKey,
        {
          algorithms: ['RS256', 'ES256'],
          audience: 'authenticated',
          issuer: this.expectedIssuer,
        },
        (error, decoded) => {
          if (error) {
            if (error instanceof jwt.TokenExpiredError) {
              reject(
                new DomainException(
                  'TOKEN_EXPIRADO',
                  'El token de autenticación ha expirado',
                  HttpStatus.UNAUTHORIZED,
                ),
              );
              return;
            }

            reject(
              new DomainException(
                'TOKEN_INVALIDO',
                'Token de autenticación inválido',
                HttpStatus.UNAUTHORIZED,
              ),
            );
            return;
          }

          if (!decoded || typeof decoded === 'string') {
            reject(
              new DomainException(
                'TOKEN_INVALIDO',
                'Payload de token inválido',
                HttpStatus.UNAUTHORIZED,
              ),
            );
            return;
          }

          resolve(decoded);
        },
      );
    });
  }
}
