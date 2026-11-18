import { ValidationPipe } from '@nestjs/common';
import { RestablecerPasswordRequest } from './restablecer-password.request';

describe('RestablecerPasswordRequest', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const validPayload = {
    password: 'NewPassword123',
  };

  it('acepta un payload válido con al menos 8 caracteres', async () => {
    const result: unknown = await pipe.transform(validPayload, {
      type: 'body',
      metatype: RestablecerPasswordRequest,
    });

    expect(result).toBeInstanceOf(RestablecerPasswordRequest);
    expect(result).toEqual(validPayload);
  });

  it('acepta un password de exactamente 8 caracteres', async () => {
    const result: unknown = await pipe.transform(
      { password: '12345678' },
      { type: 'body', metatype: RestablecerPasswordRequest },
    );

    expect(result).toBeInstanceOf(RestablecerPasswordRequest);
    expect(result).toEqual({ password: '12345678' });
  });

  it('rechaza password menor a 8 caracteres', async () => {
    await expect(
      pipe.transform(
        { password: '1234567' },
        { type: 'body', metatype: RestablecerPasswordRequest },
      ),
    ).rejects.toThrow();
  });

  it('rechaza password no string o vacío', async () => {
    await expect(
      pipe.transform(
        { password: 12345678 },
        { type: 'body', metatype: RestablecerPasswordRequest },
      ),
    ).rejects.toThrow();

    await expect(
      pipe.transform(
        { password: '' },
        { type: 'body', metatype: RestablecerPasswordRequest },
      ),
    ).rejects.toThrow();
  });

  it('rechaza propiedades adicionales no permitidas', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, extra: 'no-permitido' },
        { type: 'body', metatype: RestablecerPasswordRequest },
      ),
    ).rejects.toThrow();
  });
});
