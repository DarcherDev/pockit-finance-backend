import { ValidationPipe } from '@nestjs/common';
import { RegistroRequest } from './registro.request';

describe('RegistroRequest', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const validPayload = {
    correo: 'ana@pockit.finance',
    password: 'Password123',
    nombre: 'Ana',
    apellido: 'García',
    edad: 28,
  };

  it('acepta un payload válido', async () => {
    const result = await pipe.transform(validPayload, {
      type: 'body',
      metatype: RegistroRequest,
    });

    expect(result).toBeInstanceOf(RegistroRequest);
    expect(result).toEqual(validPayload);
  });

  it('rechaza correo inválido', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, correo: 'correo-invalido' },
        { type: 'body', metatype: RegistroRequest },
      ),
    ).rejects.toThrow();
  });

  it('rechaza password menor a 8 caracteres', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, password: '1234567' },
        { type: 'body', metatype: RegistroRequest },
      ),
    ).rejects.toThrow();
  });

  it('rechaza campos faltantes o vacíos', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, nombre: '' },
        { type: 'body', metatype: RegistroRequest },
      ),
    ).rejects.toThrow();

    await expect(
      pipe.transform(
        { correo: validPayload.correo },
        { type: 'body', metatype: RegistroRequest },
      ),
    ).rejects.toThrow();
  });

  it('rechaza edad fuera de rango (menor a 0 o mayor a 130) o no entera', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, edad: -1 },
        { type: 'body', metatype: RegistroRequest },
      ),
    ).rejects.toThrow();

    await expect(
      pipe.transform(
        { ...validPayload, edad: 131 },
        { type: 'body', metatype: RegistroRequest },
      ),
    ).rejects.toThrow();

    await expect(
      pipe.transform(
        { ...validPayload, edad: 28.5 },
        { type: 'body', metatype: RegistroRequest },
      ),
    ).rejects.toThrow();
  });

  it('rechaza campos extra no permitidos', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, usrId: '550e8400-e29b-41d4-a716-446655440000' },
        { type: 'body', metatype: RegistroRequest },
      ),
    ).rejects.toThrow();
  });
});
