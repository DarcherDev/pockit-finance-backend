import { ValidationPipe } from '@nestjs/common';
import { LoginRequest } from './login.request';

describe('LoginRequest', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const validPayload = {
    correo: 'ana@pockit.finance',
    password: 'Password123',
  };

  it('acepta un payload válido', async () => {
    const result: unknown = await pipe.transform(validPayload, {
      type: 'body',
      metatype: LoginRequest,
    });

    expect(result).toBeInstanceOf(LoginRequest);
    expect(result).toEqual(validPayload);
  });

  it('rechaza correo inválido', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, correo: 'correo-invalido' },
        { type: 'body', metatype: LoginRequest },
      ),
    ).rejects.toThrow();
  });

  it('rechaza correo mayor a 255 caracteres', async () => {
    const longLocal = 'a'.repeat(245);
    await expect(
      pipe.transform(
        { ...validPayload, correo: `${longLocal}@pockit.com` },
        { type: 'body', metatype: LoginRequest },
      ),
    ).rejects.toThrow();
  });

  it('rechaza password vacío o no string', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, password: '' },
        { type: 'body', metatype: LoginRequest },
      ),
    ).rejects.toThrow();

    await expect(
      pipe.transform(
        { ...validPayload, password: 12345 },
        { type: 'body', metatype: LoginRequest },
      ),
    ).rejects.toThrow();
  });

  it('rechaza propiedades adicionales no permitidas', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, extra: 'no-permitido' },
        { type: 'body', metatype: LoginRequest },
      ),
    ).rejects.toThrow();
  });
});
