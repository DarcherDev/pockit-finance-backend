import { ValidationPipe } from '@nestjs/common';
import { RecuperarPasswordRequest } from './recuperar-password.request';

describe('RecuperarPasswordRequest', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const validPayload = {
    correo: 'ana@pockit.finance',
  };

  it('acepta un payload válido', async () => {
    const result: unknown = await pipe.transform(validPayload, {
      type: 'body',
      metatype: RecuperarPasswordRequest,
    });

    expect(result).toBeInstanceOf(RecuperarPasswordRequest);
    expect(result).toEqual(validPayload);
  });

  it('rechaza correo inválido', async () => {
    await expect(
      pipe.transform(
        { correo: 'correo-invalido' },
        { type: 'body', metatype: RecuperarPasswordRequest },
      ),
    ).rejects.toThrow();
  });

  it('rechaza correo mayor a 255 caracteres', async () => {
    const longLocal = 'a'.repeat(245);
    await expect(
      pipe.transform(
        { correo: `${longLocal}@pockit.com` },
        { type: 'body', metatype: RecuperarPasswordRequest },
      ),
    ).rejects.toThrow();
  });

  it('rechaza correo faltante', async () => {
    await expect(
      pipe.transform({}, { type: 'body', metatype: RecuperarPasswordRequest }),
    ).rejects.toThrow();
  });

  it('rechaza propiedades adicionales no permitidas', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, extra: 'no-permitido' },
        { type: 'body', metatype: RecuperarPasswordRequest },
      ),
    ).rejects.toThrow();
  });
});
