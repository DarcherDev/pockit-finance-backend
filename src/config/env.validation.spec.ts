import { envValidationSchema } from './env.validation';

describe('envValidationSchema', () => {
  const validEnv = {
    DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/postgres',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    SUPABASE_SECRET_KEY: 'sb_secret_test',
    SUPABASE_JWKS_URL:
      'https://example.supabase.co/auth/v1/.well-known/jwks.json',
  };

  it('valida correctamente cuando están todas las variables obligatorias y aplica defaults', () => {
    const result = envValidationSchema.validate(validEnv, {
      allowUnknown: true,
    });

    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({
      PORT: 3000,
      DB_SSL: true,
      DB_LOGGING: false,
      CORS_ORIGINS: '',
    });
  });

  it('acepta valores booleanos en string para DB_SSL y DB_LOGGING', () => {
    const result = envValidationSchema.validate(
      {
        ...validEnv,
        PORT: '4000',
        DB_SSL: 'false',
        DB_LOGGING: 'true',
        CORS_ORIGINS: 'https://app.pockit.finance,http://localhost:5173',
      },
      { allowUnknown: true },
    );

    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({
      PORT: 4000,
      DB_SSL: false,
      DB_LOGGING: true,
      CORS_ORIGINS: 'https://app.pockit.finance,http://localhost:5173',
    });
  });

  it.each([
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_JWKS_URL',
  ])('falla si falta la variable obligatoria %s', (missingKey) => {
    const envCopy = { ...validEnv } as Record<string, unknown>;
    delete envCopy[missingKey];

    const { error } = envValidationSchema.validate(envCopy, {
      allowUnknown: true,
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain(missingKey);
  });

  it('falla si SUPABASE_URL no es una URL válida', () => {
    const { error } = envValidationSchema.validate(
      {
        ...validEnv,
        SUPABASE_URL: 'not-a-url',
      },
      { allowUnknown: true },
    );

    expect(error).toBeDefined();
  });
});
