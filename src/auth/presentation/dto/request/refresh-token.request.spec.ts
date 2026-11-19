import { ValidationPipe } from '@nestjs/common';
import { RefreshTokenRequest } from './refresh-token.request';

describe('RefreshTokenRequest', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it('acepta un refreshToken válido', async () => {
    const validPayload = { refreshToken: 'valid-refresh-token' };
    const result: unknown = await pipe.transform(validPayload, {
      type: 'body',
      metatype: RefreshTokenRequest,
    });

    expect(result).toBeInstanceOf(RefreshTokenRequest);
    expect(result).toEqual(validPayload);
  });

  it('rechaza refreshToken vacío o no string', async () => {
    await expect(
      pipe.transform(
        { refreshToken: '' },
        { type: 'body', metatype: RefreshTokenRequest },
      ),
    ).rejects.toThrow();

    await expect(
      pipe.transform(
        { refreshToken: 123 },
        { type: 'body', metatype: RefreshTokenRequest },
      ),
    ).rejects.toThrow();
  });

  it('rechaza propiedades adicionales no permitidas', async () => {
    await expect(
      pipe.transform(
        { refreshToken: 'valid-refresh-token', extra: 'no-permitido' },
        { type: 'body', metatype: RefreshTokenRequest },
      ),
    ).rejects.toThrow();
  });
});
