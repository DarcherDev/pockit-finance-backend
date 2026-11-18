import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { generateKeyPairSync } from 'crypto';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { DomainException } from '../../common/exceptions/domain.exception';
import { UsuarioResponse } from '../../usuarios/dto/response/usuario.response';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SupabaseJwtGuard } from './supabase-jwt.guard';

jest.mock('jwks-rsa', () => jest.fn());

describe('SupabaseJwtGuard', () => {
  const supabaseUrl = 'https://demo-project.supabase.co/';
  const expectedIssuer = 'https://demo-project.supabase.co/auth/v1';
  const jwksUri =
    'https://demo-project.supabase.co/auth/v1/.well-known/jwks.json';
  const validUsrId = '550e8400-e29b-41d4-a716-446655440000';

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const { privateKey: otherPrivateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  let guard: SupabaseJwtGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'getOrThrow'>>;
  let usuariosService: jest.Mocked<Pick<UsuariosService, 'findById'>>;
  let mockGetSigningKey: jest.Mock;

  const createMockContext = (
    authorization?: string,
  ): {
    context: ExecutionContext;
    request: {
      headers: Record<string, string | undefined>;
      user?: AuthenticatedUser;
    };
  } => {
    const request: {
      headers: Record<string, string | undefined>;
      user?: AuthenticatedUser;
    } = {
      headers: authorization !== undefined ? { authorization } : {},
    };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  };

  const signToken = (
    payload: Record<string, unknown>,
    options: jwt.SignOptions = {},
    signingKey: string = privateKey,
  ): string =>
    jwt.sign(payload, signingKey, {
      algorithm: 'RS256',
      keyid: 'test-kid-1',
      audience: 'authenticated',
      issuer: expectedIssuer,
      expiresIn: '1h',
      ...options,
    });

  beforeEach(() => {
    mockGetSigningKey = jest.fn().mockResolvedValue({
      getPublicKey: () => publicKey,
    });

    (jwksClient as unknown as jest.Mock).mockReturnValue({
      getSigningKey: mockGetSigningKey,
    });

    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    };

    configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'SUPABASE_JWKS_URL') return jwksUri;
        if (key === 'SUPABASE_URL') return supabaseUrl;
        throw new Error(`Unexpected config key: ${key}`);
      }),
    };

    const usuario = new UsuarioResponse();
    usuario.usrId = validUsrId;
    usuario.usrCorreo = 'ana@pockit.finance';

    usuariosService = {
      findById: jest.fn().mockResolvedValue(usuario),
    };

    guard = new SupabaseJwtGuard(
      reflector as unknown as Reflector,
      configService as unknown as ConfigService,
      usuariosService as unknown as UsuariosService,
    );
  });

  it('permite el acceso sin token cuando la ruta tiene @Public()', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const { context } = createMockContext();

    const allowed = await guard.canActivate(context);

    expect(allowed).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    expect(usuariosService.findById).not.toHaveBeenCalled();
  });

  it('permite el acceso con token válido, usuario existente y adjunta request.user', async () => {
    const token = signToken({
      sub: validUsrId,
      email: 'ana@pockit.finance',
    });
    const { context, request } = createMockContext(`Bearer ${token}`);

    const allowed = await guard.canActivate(context);

    expect(allowed).toBe(true);
    expect(mockGetSigningKey).toHaveBeenCalledWith('test-kid-1');
    expect(usuariosService.findById).toHaveBeenCalledWith(validUsrId);
    expect(request.user).toEqual({
      usrId: validUsrId,
      email: 'ana@pockit.finance',
    });
  });

  it('rechaza con 401 DomainException cuando falta el header Authorization', async () => {
    const { context } = createMockContext();

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
    });
  });

  it.each(['Basic abc123', 'Bearer', 'Bearer   ', 'Token abc'])(
    'rechaza con 401 DomainException cuando el header Authorization es "%s"',
    async (header) => {
      const { context } = createMockContext(header);

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        DomainException,
      );
      await expect(guard.canActivate(context)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    },
  );

  it('rechaza con 401 DomainException cuando la firma del token es inválida', async () => {
    const token = signToken(
      { sub: validUsrId, email: 'ana@pockit.finance' },
      {},
      otherPrivateKey,
    );
    const { context } = createMockContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      code: 'TOKEN_INVALIDO',
    });
  });

  it('rechaza con 401 DomainException cuando el token está expirado', async () => {
    const token = signToken(
      { sub: validUsrId, email: 'ana@pockit.finance' },
      { expiresIn: -10 },
    );
    const { context } = createMockContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      code: 'TOKEN_EXPIRADO',
    });
  });

  it('rechaza con 401 DomainException cuando aud es inválido', async () => {
    const token = signToken(
      { sub: validUsrId, email: 'ana@pockit.finance' },
      { audience: 'anon' },
    );
    const { context } = createMockContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      code: 'TOKEN_INVALIDO',
    });
  });

  it('rechaza con 401 DomainException cuando iss es inválido', async () => {
    const token = signToken(
      { sub: validUsrId, email: 'ana@pockit.finance' },
      { issuer: 'https://otro-proyecto.supabase.co/auth/v1' },
    );
    const { context } = createMockContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      code: 'TOKEN_INVALIDO',
    });
  });

  it('rechaza con 401 DomainException cuando falta sub en el payload', async () => {
    const token = signToken({ email: 'ana@pockit.finance' });
    const { context } = createMockContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      code: 'TOKEN_INVALIDO',
    });
  });

  it('rechaza con 401 DomainException cuando el usuario no existe en public.usuarios', async () => {
    usuariosService.findById.mockResolvedValue(null);
    const token = signToken({ sub: validUsrId, email: 'ana@pockit.finance' });
    const { context } = createMockContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      code: 'USUARIO_NO_REGISTRADO',
    });
  });
});
